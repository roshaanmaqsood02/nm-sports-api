export enum InvoiceStatus {
  OPEN = 'open',
  PAID_IN_FULL = 'paid_in_full',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  DRAFT = 'draft',
}

export enum SaleItemPriceOption {
  FULL_PRICE_UP_FRONT = 'full_price_due_upfront',
  PARTIAL_AMOUNT_UP_FRONT = 'partial_amount_due_upfront',
  NOTHING_DUE_UP_FRONT = 'nothing_due_upfront',
}

export enum InstallmentWindow {
  EVERY_30_DAYS = 'every_30_days',
  FIRST_DAY_OF_MONTH = 'first_day_of_each_month',
  SPECIFIC_DATE = 'specific_date',
}

export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  CREDIT = 'credit',
  ADJUSTMENT = 'adjustment',
  FEE = 'fee',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentType {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  CHECK = 'check',
  ONLINE = 'online',
  OTHER = 'other',
}

export enum PaymentTermStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
