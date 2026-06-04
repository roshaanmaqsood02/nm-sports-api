import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
} from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class ChatRepository {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,

    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  // ══════════════════════════════════════════════════════════════
  // CONVERSATION
  // ══════════════════════════════════════════════════════════════

  async createConversation(
    data: Partial<Conversation>,
  ): Promise<ConversationDocument> {
    return new this.conversationModel(data).save();
  }

  async findConversationById(id: string): Promise<ConversationDocument | null> {
    return this.conversationModel.findOne({ _id: id, isActive: true }).exec();
  }

  // Find existing direct conversation between two users
  async findDirectConversation(
    userAId: string,
    userBId: string,
  ): Promise<ConversationDocument | null> {
    const result = await this.conversationModel.aggregate([
      {
        $match: {
          type: 'direct',
          isActive: true,
          'participants.userId': {
            $all: [new Types.ObjectId(userAId), new Types.ObjectId(userBId)],
          },
        },
      },
      {
        $addFields: {
          participantCount: { $size: '$participants' },
        },
      },
      {
        $match: {
          participantCount: 2,
        },
      },
    ]);

    return result[0] || null;
  }

  // Get all conversations for a user (sorted by last message)
  async findUserConversations(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: ConversationDocument[]; total: number }> {
    const skip = (page - 1) * limit;

    const filter = {
      'participants.userId': new Types.ObjectId(userId),
      'participants.hasLeft': false,
      isActive: true,
    };

    const [data, total] = await Promise.all([
      this.conversationModel
        .find(filter)
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.conversationModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  async updateConversation(
    id: string,
    update: Record<string, any>,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
  }

  // Update last message snapshot
  async updateLastMessage(
    conversationId: string,
    messageId: string,
    text: string,
    senderId: string,
  ): Promise<void> {
    await this.conversationModel.updateOne(
      { _id: new Types.ObjectId(conversationId) },
      {
        $set: {
          lastMessageId: new Types.ObjectId(messageId),
          lastMessageText: text,
          lastMessageAt: new Date(),
          lastMessageBy: new Types.ObjectId(senderId),
        },
        $inc: { messageCount: 1 },
      },
    );
  }

  // Mark participant as read
  async markParticipantRead(
    conversationId: string,
    userId: string,
    messageId?: string,
  ): Promise<void> {
    const setPayload: Record<string, any> = {
      'participants.$.lastReadAt': new Date(),
    };

    if (messageId) {
      setPayload['participants.$.lastReadMessageId'] = new Types.ObjectId(
        messageId,
      );
    }

    await this.conversationModel.updateOne(
      {
        _id: new Types.ObjectId(conversationId),
        'participants.userId': new Types.ObjectId(userId),
      },
      { $set: setPayload },
    );
  }

  // Add participants to a group conversation
  async addParticipants(
    conversationId: string,
    participants: any[],
  ): Promise<ConversationDocument | null> {
    return this.conversationModel
      .findByIdAndUpdate(
        conversationId,
        { $push: { participants: { $each: participants } } },
        { new: true },
      )
      .exec();
  }

  // Soft-leave a conversation
  async leaveConversation(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await this.conversationModel.updateOne(
      {
        _id: new Types.ObjectId(conversationId),
        'participants.userId': new Types.ObjectId(userId),
      },
      {
        $set: {
          'participants.$.hasLeft': true,
          'participants.$.leftAt': new Date(),
        },
      },
    );
  }

  // Count unread messages for a user in a conversation
  async countUnread(
    conversationId: string,
    userId: string,
    lastReadAt: Date,
  ): Promise<number> {
    return this.messageModel.countDocuments({
      conversationId: new Types.ObjectId(conversationId),
      createdAt: { $gt: lastReadAt },
      senderId: { $ne: new Types.ObjectId(userId) },
      isDeleted: false,
    });
  }

  // ══════════════════════════════════════════════════════════════
  // MESSAGES
  // ══════════════════════════════════════════════════════════════

  async createMessage(data: Partial<Message>): Promise<MessageDocument> {
    return new this.messageModel(data).save();
  }

  async findMessageById(id: string): Promise<MessageDocument | null> {
    return this.messageModel.findById(id).exec();
  }

  async findMessages(
    conversationId: string,
    page = 1,
    limit = 50,
    before?: string, // cursor-based: load messages before this ID
  ): Promise<{ data: MessageDocument[]; total: number }> {
    const filter: Record<string, any> = {
      conversationId: new Types.ObjectId(conversationId),
      isDeleted: false,
    };

    // Cursor-based pagination for chat (load older messages)
    if (before) {
      filter['_id'] = { $lt: new Types.ObjectId(before) };
    }

    const skip = before ? 0 : (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.messageModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.messageModel.countDocuments({
        conversationId: new Types.ObjectId(conversationId),
        isDeleted: false,
      }),
    ]);

    // Reverse so newest is at the bottom
    return { data: data.reverse(), total };
  }

  async updateMessage(
    id: string,
    update: Record<string, any>,
  ): Promise<MessageDocument | null> {
    return this.messageModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
  }

  async softDeleteMessage(id: string): Promise<void> {
    await this.messageModel.updateOne(
      { _id: id },
      { isDeleted: true, deletedAt: new Date() },
    );
  }

  // Add / remove reaction
  async toggleReaction(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<MessageDocument | null> {
    const message = await this.messageModel.findById(messageId);
    if (!message) return null;

    const reactionIdx = message.reactions.findIndex((r) => r.emoji === emoji);

    if (reactionIdx === -1) {
      // New emoji reaction
      await this.messageModel.updateOne(
        { _id: messageId },
        {
          $push: {
            reactions: {
              emoji,
              userIds: [new Types.ObjectId(userId)],
              count: 1,
            },
          },
        },
      );
    } else {
      const alreadyReacted = message.reactions[reactionIdx].userIds.some(
        (id) => id.toString() === userId,
      );

      if (alreadyReacted) {
        // Remove reaction
        await this.messageModel.updateOne(
          { _id: messageId, 'reactions.emoji': emoji },
          {
            $pull: { 'reactions.$.userIds': new Types.ObjectId(userId) },
            $inc: { 'reactions.$.count': -1 },
          },
        );
        // Remove reaction entry if count = 0
        await this.messageModel.updateOne(
          { _id: messageId },
          { $pull: { reactions: { emoji, count: { $lte: 0 } } } },
        );
      } else {
        // Add userId to existing reaction
        await this.messageModel.updateOne(
          { _id: messageId, 'reactions.emoji': emoji },
          {
            $addToSet: { 'reactions.$.userIds': new Types.ObjectId(userId) },
            $inc: { 'reactions.$.count': 1 },
          },
        );
      }
    }

    return this.messageModel.findById(messageId).exec();
  }

  // Add read receipt to message
  async addReadReceipt(messageId: string, userId: string): Promise<void> {
    await this.messageModel.updateOne(
      {
        _id: new Types.ObjectId(messageId),
        'readBy.userId': { $ne: new Types.ObjectId(userId) },
      },
      {
        $push: {
          readBy: {
            userId: new Types.ObjectId(userId),
            readAt: new Date(),
          },
        },
        $set: { status: 'read' },
      },
    );
  }

  // Search messages in a conversation
  async searchMessages(
    conversationId: string,
    query: string,
    limit = 20,
  ): Promise<MessageDocument[]> {
    return this.messageModel
      .find({
        conversationId: new Types.ObjectId(conversationId),
        isDeleted: false,
        text: { $regex: query, $options: 'i' },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
