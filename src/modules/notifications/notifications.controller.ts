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
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  BroadcastNotificationDto,
} from './dto/create-notification.dto';
import {
  UpdateNotificationPreferenceDto,
  RegisterDeviceTokenDto,
} from './dto/notification-preference.dto';
import {
  NotificationResponseDto,
  PaginatedNotificationsDto,
  NotificationStatsDto,
} from './dto/notification-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../users/enums/user.enum';
import {
  NotificationType,
  NotificationStatus,
} from './enums/notification.enum';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get my notifications (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  @ApiQuery({ name: 'status', required: false, enum: NotificationStatus })
  @ApiResponse({ status: 200, type: PaginatedNotificationsDto })
  getMyNotifications(
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.notificationsService.getMyNotifications(user, +page, +limit, {
      type,
      status,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  getUnreadCount(@CurrentUser() user: RequestUser) {
    return this.notificationsService.getUnreadCount(user._id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Notification statistics' })
  @ApiResponse({ status: 200, type: NotificationStatsDto })
  getStats(@CurrentUser() user: RequestUser) {
    return this.notificationsService.getStats(user);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id' })
  markRead(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.notificationsService.markRead(id, user);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: RequestUser) {
    return this.notificationsService.markAllRead(user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a single notification' })
  @ApiParam({ name: 'id' })
  deleteNotification(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.notificationsService.deleteNotification(id, user);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all my notifications' })
  clearAll(@CurrentUser() user: RequestUser) {
    return this.notificationsService.clearAll(user);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get my notification preferences' })
  getPreferences(@CurrentUser() user: RequestUser) {
    return this.notificationsService.getPreferences(user);
  }

  @Patch('preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update notification preferences',
    description:
      'Toggle in-app, email, push globally. ' +
      'Set quiet hours. ' +
      'Override per notification type.',
  })
  updatePreferences(
    @Body() dto: UpdateNotificationPreferenceDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.notificationsService.updatePreferences(dto, user);
  }

  @Post('preferences/device-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Register a FCM device token for push notifications',
  })
  registerDeviceToken(
    @Body() dto: RegisterDeviceTokenDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.notificationsService.registerDeviceToken(dto, user);
  }

  @Delete('preferences/device-token/:token')
  @ApiOperation({ summary: 'Remove a FCM device token' })
  @ApiParam({ name: 'token' })
  removeDeviceToken(
    @Param('token') token: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.notificationsService.removeDeviceToken(token, user);
  }

  @Post('admin/send')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin: send a notification to a user' })
  @ApiResponse({ status: 201, type: NotificationResponseDto })
  adminSend(
    @Body() dto: CreateNotificationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.notificationsService.adminSend(dto, user);
  }

  @Post('admin/broadcast')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin: broadcast a notification to multiple users',
  })
  broadcast(
    @Body() dto: BroadcastNotificationDto,
    @CurrentUser() _user: RequestUser,
  ) {
    return this.notificationsService.broadcast(dto);
  }
}
