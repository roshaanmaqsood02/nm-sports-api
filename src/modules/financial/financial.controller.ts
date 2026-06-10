import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FinancialService } from './financial.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  RecordPaymentDto,
} from './dto/invoice.dto';
import {
  CreateSaleItemDto,
  UpdateSaleItemDto,
  SaleItemVariationDto,
} from './dto/sale-item.dto';
import {
  CreatePaymentTermDto,
  UpdatePaymentTermDto,
} from './dto/payment-term.dto';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
} from './dto/transaction.dto';
import {
  InvoiceResponseDto,
  PaginatedInvoicesDto,
  SaleItemResponseDto,
  PaginatedSaleItemsDto,
  PaymentTermResponseDto,
  PaginatedPaymentTermsDto,
  TransactionResponseDto,
  PaginatedTransactionsDto,
  FinancialOverviewDto,
} from './dto/financial-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import {
  InvoiceStatus,
  SaleItemPriceOption,
  InstallmentWindow,
  TransactionType,
  TransactionStatus,
  PaymentType,
  PaymentTermStatus,
} from './enums/financial.enum';

@ApiTags('Financial')
@ApiBearerAuth('JWT-auth')
@Controller('financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get('overview/:organizationId')
  @ApiOperation({
    summary: 'Financial overview — revenue, outstanding, overdue, counts',
  })
  @ApiParam({ name: 'organizationId' })
  @ApiResponse({ status: 200, type: FinancialOverviewDto })
  getOverview(
    @Param('organizationId') orgId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.financialService.getFinancialOverview(orgId, user);
  }

  @Post('invoices')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create invoice (order)',
    description:
      'Creates an order/invoice. Auto-generates saleNumber (WOKL16265) and invoiceNumber (INV-2024-00001).',
  })
  @ApiResponse({ status: 201, type: InvoiceResponseDto })
  createInvoice(
    @Body() dto: CreateInvoiceDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.financialService.createInvoice(dto, user);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List all invoices/orders with filters' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: InvoiceStatus,
    description:
      'Filter: all (omit), open, paid_in_full, past_due, cancelled, draft',
  })
  @ApiQuery({ name: 'memberId', required: false })
  @ApiQuery({ name: 'startDate', required: false, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2024-12-31' })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, type: PaginatedInvoicesDto })
  findAllInvoices(
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('organizationId') organizationId?: string,
    @Query('status') status?: string,
    @Query('memberId') memberId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.financialService.findAllInvoices(+page, +limit, user, {
      organizationId,
      status,
      memberId,
      startDate,
      endDate,
      search,
    });
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  findOneInvoice(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.financialService.findOneInvoice(id, user);
  }

  @Patch('invoices/:id')
  @ApiOperation({ summary: 'Update invoice' })
  @ApiParam({ name: 'id' })
  updateInvoice(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.financialService.updateInvoice(id, dto, user);
  }

  @Post('invoices/:id/payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Record a payment on an invoice — creates a transaction + updates balance',
  })
  @ApiParam({ name: 'id' })
  recordPayment(
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.financialService.recordPayment(id, dto, user);
  }

  @Get('invoices/:id/transactions')
  @ApiOperation({ summary: 'Get all transactions for an invoice' })
  @ApiParam({ name: 'id' })
  getInvoiceTransactions(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.financialService.findTransactionsByInvoice(id, user);
  }

  @Delete('invoices/:id')
  @ApiOperation({ summary: 'Delete invoice (soft delete)' })
  @ApiParam({ name: 'id' })
  deleteInvoice(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.financialService.deleteInvoice(id, user);
  }

  @Post('sale-items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a sale item',
    description:
      'name, price, priceOption (full/partial/nothing upfront), optional sku, variations',
  })
  @ApiResponse({ status: 201, type: SaleItemResponseDto })
  createSaleItem(
    @Body() dto: CreateSaleItemDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.financialService.createSaleItem(dto, user);
  }

  @Get('sale-items')
  @ApiOperation({
    summary: 'List sale items — created, name, variations, total, sold',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'isActive', required: false, example: 'true' })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, type: PaginatedSaleItemsDto })
  findAllSaleItems(
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('organizationId') organizationId?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    return this.financialService.findAllSaleItems(+page, +limit, user, {
      organizationId,
      isActive,
      search,
    });
  }

  @Get('sale-items/:id')
  @ApiOperation({ summary: 'Get sale item by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: SaleItemResponseDto })
  findOneSaleItem(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.financialService.findOneSaleItem(id, user);
  }

  @Patch('sale-items/:id')
  @ApiOperation({ summary: 'Update sale item' })
  @ApiParam({ name: 'id' })
  updateSaleItem(
    @Param('id') id: string,
    @Body() dto: UpdateSaleItemDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.financialService.updateSaleItem(id, dto, user);
  }

  @Post('sale-items/:id/variations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a variation to a sale item' })
  @ApiParam({ name: 'id' })
  addVariation(
    @Param('id') id: string,
    @Body() dto: SaleItemVariationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.financialService.addVariation(id, dto, user);
  }

  @Delete('sale-items/:id/variations/:variationId')
  @ApiOperation({ summary: 'Remove a variation from a sale item' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'variationId' })
  removeVariation(
    @Param('id') id: string,
    @Param('variationId') variationId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.financialService.removeVariation(id, variationId, user);
  }

  @Delete('sale-items/:id')
  @ApiOperation({ summary: 'Delete sale item' })
  @ApiParam({ name: 'id' })
  deleteSaleItem(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.financialService.deleteSaleItem(id, user);
  }

  @Post('payment-terms')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a payment term',
    description:
      'name, description, active dates, installmentCount, installmentWindow ' +
      '(every_30_days | first_day_of_each_month | specific_date), applied to sale items.',
  })
  @ApiResponse({ status: 201, type: PaymentTermResponseDto })
  createPaymentTerm(
    @Body() dto: CreatePaymentTermDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.financialService.createPaymentTerm(dto, user);
  }

  @Get('payment-terms')
  @ApiOperation({
    summary:
      'List payment terms — name, active dates, installments, applied to',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: PaymentTermStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, type: PaginatedPaymentTermsDto })
  findAllPaymentTerms(
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('organizationId') organizationId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.financialService.findAllPaymentTerms(+page, +limit, user, {
      organizationId,
      status,
      search,
    });
  }

  @Get('payment-terms/:id')
  @ApiOperation({ summary: 'Get payment term by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: PaymentTermResponseDto })
  findOnePaymentTerm(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.financialService.findOnePaymentTerm(id, user);
  }

  @Patch('payment-terms/:id')
  @ApiOperation({ summary: 'Update payment term' })
  @ApiParam({ name: 'id' })
  updatePaymentTerm(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentTermDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.financialService.updatePaymentTerm(id, dto, user);
  }

  @Delete('payment-terms/:id')
  @ApiOperation({ summary: 'Delete payment term' })
  @ApiParam({ name: 'id' })
  deletePaymentTerm(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.financialService.deletePaymentTerm(id, user);
  }

  @Post('transactions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a transaction record manually' })
  @ApiResponse({ status: 201, type: TransactionResponseDto })
  createTransaction(
    @Body() dto: CreateTransactionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.financialService.createTransaction(dto, user);
  }

  @Get('transactions')
  @ApiOperation({
    summary:
      'List transactions — date, transactionId, description, paidBy, paymentType, amount, type, status',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'invoiceId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: TransactionType })
  @ApiQuery({ name: 'status', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'paymentType', required: false, enum: PaymentType })
  @ApiQuery({ name: 'startDate', required: false, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2024-12-31' })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, type: PaginatedTransactionsDto })
  findAllTransactions(
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('organizationId') organizationId?: string,
    @Query('invoiceId') invoiceId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('paymentType') paymentType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.financialService.findAllTransactions(+page, +limit, user, {
      organizationId,
      invoiceId,
      type,
      status,
      paymentType,
      startDate,
      endDate,
      search,
    });
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  findOneTransaction(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.financialService.findOneTransaction(id, user);
  }

  @Patch('transactions/:id')
  @ApiOperation({ summary: 'Update transaction (status or notes)' })
  @ApiParam({ name: 'id' })
  updateTransaction(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.financialService.updateTransaction(id, dto, user);
  }
}
