export enum MatchStatus {
  SCHEDULED = 'scheduled',
  POSTPONED = 'postponed',
  CANCELLED = 'cancelled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  WALKOVER = 'walkover',
}

export enum MatchType {
  FRIENDLY = 'friendly',
  LEAGUE = 'league',
  CUP = 'cup',
  PLAYOFF = 'playoff',
  SEMIFINAL = 'semifinal',
  FINAL = 'final',
  QUALIFIER = 'qualifier',
  TOURNAMENT = 'tournament',
  TRAINING = 'training',
}

export enum MatchEventType {
  GOAL = 'goal',
  ASSIST = 'assist',
  YELLOW_CARD = 'yellow_card',
  RED_CARD = 'red_card',
  SUBSTITUTION = 'substitution',
  INJURY = 'injury',
  PENALTY = 'penalty',
  OWN_GOAL = 'own_goal',
  KICKOFF = 'kickoff',
  HALFTIME = 'halftime',
  FULLTIME = 'fulltime',

  WICKET = 'wicket',
  BOUNDARY_4 = 'boundary_4',
  BOUNDARY_6 = 'boundary_6',
  OVER_COMPLETE = 'over_complete',
  DRINKS_BREAK = 'drinks_break',

  TIMEOUT = 'timeout',
  FOUL = 'foul',
  FREE_THROW = 'free_throw',

  NOTE = 'note',
}

export enum MatchResultType {
  HOME_WIN = 'home_win',
  AWAY_WIN = 'away_win',
  DRAW = 'draw',
  CANCELLED = 'cancelled',
  WALKOVER = 'walkover',
}

export enum MatchVenueType {
  HOME = 'home',
  AWAY = 'away',
  NEUTRAL = 'neutral',
}
