import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { InvoiceRepository } from './repositories/invoice.repository';
import { SaleItemRepository } from './repositories/sale-item.repository';
import { PaymentTermRepository } from './repositories/payment-term.repository';
import { TransactionRepository } from './repositories/transaction.repository';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  RecordPaymentDto,
} from './dto/invoice.dto';
import { CreateSaleItemDto, UpdateSaleItemDto } from './dto/sale-item.dto';
import {
  CreatePaymentTermDto,
  UpdatePaymentTermDto,
} from './dto/payment-term.dto';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
} from './dto/transaction.dto';
import {
  InvoiceStatus,
  PaymentTermStatus,
  TransactionType,
  TransactionStatus,
  PaymentType,
} from './enums/financial.enum';
import { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../users/enums/user.enum';

@Injectable()
export class FinancialService {
  private readonly logger = new Logger(FinancialService.name);

  constructor(
    private readonly invoiceRepo: InvoiceRepository,
    private readonly saleItemRepo: SaleItemRepository,
    private readonly paymentTermRepo: PaymentTermRepository,
    private readonly txRepo: TransactionRepository,
  ) {}

  async createInvoice(dto: CreateInvoiceDto, user: RequestUser) {
    const saleNumber = await this.invoiceRepo.getNextSaleNumber();
    const invoiceNumber = await this.invoiceRepo.getNextInvoiceNumber();

    // Calculate line item totals
    const lineItems = (dto.lineItems ?? []).map((item) => ({
      ...item,
      saleItemId: item.saleItemId
        ? this.invoiceRepo.toObjectId(item.saleItemId)
        : undefined,
      total: item.quantity * item.unitPrice - (item.discount ?? 0),
      // Add missing required fields for variation
      sold: (item as any).sold ?? 0, // Provide default if not in DTO
    }));

    const subtotal = lineItems.reduce((sum, i) => sum + i.total, 0);
    const taxAmount = dto.taxAmount ?? 0;
    const discountAmount = dto.discountAmount ?? 0;
    const total = subtotal + taxAmount - discountAmount;

    const invoice = await this.invoiceRepo.create({
      saleNumber,
      invoiceNumber,
      organizationId: this.invoiceRepo.toObjectId(dto.organizationId),
      memberId: dto.memberId
        ? this.invoiceRepo.toObjectId(dto.memberId)
        : undefined,
      memberName: dto.memberName,
      memberEmail: dto.memberEmail,
      description: dto.description,
      lineItems,
      paymentTermId: dto.paymentTermId
        ? this.invoiceRepo.toObjectId(dto.paymentTermId)
        : undefined,
      paymentTermName: dto.paymentTermName,
      subtotal,
      taxAmount,
      discountAmount,
      total,
      amountPaid: 0,
      amountDue: total,
      amountOverdue: 0,
      placedAt: new Date(dto.placedAt),
      nextPaymentDate: dto.nextPaymentDate
        ? new Date(dto.nextPaymentDate)
        : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      status: dto.status ?? InvoiceStatus.OPEN,
      notes: dto.notes,
      createdBy: user._id as any,
    });

    this.logger.log(
      `Invoice created: ${invoiceNumber} (${saleNumber}) by ${user.email}`,
    );
    return invoice;
  }

  async findAllInvoices(
    page = 1,
    limit = 10,
    user: RequestUser,
    filters: {
      organizationId?: string;
      status?: string;
      memberId?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    } = {},
  ) {
    const filter: Record<string, any> = {};

    if (!user.isSuperAdmin && user.role !== UserRole.ADMIN) {
      filter['createdBy'] = this.invoiceRepo.toObjectId(user._id);
    }
    if (filters.organizationId)
      filter['organizationId'] = this.invoiceRepo.toObjectId(
        filters.organizationId,
      );
    if (filters.status) filter['status'] = filters.status;
    if (filters.memberId)
      filter['memberId'] = this.invoiceRepo.toObjectId(filters.memberId);

    if (filters.startDate || filters.endDate) {
      filter['placedAt'] = {};
      if (filters.startDate)
        filter['placedAt']['$gte'] = new Date(filters.startDate);
      if (filters.endDate)
        filter['placedAt']['$lte'] = new Date(filters.endDate);
    }

    if (filters.search) {
      Object.assign(
        filter,
        this.invoiceRepo.buildSearchFilter(
          [
            'saleNumber',
            'invoiceNumber',
            'description',
            'memberName',
            'memberEmail',
          ],
          filters.search,
        ),
      );
    }

    return this.invoiceRepo.findMany({
      filter,
      page,
      limit,
      sort: { placedAt: -1 },
      populate: [
        { path: 'memberId', select: 'email username profile' },
        { path: 'paymentTermId', select: 'name' },
      ],
    });
  }

  async findOneInvoice(id: string, user: RequestUser) {
    const invoice = await this.invoiceRepo.findByIdPopulated(id);
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    return invoice;
  }

  async updateInvoice(id: string, dto: UpdateInvoiceDto, user: RequestUser) {
    const invoice = await this.invoiceRepo.findByIdPopulated(id);
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    this.checkFinancialAccess(invoice, user);

    const payload: Record<string, any> = {};
    const scalar = [
      'description',
      'memberName',
      'memberEmail',
      'status',
      'paymentTermName',
      'notes',
    ];
    scalar.forEach((f) => {
      if ((dto as any)[f] !== undefined) payload[f] = (dto as any)[f];
    });

    if (dto.nextPaymentDate)
      payload['nextPaymentDate'] = new Date(dto.nextPaymentDate);
    if (dto.dueDate) payload['dueDate'] = new Date(dto.dueDate);
    if (dto.taxAmount !== undefined) payload['taxAmount'] = dto.taxAmount;
    if (dto.discountAmount !== undefined)
      payload['discountAmount'] = dto.discountAmount;

    if (dto.lineItems) {
      const lineItems = dto.lineItems.map((item) => ({
        ...item,
        saleItemId: item.saleItemId
          ? this.invoiceRepo.toObjectId(item.saleItemId)
          : undefined,
        total: item.quantity * item.unitPrice - (item.discount ?? 0),
        // Add missing required fields for variation
        sold: (item as any).sold ?? 0, // Provide default if not in DTO
      }));
      const subtotal = lineItems.reduce((sum, i) => sum + i.total, 0);
      const taxAmount = dto.taxAmount ?? invoice.taxAmount;
      const discountAmount = dto.discountAmount ?? invoice.discountAmount;
      const total = subtotal + taxAmount - discountAmount;
      payload['lineItems'] = lineItems;
      payload['subtotal'] = subtotal;
      payload['total'] = total;
      payload['amountDue'] = Math.max(0, total - invoice.amountPaid);
    }

    const updated = await this.invoiceRepo.updateById(id, { $set: payload });
    return updated!;
  }

  async recordPayment(id: string, dto: RecordPaymentDto, user: RequestUser) {
    const invoice = await this.invoiceRepo.findByIdPopulated(id);
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    this.checkFinancialAccess(invoice, user);

    if (dto.amount > invoice.amountDue + 0.01) {
      throw new BadRequestException(
        `Payment amount ($${dto.amount}) exceeds amount due ($${invoice.amountDue})`,
      );
    }

    // Create transaction
    const tx = await this.txRepo.create({
      organizationId: invoice.organizationId,
      invoiceId: invoice._id as any,
      invoiceNumber: invoice.invoiceNumber,
      saleNumber: invoice.saleNumber,
      description: `Payment for ${invoice.description}`,
      paidById: invoice.memberId,
      paidByName: invoice.memberName,
      paidByEmail: invoice.memberEmail,
      paymentType: PaymentType.ONLINE,
      paymentIdentifier: dto.paymentIdentifier,
      amount: dto.amount,
      feeAmount: 0,
      netAmount: dto.amount,
      type: TransactionType.PAYMENT,
      status: TransactionStatus.COMPLETED,
      transactionDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
      notes: dto.notes,
      installmentNumber: dto.installmentId ? 1 : 0,
      createdBy: user._id as any,
    });

    // Apply payment to invoice
    const updated = await this.invoiceRepo.applyPayment(id, dto.amount);

    this.logger.log(
      `Payment recorded: $${dto.amount} for invoice ${invoice.invoiceNumber}`,
    );
    return { invoice: updated, transaction: tx };
  }

  async deleteInvoice(id: string, user: RequestUser) {
    const invoice = await this.invoiceRepo.findByIdPopulated(id);
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    this.checkFinancialAccess(invoice, user);

    if (invoice.status === InvoiceStatus.PAID_IN_FULL) {
      throw new BadRequestException('Cannot delete a paid invoice');
    }

    await this.invoiceRepo.softDelete(id);
    return { message: 'Invoice deleted successfully' };
  }

  async createSaleItem(dto: CreateSaleItemDto, user: RequestUser) {
    const item = await this.saleItemRepo.create({
      organizationId: this.saleItemRepo.toObjectId(dto.organizationId),
      name: dto.name,
      description: dto.description,
      price: dto.price,
      priceOption: dto.priceOption,
      upfrontAmount: dto.upfrontAmount ?? 0,
      sku: dto.sku,
      hasInventoryLimit: dto.hasInventoryLimit ?? false,
      inventoryLimit: dto.inventoryLimit ?? 0,
      isActive: dto.isActive ?? true,
      totalSold: 0,
      totalRevenue: 0,
      createdBy: user._id as any,
    });

    this.logger.log(`Sale item created: "${item.name}" by ${user.email}`);
    return item;
  }

  async findAllSaleItems(
    page = 1,
    limit = 10,
    user: RequestUser,
    filters: {
      organizationId?: string;
      isActive?: string;
      search?: string;
    } = {},
  ) {
    const filter: Record<string, any> = {};

    if (filters.organizationId)
      filter['organizationId'] = this.saleItemRepo.toObjectId(
        filters.organizationId,
      );
    if (filters.isActive !== undefined)
      filter['isActive'] = filters.isActive === 'true';
    if (filters.search) {
      Object.assign(
        filter,
        this.saleItemRepo.buildSearchFilter(
          ['name', 'description', 'sku'],
          filters.search,
        ),
      );
    }

    return this.saleItemRepo.findMany({
      filter,
      page,
      limit,
      sort: { createdAt: -1 },
    });
  }

  async findOneSaleItem(id: string, user: RequestUser) {
    const item = await this.saleItemRepo.findByIdPopulated(id);
    if (!item) throw new NotFoundException(`Sale item ${id} not found`);
    return item;
  }

  async updateSaleItem(id: string, dto: UpdateSaleItemDto, user: RequestUser) {
    const item = await this.saleItemRepo.findByIdPopulated(id);
    if (!item) throw new NotFoundException(`Sale item ${id} not found`);

    const payload: Record<string, any> = {};
    const scalar = [
      'name',
      'description',
      'price',
      'priceOption',
      'upfrontAmount',
      'sku',
      'isActive',
      'hasInventoryLimit',
      'inventoryLimit',
    ];
    scalar.forEach((f) => {
      if ((dto as any)[f] !== undefined) payload[f] = (dto as any)[f];
    });
    if (dto.variations !== undefined) payload['variations'] = dto.variations;

    return (await this.saleItemRepo.updateById(id, { $set: payload }))!;
  }

  async addVariation(id: string, variation: any, user: RequestUser) {
    const item = await this.saleItemRepo.findById(id);
    if (!item) throw new NotFoundException(`Sale item ${id} not found`);
    return this.saleItemRepo.addVariation(id, {
      ...variation,
      sold: 0,
      isActive: true,
    });
  }

  async removeVariation(id: string, variationId: string, user: RequestUser) {
    const item = await this.saleItemRepo.findById(id);
    if (!item) throw new NotFoundException(`Sale item ${id} not found`);
    return this.saleItemRepo.removeVariation(id, variationId);
  }

  async deleteSaleItem(id: string, user: RequestUser) {
    const item = await this.saleItemRepo.findByIdPopulated(id);
    if (!item) throw new NotFoundException(`Sale item ${id} not found`);
    await this.saleItemRepo.softDelete(id);
    return { message: 'Sale item deleted successfully' };
  }

  async createPaymentTerm(dto: CreatePaymentTermDto, user: RequestUser) {
    const term = await this.paymentTermRepo.create({
      organizationId: this.paymentTermRepo.toObjectId(dto.organizationId),
      name: dto.name,
      description: dto.description,
      activeFrom: new Date(dto.activeFrom),
      activeTo: dto.activeTo ? new Date(dto.activeTo) : undefined,
      installmentCount: dto.installmentCount,
      installmentWindow: dto.installmentWindow,
      specificDayOfMonth: dto.specificDayOfMonth,
      specificDate: dto.specificDate ? new Date(dto.specificDate) : undefined,
      installments: (dto.installments ?? []).map((inst) => ({
        ...inst,
        installmentNumber: inst.installmentNumber,
        percentage: inst.percentage ?? 0, // Provide default
        fixedAmount: inst.fixedAmount ?? 0, // Provide default
        label: inst.label,
        specificDate: inst.specificDate
          ? new Date(inst.specificDate)
          : undefined,
      })),
      appliedToSaleItems: (dto.appliedToSaleItems ?? []).map((id) =>
        this.paymentTermRepo.toObjectId(id),
      ),
      appliedToSaleItemNames: dto.appliedToSaleItemNames ?? [],
      status: dto.status ?? PaymentTermStatus.ACTIVE,
      createdBy: user._id as any,
    });

    this.logger.log(`Payment term created: "${term.name}" by ${user.email}`);
    return term;
  }

  async findAllPaymentTerms(
    page = 1,
    limit = 10,
    user: RequestUser,
    filters: { organizationId?: string; status?: string; search?: string } = {},
  ) {
    const filter: Record<string, any> = {};

    if (filters.organizationId)
      filter['organizationId'] = this.paymentTermRepo.toObjectId(
        filters.organizationId,
      );
    if (filters.status) filter['status'] = filters.status;
    if (filters.search) {
      Object.assign(
        filter,
        this.paymentTermRepo.buildSearchFilter(
          ['name', 'description'],
          filters.search,
        ),
      );
    }

    return this.paymentTermRepo.findMany({
      filter,
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [{ path: 'appliedToSaleItems', select: 'name price' }],
    });
  }

  async findOnePaymentTerm(id: string, user: RequestUser) {
    const term = await this.paymentTermRepo.findByIdPopulated(id);
    if (!term) throw new NotFoundException(`Payment term ${id} not found`);
    return term;
  }

  async updatePaymentTerm(
    id: string,
    dto: UpdatePaymentTermDto,
    user: RequestUser,
  ) {
    const term = await this.paymentTermRepo.findByIdPopulated(id);
    if (!term) throw new NotFoundException(`Payment term ${id} not found`);

    const payload: Record<string, any> = {};
    const scalar = [
      'name',
      'description',
      'installmentCount',
      'installmentWindow',
      'specificDayOfMonth',
      'status',
    ];
    scalar.forEach((f) => {
      if ((dto as any)[f] !== undefined) payload[f] = (dto as any)[f];
    });

    if (dto.activeFrom) payload['activeFrom'] = new Date(dto.activeFrom);
    if (dto.activeTo) payload['activeTo'] = new Date(dto.activeTo);
    if (dto.specificDate) payload['specificDate'] = new Date(dto.specificDate);
    if (dto.installments) {
      payload['installments'] = dto.installments.map((i) => ({
        ...i,
        installmentNumber: i.installmentNumber,
        percentage: i.percentage ?? 0, // Provide default
        fixedAmount: i.fixedAmount ?? 0, // Provide default
        label: i.label,
        specificDate: i.specificDate ? new Date(i.specificDate) : undefined,
      }));
    }
    if (dto.appliedToSaleItems) {
      payload['appliedToSaleItems'] = dto.appliedToSaleItems.map((id) =>
        this.paymentTermRepo.toObjectId(id),
      );
    }
    if (dto.appliedToSaleItemNames)
      payload['appliedToSaleItemNames'] = dto.appliedToSaleItemNames;

    return (await this.paymentTermRepo.updateById(id, { $set: payload }))!;
  }

  async deletePaymentTerm(id: string, user: RequestUser) {
    const term = await this.paymentTermRepo.findByIdPopulated(id);
    if (!term) throw new NotFoundException(`Payment term ${id} not found`);
    await this.paymentTermRepo.softDelete(id);
    return { message: 'Payment term deleted successfully' };
  }

  async createTransaction(dto: CreateTransactionDto, user: RequestUser) {
    const tx = await this.txRepo.create({
      organizationId: this.txRepo.toObjectId(dto.organizationId),
      invoiceId: dto.invoiceId
        ? this.txRepo.toObjectId(dto.invoiceId)
        : undefined,
      invoiceNumber: dto.invoiceNumber,
      saleNumber: dto.saleNumber,
      description: dto.description,
      paidById: dto.paidById ? this.txRepo.toObjectId(dto.paidById) : undefined,
      paidByName: dto.paidByName,
      paidByEmail: dto.paidByEmail,
      paymentType: dto.paymentType,
      paymentIdentifier: dto.paymentIdentifier,
      amount: dto.amount,
      feeAmount: dto.feeAmount ?? 0,
      netAmount: dto.amount - (dto.feeAmount ?? 0),
      type: dto.type,
      status: dto.status ?? TransactionStatus.COMPLETED,
      transactionDate: new Date(dto.transactionDate),
      notes: dto.notes,
      installmentNumber: dto.installmentNumber,
      createdBy: user._id as any,
    });

    this.logger.log(
      `Transaction created: ${tx.transactionId} by ${user.email}`,
    );
    return tx;
  }

  async findAllTransactions(
    page = 1,
    limit = 10,
    user: RequestUser,
    filters: {
      organizationId?: string;
      invoiceId?: string;
      type?: string;
      status?: string;
      paymentType?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    } = {},
  ) {
    const filter: Record<string, any> = {};

    if (!user.isSuperAdmin && user.role !== UserRole.ADMIN) {
      filter['createdBy'] = this.txRepo.toObjectId(user._id);
    }
    if (filters.organizationId)
      filter['organizationId'] = this.txRepo.toObjectId(filters.organizationId);
    if (filters.invoiceId)
      filter['invoiceId'] = this.txRepo.toObjectId(filters.invoiceId);
    if (filters.type) filter['type'] = filters.type;
    if (filters.status) filter['status'] = filters.status;
    if (filters.paymentType) filter['paymentType'] = filters.paymentType;

    if (filters.startDate || filters.endDate) {
      filter['transactionDate'] = {};
      if (filters.startDate)
        filter['transactionDate']['$gte'] = new Date(filters.startDate);
      if (filters.endDate)
        filter['transactionDate']['$lte'] = new Date(filters.endDate);
    }

    if (filters.search) {
      Object.assign(
        filter,
        this.txRepo.buildSearchFilter(
          ['transactionId', 'description', 'paidByName', 'paymentIdentifier'],
          filters.search,
        ),
      );
    }

    return this.txRepo.findMany({
      filter,
      page,
      limit,
      sort: { transactionDate: -1 },
      populate: [
        { path: 'invoiceId', select: 'invoiceNumber saleNumber description' },
        { path: 'paidById', select: 'email username profile' },
      ],
    });
  }

  async findOneTransaction(id: string, user: RequestUser) {
    const tx = await this.txRepo.findByIdPopulated(id);
    if (!tx) throw new NotFoundException(`Transaction ${id} not found`);
    return tx;
  }

  async findTransactionsByInvoice(invoiceId: string, user: RequestUser) {
    return this.txRepo.findByInvoice(invoiceId);
  }

  async updateTransaction(
    id: string,
    dto: UpdateTransactionDto,
    user: RequestUser,
  ) {
    const tx = await this.txRepo.findByIdPopulated(id);
    if (!tx) throw new NotFoundException(`Transaction ${id} not found`);

    const payload: Record<string, any> = {};
    if (dto.status !== undefined) payload['status'] = dto.status;
    if (dto.notes !== undefined) payload['notes'] = dto.notes;

    return (await this.txRepo.updateById(id, { $set: payload }))!;
  }

  async getFinancialOverview(organizationId: string, user: RequestUser) {
    const orgId = this.invoiceRepo.toObjectId(organizationId);
    const base = { organizationId: orgId };

    const [summary, invoiceStats, txStats, saleItemStats] = await Promise.all([
      this.invoiceRepo.getFinancialSummary(organizationId),
      Promise.all([
        this.invoiceRepo.count(base),
        this.invoiceRepo.count({ ...base, status: InvoiceStatus.OPEN }),
        this.invoiceRepo.count({ ...base, status: InvoiceStatus.PAID_IN_FULL }),
        this.invoiceRepo.count({ ...base, status: InvoiceStatus.PAST_DUE }),
        this.invoiceRepo.count({ ...base, status: InvoiceStatus.DRAFT }),
      ]),
      Promise.all([
        this.txRepo.count(base),
        this.txRepo.getTotalByOrg(organizationId),
      ]),
      Promise.all([
        this.saleItemRepo.count(base),
        this.saleItemRepo.count({ ...base, isActive: true }),
      ]),
    ]);

    const [invTotal, invOpen, invPaid, invPastDue, invDraft] = invoiceStats;
    const [txTotal, txAmount] = txStats;
    const [siTotal, siActive] = saleItemStats;

    return {
      totalRevenue: summary.totalRevenue,
      totalOutstanding: summary.totalOutstanding,
      totalOverdue: summary.totalOverdue,
      invoices: {
        total: invTotal,
        open: invOpen,
        paidInFull: invPaid,
        pastDue: invPastDue,
        draft: invDraft,
      },
      transactions: { total: txTotal, totalAmount: txAmount },
      saleItems: { total: siTotal, active: siActive },
    };
  }

  // Helpers
  private checkFinancialAccess(doc: any, user: RequestUser): void {
    if (user.isSuperAdmin || user.role === UserRole.ADMIN) return;
    if (doc.createdBy?.toString() === user._id) return;
    throw new ForbiddenException('You do not have access to this record');
  }
}
