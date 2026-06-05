import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  RegistrationStatus,
  CompletionTimeline,
  SessionType,
  WhoRegistering,
  SignupType,
  ProcessingFeeResponsibility,
  PaymentTerm,
  ContactMethod,
} from '../enums/registration.enum';

export type RegistrationDocument = Registration & Document;

@Schema({ _id: true })
export class UploadedDocument {
  @Prop({ trim: true }) filename!: string;
  @Prop({ trim: true }) url!: string;
  @Prop({ trim: true }) path!: string;
  @Prop({ trim: true }) mimeType!: string;
  @Prop({ default: 0 }) size!: number;
  @Prop({ trim: true }) title?: string;
}

export const UploadedDocumentSchema =
  SchemaFactory.createForClass(UploadedDocument);

@Schema({ _id: false })
export class ContactPerson {
  @Prop({ trim: true }) firstName!: string;
  @Prop({ trim: true }) lastName!: string;
  @Prop({ trim: true }) phone?: string;
  @Prop({ trim: true, lowercase: true }) email!: string;
  @Prop({ trim: true, lowercase: true }) confirmEmail!: string;
}

@Schema({ _id: false })
export class CustomPaymentTerm {
  @Prop({ trim: true }) label!: string;
  @Prop({ default: 0 }) amount!: number;
  @Prop() dueDate?: Date;
  @Prop({ trim: true }) description?: string;
}

@Schema({ _id: false })
export class Signature {
  @Prop({ trim: true }) signatureData!: string;
  @Prop({ trim: true }) signedBy!: string;
  @Prop({ trim: true }) ipAddress?: string;
  @Prop() signedAt!: Date;
  @Prop({ default: false }) agreed!: boolean;
}

// Step 1 schema
@Schema({ _id: false })
export class Step1Data {
  @Prop({ required: false })
  usedBefore?: boolean;

  @Prop({ type: String, enum: SessionType, required: false })
  sessionType?: SessionType;

  @Prop({ type: String, enum: CompletionTimeline, required: false })
  completionTimeline?: CompletionTimeline;

  @Prop({ default: false })
  hasRushFee?: boolean;

  @Prop({ required: false })
  expectedCompletionDate?: Date;

  @Prop({ trim: true })
  newRegistrationTitle?: string;

  @Prop({ trim: true })
  organizationName?: string;

  @Prop({ trim: true })
  sport?: string;

  @Prop({ type: String, enum: SignupType })
  signupType?: SignupType;

  @Prop({ trim: true })
  copySourceUrl?: string;

  @Prop()
  copyToSameWebsite?: boolean;

  @Prop()
  needChanges?: boolean;

  @Prop({ trim: true, maxlength: 5000 })
  changesNeeded?: string;

  @Prop()
  collectingMoney?: boolean;

  @Prop()
  limitRegistrations?: boolean;

  @Prop({ trim: true, maxlength: 500 })
  inventoryRestrictions?: string;

  @Prop()
  uploadDocumentation?: boolean;

  @Prop({ default: 0 })
  documentCount?: number;

  @Prop({ type: [UploadedDocumentSchema], default: [] })
  documents?: UploadedDocument[];

  @Prop()
  includesBackgroundScreen?: boolean;
}

// STEP 2 SCHEMA
@Schema({ _id: false })
export class Step2Data {
  @Prop({ trim: true })
  organizationName?: string;

  @Prop({ trim: true })
  websiteUrl?: string;

  @Prop({ trim: true })
  country?: string;

  @Prop({ trim: true })
  state?: string;

  @Prop({ trim: true })
  registrationTitle?: string;

  @Prop({ type: String, enum: WhoRegistering })
  whoRegistering?: WhoRegistering;

  @Prop({ trim: true })
  otherWhoRegistering?: string;

  @Prop({ trim: true })
  sport?: string;

  @Prop({ trim: true })
  registrationType?: string;

  @Prop({ trim: true })
  otherRegistrationType?: string;

  @Prop({ default: false })
  addHeadsUpWaiver?: boolean;

  @Prop({ default: false })
  validateMembershipIds?: boolean;

  @Prop({ trim: true })
  registrationTemplate?: string;

  @Prop({ default: false })
  collectDivisionsAgeGroups?: boolean;

  @Prop({ default: false })
  collectAdditionalRequests?: boolean;

  @Prop({ default: false })
  collectWaivers?: boolean;

  @Prop({ default: false })
  collectHeadsUpWaiver?: boolean;

  @Prop({ trim: true, maxlength: 2000 })
  additionalQuestions?: string;

  @Prop({ trim: true, maxlength: 500 })
  divisionsAgeGroups?: string;

