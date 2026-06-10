import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  InvoiceStatus,
  SaleItemPriceOption,
  InstallmentWindow,
  TransactionType,
  TransactionStatus,
  PaymentType,
  PaymentTermStatus,
} from '../enums/financial.enum';

export class InvoiceLineItemResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() unitPrice!: number;
  @ApiProperty() discount!: number;
  @ApiProperty() total!: number;
  @ApiPropertyOptional() saleItemId?: string;
}

export class PaymentScheduleEntryResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() dueDate!: Date;
  @ApiProperty() amount!: number;
  @ApiProperty() isPaid!: boolean;
  @ApiPropertyOptional() paidAt?: Date;
  @ApiProperty() installmentNumber!: number;
}

export class InvoiceResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() saleNumber!: string;
  @ApiProperty() invoiceNumber!: string;
  @ApiProperty() organizationId!: string;
  @ApiPropertyOptional() memberId?: string;
  @ApiPropertyOptional() memberName?: string;
  @ApiPropertyOptional() memberEmail?: string;
  @ApiProperty() description!: string;
  @ApiProperty({ type: [InvoiceLineItemResponseDto] })
  lineItems!: InvoiceLineItemResponseDto[];
  @ApiPropertyOptional() paymentTermName?: string;
  @ApiProperty({ type: [PaymentScheduleEntryResponseDto] })
  paymentSchedule!: PaymentScheduleEntryResponseDto[];
  @ApiProperty() subtotal!: number;
  @ApiProperty() taxAmount!: number;
  @ApiProperty() discountAmount!: number;
  @ApiProperty() total!: number;
  @ApiProperty() amountPaid!: number;
  @ApiProperty() amountDue!: number;
  @ApiProperty() balance!: number;
  @ApiProperty() placedAt!: Date;
  @ApiPropertyOptional() nextPaymentDate?: Date;
  @ApiPropertyOptional() dueDate?: Date;
  @ApiProperty({ enum: InvoiceStatus }) status!: InvoiceStatus;
  @ApiProperty() isPastDue!: boolean;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedInvoicesDto {
  @ApiProperty({ type: [InvoiceResponseDto] }) data!: InvoiceResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}

export class SaleItemVariationResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() priceAdjustment?: number;
  @ApiPropertyOptional() sku?: string;
  @ApiProperty() sold!: number;
  @ApiProperty() isActive!: boolean;
}

export class SaleItemResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() organizationId!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() price!: number;
  @ApiProperty({ enum: SaleItemPriceOption }) priceOption!: SaleItemPriceOption;
  @ApiProperty() upfrontAmount!: number;
  @ApiPropertyOptional() sku?: string;
  @ApiProperty({ type: [SaleItemVariationResponseDto] })
  variations!: SaleItemVariationResponseDto[];
  @ApiProperty() variationCount!: number;
  @ApiProperty() totalSold!: number;
  @ApiProperty() totalRevenue!: number;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() isAvailable!: boolean;
  @ApiProperty() hasInventoryLimit!: boolean;
  @ApiPropertyOptional() inventoryLimit?: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedSaleItemsDto {
  @ApiProperty({ type: [SaleItemResponseDto] }) data!: SaleItemResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}

export class InstallmentDefinitionResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() installmentNumber!: number;
  @ApiPropertyOptional() percentage?: number;
  @ApiPropertyOptional() fixedAmount?: number;
  @ApiPropertyOptional() label?: string;
  @ApiPropertyOptional() specificDate?: Date;
}

export class PaymentTermResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() organizationId!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() activeFrom!: Date;
  @ApiPropertyOptional() activeTo?: Date;
  @ApiProperty() installmentCount!: number;
  @ApiProperty({ enum: InstallmentWindow })
  installmentWindow!: InstallmentWindow;
  @ApiPropertyOptional() specificDayOfMonth?: number;
  @ApiPropertyOptional() specificDate?: Date;
  @ApiProperty({ type: [InstallmentDefinitionResponseDto] })
  installments!: InstallmentDefinitionResponseDto[];
  @ApiProperty() appliedToSaleItems!: string[];
  @ApiProperty() appliedToSaleItemNames!: string[];
  @ApiProperty({ enum: PaymentTermStatus }) status!: PaymentTermStatus;
  @ApiProperty() isCurrentlyActive!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedPaymentTermsDto {
  @ApiProperty({ type: [PaymentTermResponseDto] })
  data!: PaymentTermResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}

export class TransactionResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() organizationId!: string;
  @ApiProperty() transactionId!: string;
  @ApiPropertyOptional() invoiceId?: string;
  @ApiPropertyOptional() invoiceNumber?: string;
  @ApiPropertyOptional() saleNumber?: string;
  @ApiProperty() description!: string;
  @ApiPropertyOptional() paidById?: string;
  @ApiPropertyOptional() paidByName?: string;
  @ApiPropertyOptional() paidByEmail?: string;
  @ApiProperty({ enum: PaymentType }) paymentType!: PaymentType;
  @ApiPropertyOptional() paymentIdentifier?: string;
  @ApiProperty() amount!: number;
  @ApiProperty() feeAmount!: number;
  @ApiProperty() netAmount!: number;
  @ApiProperty({ enum: TransactionType }) type!: TransactionType;
  @ApiProperty({ enum: TransactionStatus }) status!: TransactionStatus;
  @ApiProperty() transactionDate!: Date;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() installmentNumber?: number;
  @ApiProperty() createdAt!: Date;
}

export class PaginatedTransactionsDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  data!: TransactionResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}

export class FinancialOverviewDto {
  @ApiProperty() totalRevenue!: number;
  @ApiProperty() totalOutstanding!: number;
  @ApiProperty() totalOverdue!: number;
  @ApiProperty() invoices!: {
    total: number;
    open: number;
    paidInFull: number;
    pastDue: number;
    draft: number;
  };
  @ApiProperty() transactions!: { total: number; totalAmount: number };
  @ApiProperty() saleItems!: { total: number; active: number };
}
