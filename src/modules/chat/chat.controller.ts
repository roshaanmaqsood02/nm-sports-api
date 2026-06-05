import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatGateway } from './gateway/chat.gateway';
import {
  CreateConversationDto,
  AddParticipantsDto,
  UpdateConversationDto,
} from './dto/create-conversation.dto';
import { SendMessageDto, EditMessageDto } from './dto/send-message.dto';
import {
  ConversationResponseDto,
  PaginatedConversationsDto,
  MessageResponseDto,
  PaginatedMessagesDto,
} from './dto/chat-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { SocketEvent } from './enums/chat.enum';

@ApiTags('Chat')
@ApiBearerAuth('JWT-auth')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a conversation',
    description:
      'type: direct (1-to-1) | group | team | organization | league. ' +
      'For direct, provide 1 participantId. ' +
      'For group, provide 2+ participantIds + name.',
  })
  @ApiResponse({ status: 201, type: ConversationResponseDto })
  createConversation(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.chatService.createConversation(dto, user);
  }

  @Get('conversations')
  @ApiOperation({
    summary:
      'Get all conversations for the current user (sorted by last message)',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, type: PaginatedConversationsDto })
  getMyConversations(
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.chatService.getUserConversations(user._id, +page, +limit);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a single conversation' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: ConversationResponseDto })
  getConversation(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.chatService.getConversation(id, user);
  }

  @Patch('conversations/:id')
  @ApiOperation({
    summary: 'Update conversation name / description (admin/owner)',
  })
  @ApiParam({ name: 'id' })
  updateConversation(
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.chatService.updateConversation(id, dto, user);
  }

  @Post('conversations/:id/participants')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add participants to a group conversation' })
  @ApiParam({ name: 'id' })
  addParticipants(
    @Param('id') id: string,
    @Body() dto: AddParticipantsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.chatService.addParticipants(id, dto, user);
  }

  @Post('conversations/:id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a group conversation' })
  @ApiParam({ name: 'id' })
  leaveConversation(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.chatService.leaveConversation(id, user);
  }

  @Get('conversations/:id/online')
  @ApiOperation({ summary: 'Get online status of conversation participants' })
  @ApiParam({ name: 'id' })
  async getOnlineStatus(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const conv = await this.chatService.getConversation(id, user);
    const participantIds = conv.participants.map((p) => p.userId.toString());
    const onlineUsers = this.chatGateway.getOnlineUsers();
    return this.chatService.getOnlineStatus(participantIds, onlineUsers);
  }

  @Post('conversations/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Send a message via REST (WebSocket is preferred for real-time)',
  })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  async sendMessage(
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: RequestUser,
  ) {
    dto.conversationId = conversationId;

    const message = await this.chatService.sendMessage(dto, {
      _id: user._id,
    });

    // Broadcast via WebSocket after REST send
    this.chatGateway.emitToConversation(
      conversationId,
      SocketEvent.NEW_MESSAGE,
      message,
    );

    return message;
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages in a conversation (paginated)' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiQuery({
    name: 'before',
    required: false,
    description: 'Message ID cursor — load messages before this ID',
  })
  @ApiResponse({ status: 200, type: PaginatedMessagesDto })
  getMessages(
    @Param('id') conversationId: string,
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('before') before?: string,
  ) {
    return this.chatService.getMessages(
      conversationId,
      user,
      +page,
      +limit,
      before,
    );
  }

  @Get('conversations/:id/messages/search')
  @ApiOperation({ summary: 'Search messages in a conversation' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'q', required: true, example: 'match tomorrow' })
  searchMessages(
    @Param('id') id: string,
    @Query('q') query: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.chatService.searchMessages(id, query, user);
  }

  @Patch('messages/:messageId')
  @ApiOperation({ summary: 'Edit a message (sender only)' })
  @ApiParam({ name: 'messageId' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async editMessage(
    @Param('messageId') messageId: string,
    @Body() dto: EditMessageDto,
    @CurrentUser() user: RequestUser,
  ) {
    const updated = await this.chatService.editMessage(messageId, dto, user);

    // Broadcast edit
    if (updated) {
      const convId = updated.conversationId.toString();
      this.chatGateway.emitToConversation(
        convId,
        SocketEvent.MESSAGE_UPDATED,
        updated,
      );
    }

    return updated;
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Delete a message (sender or superadmin)' })
  @ApiParam({ name: 'messageId' })
  async deleteMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const result = await this.chatService.deleteMessage(messageId, user);

    // Broadcast deletion
    this.chatGateway.server?.emit(SocketEvent.MESSAGE_DELETED, { messageId });

    return result;
  }

  @Post('conversations/:id/messages/:messageId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark messages as read up to this message' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'messageId' })
  markRead(
    @Param('id') conversationId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.chatService.markRead(conversationId, user._id, messageId);
  }
}
