export enum GameStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
  FORFEITED = 'forfeited',
}

export enum GameType {
  HOME = 'home',
  AWAY = 'away',
  NEUTRAL = 'neutral',
}

export enum GameVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  TEAM = 'team_only',
}