  @Prop({ type: UploadedDocumentSchema })
  waiverDocument?: UploadedDocument;

  @Prop()
  uploadSupportingDocs?: boolean;

  @Prop({ default: 0 })
  supportingDocCount?: number;

  @Prop({ type: [UploadedDocumentSchema], default: [] })
  supportingDocuments?: UploadedDocument[];

  @Prop({ default: false })
  limitRegistrations?: boolean;

  @Prop({ trim: true, maxlength: 500 })
  inventoryRestrictions?: string;

  @Prop({ default: false })
  needVolunteerBuyout?: boolean;

  @Prop({ trim: true, maxlength: 2000 })
  volunteerBuyoutRequirements?: string;

  @Prop({ type: String, enum: ProcessingFeeResponsibility })
  processingFeeResponsibility?: ProcessingFeeResponsibility;

  @Prop({ trim: true, maxlength: 2000 })
  totalCostDetails?: string;

  @Prop({ type: String, enum: PaymentTerm })
  paymentTerm?: PaymentTerm;

  @Prop({ type: Number, enum: [1, 2, 3] })
  customTermsCount?: number;

  @Prop({ type: [CustomPaymentTerm], default: [] })
  customPaymentTerms?: CustomPaymentTerm[];
}

// STEP 3 SCHEMA
@Schema({ _id: false })
export class Step3Data {
  @Prop({ type: ContactPerson })
  publicContact?: ContactPerson;

  @Prop({ default: false })
  notifyOnEveryRegistration?: boolean;

  @Prop({ default: false })
  internalContactSameAsPublic?: boolean;

  @Prop({ type: ContactPerson })
  internalContact?: ContactPerson;

  @Prop({ type: String, enum: ContactMethod })
  preferredContactMethod?: ContactMethod;

  @Prop({ default: false })
  participateInResearch?: boolean;
}

// STEP 4 SCHEMA — Agreement & Signature
@Schema({ _id: false })
export class Step4Data {
  @Prop({ type: Signature })
  signature?: Signature;

  @Prop({ default: false })
  agreedToTerms!: boolean;

  @Prop()
  agreedAt?: Date;
}

// STEP 5 SCHEMA — Payment
@Schema({ _id: false })
export class Step5Data {
  @Prop({ default: 0 })
  rushFeeAmount?: number;

  @Prop({ default: 0 })
  totalAmount?: number;

  @Prop({ default: false })
  paymentCompleted?: boolean;

  @Prop()
  paymentCompletedAt?: Date;

  @Prop({ trim: true })
  paymentNotes?: string;
}

// MAIN REGISTRATION SCHEMA
@Schema({
  timestamps: true,
  collection: 'registrations',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Registration {
  @Prop({ unique: true, trim: true, index: true })
  referenceNumber!: string;

  @Prop({ type: Types.ObjectId, ref: 'Organization', index: true })
  organizationId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  submittedBy!: Types.ObjectId;

  @Prop({
    type: Number,
    enum: [1, 2, 3, 4, 5, 6],
    default: 1,
  })
  currentStep!: number;

  @Prop({ type: Step1Data, default: {} })
  step1!: Step1Data;

  @Prop({ type: Step2Data, default: {} })
  step2!: Step2Data;

  @Prop({ type: Step3Data, default: {} })
  step3!: Step3Data;

  @Prop({ type: Step4Data, default: {} })
  step4!: Step4Data;

  @Prop({ type: Step5Data, default: {} })
  step5!: Step5Data;

  @Prop({
    type: String,
    enum: RegistrationStatus,
    default: RegistrationStatus.DRAFT,
    index: true,
  })
  status!: RegistrationStatus;

  @Prop({ trim: true, maxlength: 2000 })
  adminNotes?: string;

  @Prop()
  completedAt?: Date;

  @Prop({ default: false }) isDeleted!: boolean;
  @Prop() deletedAt?: Date;
}

export const RegistrationSchema = SchemaFactory.createForClass(Registration);

RegistrationSchema.virtual('isComplete').get(function (
  this: RegistrationDocument,
) {
  return this.currentStep === 6 && this.status === RegistrationStatus.SUBMITTED;
});

RegistrationSchema.virtual('isRush').get(function (this: RegistrationDocument) {
  return this.step1?.completionTimeline === CompletionTimeline.RUSH;
});

// Indexes
RegistrationSchema.index({ organizationId: 1, status: 1 });
RegistrationSchema.index({ submittedBy: 1, status: 1 });
RegistrationSchema.index({ referenceNumber: 1 });
RegistrationSchema.index({ createdAt: -1 });
