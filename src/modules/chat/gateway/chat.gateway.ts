import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from '../chat.service';
import { SocketEvent } from '../enums/chat.enum';
import { SendMessageDto } from '../dto/send-message.dto';

interface AuthSocket extends Socket {
  user?: {
    _id: string;
    email: string;
    username: string;
    fullName?: string;
    avatar?: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat', // ws://localhost:8000/chat
  transports: ['websocket', 'polling'],
})
@Injectable()
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  // Track online users: userId → Set<socketId>
  private onlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Lifecycle
  afterInit(_server: Server) {
    this.logger.log('🔌 Chat WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthSocket) {
    try {
      // Authenticate via JWT token in handshake
      const token =
        client.handshake.auth?.token ??
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.disconnect(client, 'No token provided');
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      if (!payload?.sub) {
        this.disconnect(client, 'Invalid token');
        return;
      }

      client.user = {
        _id: payload.sub,
        email: payload.email,
        username: payload.username,
      };

      // Track online
      const userId = client.user._id;
      if (!this.onlineUsers.has(userId)) {
        this.onlineUsers.set(userId, new Set());
      }
      this.onlineUsers.get(userId)!.add(client.id);

      // Auto-join all user's conversation rooms
      const rooms = await this.chatService.getUserConversationRooms(userId);
      rooms.forEach((roomId) => client.join(roomId));

      // Join personal room (for direct notifications)
      client.join(`user:${userId}`);

      // Broadcast online status
      client.broadcast.emit(SocketEvent.USER_ONLINE, {
        userId,
        username: payload.username,
      });

      this.logger.log(
        `Client connected: ${client.id} (user: ${payload.email})`,
      );
    } catch (err: any) {
      this.disconnect(client, `Auth failed: ${err?.message}`);
    }
  }

  handleDisconnect(client: AuthSocket) {
    if (!client.user) return;

    const userId = client.user._id;
    const sockets = this.onlineUsers.get(userId);

    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.onlineUsers.delete(userId);
        this.server.emit(SocketEvent.USER_OFFLINE, {
          userId,
          username: client.user.username,
        });
      }
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Events

  @SubscribeMessage(SocketEvent.JOIN_CONVERSATION)
  async handleJoin(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    try {
      const { conversationId } = data;
      client.join(conversationId);
      this.logger.debug(
        `User ${client.user?._id} joined room: ${conversationId}`,
      );
      return { event: 'joined', conversationId };
    } catch (err: any) {
      throw new WsException(err.message);
    }
  }

  @SubscribeMessage(SocketEvent.LEAVE_CONVERSATION)
  handleLeave(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(data.conversationId);
    return { event: 'left', conversationId: data.conversationId };
  }

  @SubscribeMessage(SocketEvent.SEND_MESSAGE)
  async handleSendMessage(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() dto: SendMessageDto,
  ) {
    try {
      if (!client.user) throw new WsException('Unauthorized');

      const message = await this.chatService.sendMessage(dto, {
        _id: client.user._id,
        fullName: client.user.fullName,
        avatar: client.user.avatar,
      });

      // Broadcast to all participants in the conversation
      this.server.to(dto.conversationId).emit(SocketEvent.NEW_MESSAGE, message);

      return message;
    } catch (err: any) {
      client.emit(SocketEvent.ERROR, { message: err.message });
    }
  }

  @SubscribeMessage(SocketEvent.TYPING_START)
  handleTypingStart(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.user) return;

    client.to(data.conversationId).emit(SocketEvent.USER_TYPING, {
      conversationId: data.conversationId,
      userId: client.user._id,
      username: client.user.username,
    });
  }

  @SubscribeMessage(SocketEvent.TYPING_STOP)
  handleTypingStop(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.user) return;

    client.to(data.conversationId).emit(SocketEvent.USER_STOP_TYPING, {
      conversationId: data.conversationId,
      userId: client.user._id,
    });
  }

  @SubscribeMessage(SocketEvent.MARK_READ)
  async handleMarkRead(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { conversationId: string; lastMessageId?: string },
  ) {
    if (!client.user) return;

    await this.chatService.markRead(
      data.conversationId,
      client.user._id,
      data.lastMessageId,
    );
  }

  @SubscribeMessage(SocketEvent.MESSAGE_REACTION)
  async handleReaction(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody()
    data: { messageId: string; emoji: string; conversationId: string },
  ) {
    if (!client.user) return;

    const updated = await this.chatService.toggleReaction(
      data.messageId,
      client.user._id,
      data.emoji,
    );

    this.server
      .to(data.conversationId)
      .emit(SocketEvent.MESSAGE_UPDATED, updated);
  }

  // Helper: emit to specific user across all their sockets ──
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Helper: emit to conversation room
  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.to(conversationId).emit(event, data);
  }

  // Helper: check if user is online
  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  // Helper: get all online users
  getOnlineUsers(): string[] {
    return Array.from(this.onlineUsers.keys());
  }

  private disconnect(client: AuthSocket, reason: string) {
    client.emit(SocketEvent.ERROR, { message: reason });
    client.disconnect(true);
    this.logger.warn(`Client disconnected: ${reason}`);
  }
}
