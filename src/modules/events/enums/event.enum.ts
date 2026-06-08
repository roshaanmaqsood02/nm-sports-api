export enum EventStatus {
  UPCOMING = 'upcoming',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum RepeatFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

export enum EventVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  TEAM = 'team_only',
}

export enum EventType {
  PRACTICE = 'practice',
  TRAINING = 'training',
  MEETING = 'meeting',
  TOURNAMENT = 'tournament',
  SOCIAL = 'social',
  FUNDRAISER = 'fundraiser',
  CAMP = 'camp',
  CLINIC = 'clinic',
  OTHER = 'other',
}
