import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Audit')
@ApiBearerAuth('JWT-auth')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('super_admin', 'admin')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'Query all audit logs with filters' })
  @ApiResponse({ status: 200, description: 'Paginated audit logs' })
  findAll(@Query() query: QueryAuditDto) {
    return this.auditService.findAll(query);
  }

  @Get('stats')
  @Roles('super_admin', 'admin')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'Audit stats for the last N days' })
  @ApiQuery({ name: 'days', required: false, example: 7 })
  getStats(@Query('days') days = 7) {
    return this.auditService.getStats(+days);
  }

  @Get('failures')
  @Roles('super_admin', 'admin')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'Recent failed operations (last 24h by default)' })
  @ApiQuery({ name: 'hours', required: false, example: 24 })
  getFailures(@Query('hours') hours = 24) {
    return this.auditService.getFailureSummary(+hours);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user activity timeline' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  getMyActivity(@CurrentUser() user: RequestUser, @Query('limit') limit = 50) {
    return this.auditService.getUserTimeline(user._id, +limit);
  }

  @Get('user/:userId')
  @Roles('super_admin', 'admin')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: "Get a specific user's activity timeline" })
  @ApiParam({ name: 'userId' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  getUserTimeline(@Param('userId') userId: string, @Query('limit') limit = 50) {
    return this.auditService.getUserTimeline(userId, +limit);
  }

  @Get(':id')
  @Roles('super_admin', 'admin')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'Get a single audit log entry' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }
}
