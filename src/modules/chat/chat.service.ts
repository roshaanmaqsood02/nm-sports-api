import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ChatRepository } from './chat.repository';
import {
  CreateConversationDto,
  AddParticipantsDto,
  UpdateConversationDto,
} from './dto/create-conversation.dto';
import {
  SendMessageDto,
  EditMessageDto,
  ReactToMessageDto,
} from './dto/send-message.dto';
import { ConversationDocument } from './schemas/conversation.schema';
import { MessageDocument } from './schemas/message.schema';
import {
  ConversationType,
  MessageType,
  MessageStatus,
  ParticipantRole,
} from './enums/chat.enum';
import { RequestUser } from '../auth/interfaces/jwt-payload.interface';

interface SenderInfo {
  _id: string;
  fullName?: string;
  avatar?: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly repo: ChatRepository) {}

  // ══════════════════════════════════════════════════════════════
  // CONVERSATIONS
  // ══════════════════════════════════════════════════════════════

  async createConversation(
    dto: CreateConversationDto,
    user: RequestUser,
  ): Promise<ConversationDocument> {
    // ── Direct: check if already exists ─────────────────────────
    if (dto.type === ConversationType.DIRECT) {
      if (dto.participantIds.length !== 1) {
        throw new BadRequestException(
          'Direct conversations require exactly 1 other participant',
        );
      }

      const existing = await this.repo.findDirectConversation(
        user._id,
        dto.participantIds[0],
      );

      if (existing) return existing; // return existing DM
    }

    // ── Build participants array ──────────────────────────────────
    const allParticipantIds = [
      user._id,
      ...dto.participantIds.filter((id) => id !== user._id),
    ];

    const participants = allParticipantIds.map((id, index) => ({
      userId: new Types.ObjectId(id),
      role: index === 0 ? ParticipantRole.OWNER : ParticipantRole.MEMBER,
      lastReadAt: new Date(),
      isMuted: false,
      joinedAt: new Date(),
      hasLeft: false,
    }));

    const conversation = await this.repo.createConversation({
      type: dto.type,
      name: dto.name,
      description: dto.description,
      participants,
      organizationId: dto.organizationId
        ? new Types.ObjectId(dto.organizationId)
        : undefined,
      teamId: dto.teamId ? new Types.ObjectId(dto.teamId) : undefined,
      leagueId: dto.leagueId ? new Types.ObjectId(dto.leagueId) : undefined,
      isReadOnly: dto.isReadOnly ?? false,
      isActive: true,
      messageCount: 0,
      createdBy: new Types.ObjectId(user._id),
    });

    // ── System message: "Group created" ──────────────────────────
    if (dto.type !== ConversationType.DIRECT) {
      await this.repo.createMessage({
        conversationId: conversation._id as any,
        senderId: new Types.ObjectId(user._id),
        type: MessageType.SYSTEM,
        text: `Group "${dto.name}" was created`,
        isSystem: true,
        status: MessageStatus.DELIVERED,
      });
    }

    this.logger.log(`Conversation created: ${dto.type} by ${user.email}`);
    return conversation;
  }

  async getUserConversations(userId: string, page = 1, limit = 20) {
    const { data, total } = await this.repo.findUserConversations(
      userId,
      page,
      limit,
    );

    // Attach unread count per conversation
    const enriched = await Promise.all(
      data.map(async (conv) => {
        const participant = conv.participants.find(
          (p) => p.userId.toString() === userId,
        );

        const unreadCount = participant
          ? await this.repo.countUnread(
              (conv._id as any).toString(),
              userId,
              participant.lastReadAt,
            )
          : 0;

        return { ...conv.toJSON(), unreadCount };
      }),
    );

    return {
      data: enriched,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getConversation(
    id: string,
    user: RequestUser,
  ): Promise<ConversationDocument> {
    const conv = await this.repo.findConversationById(id);
    if (!conv) throw new NotFoundException(`Conversation ${id} not found`);

    this.checkParticipant(conv, user._id);
    return conv;
  }

  async updateConversation(
    id: string,
    dto: UpdateConversationDto,
    user: RequestUser,
  ): Promise<ConversationDocument> {
    const conv = await this.repo.findConversationById(id);
    if (!conv) throw new NotFoundException(`Conversation not found`);

    this.checkAdminOrOwner(conv, user._id);

    const payload: Record<string, any> = {};
    if (dto.name !== undefined) payload['name'] = dto.name;
    if (dto.description !== undefined) payload['description'] = dto.description;
    if (dto.isReadOnly !== undefined) payload['isReadOnly'] = dto.isReadOnly;

    return (await this.repo.updateConversation(id, { $set: payload }))!;
  }

  async addParticipants(
    id: string,
    dto: AddParticipantsDto,
    user: RequestUser,
  ): Promise<ConversationDocument> {
    const conv = await this.repo.findConversationById(id);
    if (!conv) throw new NotFoundException(`Conversation not found`);

    if (conv.type === ConversationType.DIRECT) {
      throw new BadRequestException(
        'Cannot add participants to a direct conversation',
      );
    }

    this.checkAdminOrOwner(conv, user._id);

    // Filter out already existing participants
    const existing = conv.participants.map((p) => p.userId.toString());
    const newIds = dto.userIds.filter((id) => !existing.includes(id));

    if (newIds.length === 0) {
      throw new BadRequestException('All users are already participants');
    }

    const newParticipants = newIds.map((userId) => ({
      userId: new Types.ObjectId(userId),
      role: ParticipantRole.MEMBER,
      lastReadAt: new Date(),
      isMuted: false,
      joinedAt: new Date(),
      hasLeft: false,
    }));

    return (await this.repo.addParticipants(id, newParticipants))!;
  }

  async leaveConversation(
    id: string,
    user: RequestUser,
  ): Promise<{ message: string }> {
    const conv = await this.repo.findConversationById(id);
    if (!conv) throw new NotFoundException(`Conversation not found`);

    this.checkParticipant(conv, user._id);

    await this.repo.leaveConversation(id, user._id);

    // System message
    await this.repo.createMessage({
      conversationId: new Types.ObjectId(id),
      senderId: new Types.ObjectId(user._id),
      type: MessageType.SYSTEM,
      text: `A member left the group`,
      isSystem: true,
      status: MessageStatus.DELIVERED,
    });

    return { message: 'Left conversation successfully' };
  }

  // ── Get room IDs for a user (used by gateway on connect) ──────
  async getUserConversationRooms(userId: string): Promise<string[]> {
    const { data } = await this.repo.findUserConversations(userId, 1, 200);
    return data.map((c) => (c._id as any).toString());
  }

  // ══════════════════════════════════════════════════════════════
  // MESSAGES
  // ══════════════════════════════════════════════════════════════

  async sendMessage(
    dto: SendMessageDto,
    sender: SenderInfo,
  ): Promise<MessageDocument> {
    const conv = await this.repo.findConversationById(dto.conversationId);
    if (!conv) throw new NotFoundException(`Conversation not found`);

    this.checkParticipant(conv, sender._id);

    if (conv.isReadOnly) {
      const participant = conv.participants.find(
        (p) => p.userId.toString() === sender._id,
      );
      if (participant?.role === ParticipantRole.MEMBER) {
        throw new ForbiddenException('This conversation is read-only');
      }
    }

    if (!dto.text && dto.type === MessageType.TEXT) {
      throw new BadRequestException('Message text is required');
    }

    // Build reply snapshot
    let replyToText: string | undefined;
    let replyToSender: string | undefined;

    if (dto.replyToId) {
      const replyMsg = await this.repo.findMessageById(dto.replyToId);
      if (replyMsg) {
        replyToText = replyMsg.text?.slice(0, 100);
        replyToSender = replyMsg.senderName;
      }
    }

    const message = await this.repo.createMessage({
      conversationId: new Types.ObjectId(dto.conversationId),
      senderId: new Types.ObjectId(sender._id),
      senderName: sender.fullName,
      senderAvatar: sender.avatar,
      type: dto.type,
      text: dto.text,
      replyToId: dto.replyToId ? new Types.ObjectId(dto.replyToId) : undefined,
      replyToText,
      replyToSender,
      status: MessageStatus.SENT,
      isDeleted: false,
      isSystem: false,
      reactions: [],
      readBy: [],
    });

    // Update conversation last message snapshot
    await this.repo.updateLastMessage(
      dto.conversationId,
      (message._id as any).toString(),
      dto.text ?? `[${dto.type}]`,
      sender._id,
    );

    this.logger.debug(
      `Message sent in conversation ${dto.conversationId} ` +
        `by ${sender._id}`,
    );

    return message;
  }

  async getMessages(
    conversationId: string,
    user: RequestUser,
    page = 1,
    limit = 50,
    before?: string,
  ) {
    const conv = await this.repo.findConversationById(conversationId);
    if (!conv) throw new NotFoundException(`Conversation not found`);

    this.checkParticipant(conv, user._id);

    const { data, total } = await this.repo.findMessages(
      conversationId,
      page,
      limit,
      before,
    );

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: total > page * limit,
    };
  }

  async editMessage(
    messageId: string,
    dto: EditMessageDto,
    user: RequestUser,
  ): Promise<MessageDocument> {
    const message = await this.repo.findMessageById(messageId);
    if (!message) throw new NotFoundException(`Message not found`);

    if (message.senderId.toString() !== user._id) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (message.isDeleted) {
      throw new BadRequestException('Cannot edit a deleted message');
    }

    const updated = await this.repo.updateMessage(messageId, {
      $set: {
        text: dto.text,
        isEdited: true,
        editedAt: new Date(),
      },
    });

    return updated!;
  }

  async deleteMessage(
    messageId: string,
    user: RequestUser,
  ): Promise<{ message: string }> {
    const message = await this.repo.findMessageById(messageId);
    if (!message) throw new NotFoundException(`Message not found`);

    if (message.senderId.toString() !== user._id && !user.isSuperAdmin) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.repo.softDeleteMessage(messageId);
    return { message: 'Message deleted' };
  }

  async toggleReaction(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<MessageDocument | null> {
    return this.repo.toggleReaction(messageId, userId, emoji);
  }

  async markRead(
    conversationId: string,
    userId: string,
    lastMessageId?: string,
  ): Promise<void> {
    await this.repo.markParticipantRead(conversationId, userId, lastMessageId);

    if (lastMessageId) {
      await this.repo.addReadReceipt(lastMessageId, userId);
    }
  }

  async searchMessages(
    conversationId: string,
    query: string,
    user: RequestUser,
  ): Promise<MessageDocument[]> {
    const conv = await this.repo.findConversationById(conversationId);
    if (!conv) throw new NotFoundException(`Conversation not found`);

    this.checkParticipant(conv, user._id);

    return this.repo.searchMessages(conversationId, query);
  }

  // ── Online users ──────────────────────────────────────────────
  getOnlineStatus(
    userIds: string[],
    onlineUsers: string[],
  ): Record<string, boolean> {
    return userIds.reduce(
      (acc, id) => {
        acc[id] = onlineUsers.includes(id);
        return acc;
      },
      {} as Record<string, boolean>,
    );
  }

  // ─── Access helpers ───────────────────────────────────────────
  private checkParticipant(conv: ConversationDocument, userId: string): void {
    const isParticipant = conv.participants.some(
      (p) => p.userId.toString() === userId && !p.hasLeft,
    );
    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }
  }

  private checkAdminOrOwner(conv: ConversationDocument, userId: string): void {
    const participant = conv.participants.find(
      (p) => p.userId.toString() === userId,
    );
    if (
      !participant ||
      (participant.role !== ParticipantRole.OWNER &&
        participant.role !== ParticipantRole.ADMIN)
    ) {
      throw new ForbiddenException(
        'Only group owners/admins can perform this action',
      );
    }
  }
}
