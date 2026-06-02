export enum TournamentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
}

export enum TournamentFormat {
  SINGLE_ELIMINATION = 'single_elimination',
  DOUBLE_ELIMINATION = 'double_elimination',
  ROUND_ROBIN = 'round_robin',
  GROUP_STAGE = 'group_stage',
  GROUP_KNOCKOUT = 'group_knockout', // groups → knockout
  SWISS = 'swiss',
  LEAGUE = 'league',
  CUSTOM = 'custom',
}

export enum TournamentTeamStatus {
  REGISTERED = 'registered',
  CONFIRMED = 'confirmed',
  WITHDRAWN = 'withdrawn',
  DISQUALIFIED = 'disqualified',
  ELIMINATED = 'eliminated',
  WINNER = 'winner',
  RUNNER_UP = 'runner_up',
}

export enum BracketRound {
  ROUND_OF_64 = 'round_of_64',
  ROUND_OF_32 = 'round_of_32',
  ROUND_OF_16 = 'round_of_16',
  QUARTER_FINAL = 'quarter_final',
  SEMI_FINAL = 'semi_final',
  THIRD_PLACE = 'third_place',
  FINAL = 'final',
  GROUP_STAGE = 'group_stage',
  SWISS_ROUND = 'swiss_round',
  CUSTOM = 'custom',
}

export enum BracketMatchStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  WALKOVER = 'walkover',
  CANCELLED = 'cancelled',
}

export enum TournamentVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  INVITE = 'invite_only',
}
