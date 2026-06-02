// ─── Cache key prefixes ───────────────────────────────────────────────────────
export const CACHE_KEYS = {
  // Auth
  USER_PROFILE: (id: string) => `user:profile:${id}`,
  USER_PERMISSIONS: (id: string) => `user:permissions:${id}`,

  // Organizations
  ORG: (id: string) => `org:${id}`,
  ORG_LIST: (userId: string) => `org:list:${userId}`,

  // Teams
  TEAM: (id: string) => `team:${id}`,
  TEAM_LIST: (orgId: string) => `team:list:${orgId}`,

  // Players
  PLAYER: (id: string) => `player:${id}`,
  PLAYER_LIST: (orgId: string) => `player:list:${orgId}`,

  // Leagues
  LEAGUE: (id: string) => `league:${id}`,
  LEAGUE_GAMES: (id: string) => `league:games:${id}`,
  LEAGUE_PLAYER_STATS: (id: string) => `league:player-stats:${id}`,
  LEAGUE_TEAM_STATS: (id: string) => `league:team-stats:${id}`,

  // Roles & Permissions
  ROLES_ALL: () => `roles:all`,
  PERMISSIONS_ALL: () => `permissions:all`,
  PERMISSIONS_GROUPED: () => `permissions:grouped`,

  // Divisions & Clubs
  DIVISION_LIST: (orgId: string) => `division:list:${orgId}`,
  CLUB_LIST: (orgId: string) => `club:list:${orgId}`,

  // Stats
  USER_STATS: () => `stats:users`,
  ORG_STATS: (userId: string) => `stats:orgs:${userId}`,
  TEAM_STATS: (userId: string) => `stats:teams:${userId}`,
  PLAYER_STATS: (userId: string) => `stats:players:${userId}`,
} as const;

// ─── TTL constants (seconds) ──────────────────────────────────────────────────
export const CACHE_TTL = {
  SHORT: 60, //  1 minute  — live/frequently changing data
  DEFAULT: 300, //  5 minutes — standard API responses
  MEDIUM: 900, // 15 minutes — semi-static data
  LONG: 3600, //  1 hour    — mostly static data
  VERY_LONG: 86400, //  1 day     — rarely changing data
} as const;

// ─── Cache tag prefixes for bulk invalidation ─────────────────────────────────
export const CACHE_TAGS = {
  ORG: (id: string) => `tag:org:${id}`,
  LEAGUE: (id: string) => `tag:league:${id}`,
  TEAM: (id: string) => `tag:team:${id}`,
  PLAYER: (id: string) => `tag:player:${id}`,
  USER: (id: string) => `tag:user:${id}`,
} as const;
