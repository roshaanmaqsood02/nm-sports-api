import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';
import { InvoiceRepository } from './repositories/invoice.repository';
import { SaleItemRepository } from './repositories/sale-item.repository';
import { PaymentTermRepository } from './repositories/payment-term.repository';
import { TransactionRepository } from './repositories/transaction.repository';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';
import { SaleItem, SaleItemSchema } from './schemas/sale-item.schema';
import { PaymentTerm, PaymentTermSchema } from './schemas/payment-term.schema';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: SaleItem.name, schema: SaleItemSchema },
      { name: PaymentTerm.name, schema: PaymentTermSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [FinancialController],
  providers: [
    FinancialService,
    InvoiceRepository,
    SaleItemRepository,
    PaymentTermRepository,
    TransactionRepository,
  ],
  exports: [FinancialService],
})
export class FinancialModule {}
