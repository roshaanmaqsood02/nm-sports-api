export enum NotificationType {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  PASSWORD_CHANGED = 'password_changed',
  LOGIN_ALERT = 'login_alert',

  ORG_CREATED = 'org_created',
  ORG_UPDATED = 'org_updated',
  ORG_MEMBER_ADDED = 'org_member_added',
  ORG_MEMBER_REMOVED = 'org_member_removed',

  TEAM_CREATED = 'team_created',
  TEAM_UPDATED = 'team_updated',
  TEAM_MEMBER_ADDED = 'team_member_added',
  TEAM_MEMBER_REMOVED = 'team_member_removed',

  MATCH_SCHEDULED = 'match_scheduled',
  MATCH_STARTED = 'match_started',
  MATCH_COMPLETED = 'match_completed',
  MATCH_CANCELLED = 'match_cancelled',
  MATCH_REMINDER = 'match_reminder',
  SCORE_UPDATED = 'score_updated',

  TOURNAMENT_CREATED = 'tournament_created',
  TOURNAMENT_STARTED = 'tournament_started',
  TOURNAMENT_COMPLETED = 'tournament_completed',
  REGISTRATION_OPEN = 'registration_open',
  TEAM_REGISTERED = 'team_registered',
  BRACKET_GENERATED = 'bracket_generated',

  PLAYER_ADDED = 'player_added',
  INJURY_REPORTED = 'injury_reported',
  INJURY_RECOVERED = 'injury_recovered',
  CONTRACT_EXPIRING = 'contract_expiring',
  TRANSFER_INITIATED = 'transfer_initiated',

  LEAGUE_GAME_ADDED = 'league_game_added',
  STANDINGS_UPDATED = 'standings_updated',
  POWER_RANKING_PUBLISHED = 'power_ranking_published',

  STAFF_INVITED = 'staff_invited',
  STAFF_INVITATION_ACCEPTED = 'staff_invitation_accepted',

  REGISTRATION_SUBMITTED = 'registration_submitted',
  REGISTRATION_COMPLETED = 'registration_completed',
  REGISTRATION_REJECTED = 'registration_rejected',

  NEW_MESSAGE = 'new_message',
  MENTIONED_IN_CHAT = 'mentioned_in_chat',

  EXPORT_COMPLETED = 'export_completed',
  EXPORT_FAILED = 'export_failed',

  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  ACCOUNT_SUSPENDED = 'account_suspended',
  ACCOUNT_ACTIVATED = 'account_activated',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  DELETED = 'deleted',
}

export enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}
