export enum PlayerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  INJURED = 'injured',
  SUSPENDED = 'suspended',
  RETIRED = 'retired',
  TRANSFER = 'on_transfer',
  TRIAL = 'trial',
}

export enum PlayerFoot {
  LEFT = 'left',
  RIGHT = 'right',
  BOTH = 'both',
}

export enum PlayerGender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non_binary',
}

export enum InjuryStatus {
  ACTIVE = 'active',
  RECOVERED = 'recovered',
  CHRONIC = 'chronic',
}

export enum InjurySeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  CRITICAL = 'critical',
}

export enum DocumentType {
  CONTRACT = 'contract',
  MEDICAL = 'medical',
  IDENTIFICATION = 'identification',
  TRANSFER = 'transfer',
  OTHER = 'other',
}
