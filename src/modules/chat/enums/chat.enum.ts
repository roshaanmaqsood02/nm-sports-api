export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  TEAM = 'team',
  ORGANIZATION = 'organization',
  LEAGUE = 'league',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
  SYSTEM = 'system',
  EMOJI = 'emoji',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  DELETED = 'deleted',
}

export enum ParticipantRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum SocketEvent {
  // Client → Server
  JOIN_CONVERSATION = 'join_conversation',
  LEAVE_CONVERSATION = 'leave_conversation',
  SEND_MESSAGE = 'send_message',
  TYPING_START = 'typing_start',
  TYPING_STOP = 'typing_stop',
  MARK_READ = 'mark_read',
  MESSAGE_REACTION = 'message_reaction',

  // Server → Clien
  NEW_MESSAGE = 'new_message',
  MESSAGE_UPDATED = 'message_updated',
  MESSAGE_DELETED = 'message_deleted',
  USER_TYPING = 'user_typing',
  USER_STOP_TYPING = 'user_stop_typing',
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
  CONVERSATION_UPDATED = 'conversation_updated',
  ERROR = 'chat_error',
}
