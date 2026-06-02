export enum LeagueStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  COMPLETED = 'completed',
  UPCOMING = 'upcoming',
  SUSPENDED = 'suspended',
}

export enum GameStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  POSTPONED = 'postponed',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
}

export enum PlayerStatFilter {
  SCORING = 'scoring',
  REBOUNDS = 'rebounds',
  MISC = 'misc',
}

export enum TeamStatFilter {
  TEAM_RECORD = 'team_record',
  PLAYER = 'player',
  SCORING = 'scoring',
  REBOUNDS = 'rebounds',
  MISC = 'misc',
}
