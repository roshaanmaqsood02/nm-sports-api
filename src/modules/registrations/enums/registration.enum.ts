export enum RegistrationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum RegistrationStep {
  STEP_1 = 1,
  STEP_2 = 2,
  STEP_3 = 3,
  STEP_4 = 4,
  STEP_5 = 5,
  STEP_6 = 6,
}

export enum CompletionTimeline {
  STANDARD = 'standard_5_business_days',
  RUSH = 'rush_2_business_days',
}

export enum SessionType {
  NEW = 'new_registration_session',
  COPY = 'copy_existing_session',
}

export enum WhoRegistering {
  PARENT_GUARDIAN = 'parent_guardian_registering_child',
  SELF = 'person_registering_themselves',
  COACH_MANAGER = 'coach_team_manager_registering_team',
  OTHER = 'other',
}

export enum SignupType {
  INDIVIDUAL = 'individual',
  TEAM = 'team',
  FAMILY = 'family',
  OTHER = 'other',
}

export enum ProcessingFeeResponsibility {
  REGISTRANT = 'registrant_pays',
  ORGANIZATION = 'organization_covers',
}

export enum PaymentTerm {
  PAY_IN_FULL = 'pay_in_full',
  CUSTOM_TERMS = 'custom_payment_terms',
}

export enum ContactMethod {
  EMAIL = 'email',
  PHONE = 'phone',
}

export enum CustomTermsCount {
  ONE = 1,
  TWO = 2,
  THREE = 3,
}
