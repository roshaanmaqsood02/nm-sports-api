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
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventResponseDto, PaginatedEventsDto } from './dto/event-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { EventStatus, EventType } from './enums/event.enum';
import { QueryEventDto } from './dto/query-event.dto';

@ApiTags('Events')
@ApiBearerAuth('JWT-auth')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @RequirePermissions('teams:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an event',
    description:
      'eventName, venue, team(s), isAllDay, date, timeStart, timeEnd, ' +
      'timezone, repeat (frequency, endsOn), teamDetail (arrivalTime, uniformDetail, notes)',
  })
  @ApiResponse({ status: 201, type: EventResponseDto })
  create(@Body() dto: CreateEventDto, @CurrentUser() user: RequestUser) {
    return this.eventsService.create(dto, user);
  }

  @Get()
  @RequirePermissions('teams:read')
  @ApiOperation({ summary: 'List all events (paginated + filters)' })
  @ApiResponse({ status: 200, type: PaginatedEventsDto })
  findAll(@CurrentUser() user: RequestUser, @Query() query: QueryEventDto) {
    const { page, limit, ...filters } = query;
    return this.eventsService.findAll(page, limit, user, filters);
  }

  @Get('stats/:organizationId')
  @RequirePermissions('teams:read')
  @ApiOperation({ summary: 'Event statistics' })
  @ApiParam({ name: 'organizationId' })
  getStats(@Param('organizationId') organizationId: string) {
    return this.eventsService.getStats(organizationId);
  }

  @Get('team/:teamId')
  @RequirePermissions('teams:read')
  @ApiOperation({ summary: 'Get all events for a specific team' })
  @ApiParam({ name: 'teamId' })
  findByTeam(
    @Param('teamId') teamId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.eventsService.findByTeam(teamId, user);
  }

  @Get(':id')
  @RequirePermissions('teams:read')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: EventResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.eventsService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermissions('teams:update')
  @ApiOperation({ summary: 'Update event' })
  @ApiParam({ name: 'id' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.eventsService.update(id, dto, user);
  }

  @Patch(':id/status')
  @RequirePermissions('teams:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update event status' })
  @ApiParam({ name: 'id' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: EventStatus,
    @CurrentUser() user: RequestUser,
  ) {
    return this.eventsService.updateStatus(id, status, user);
  }

  @Post(':id/teams')
  @RequirePermissions('teams:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a team to the event' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: { example: { teamId: '64abc123', teamName: 'Lahore Lions' } },
  })
  addTeam(
    @Param('id') id: string,
    @Body('teamId') teamId: string,
    @Body('teamName') teamName: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.eventsService.addTeam(id, teamId, teamName, user);
  }

  @Delete(':id/teams/:teamId')
  @RequirePermissions('teams:update')
  @ApiOperation({ summary: 'Remove a team from the event' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'teamId' })
  removeTeam(
    @Param('id') id: string,
    @Param('teamId') teamId: string,
    @Body('teamName') teamName: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.eventsService.removeTeam(id, teamId, teamName, user);
  }

  @Delete(':id')
  @RequirePermissions('teams:delete')
  @ApiOperation({ summary: 'Delete an event' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.eventsService.remove(id, user);
  }
}
