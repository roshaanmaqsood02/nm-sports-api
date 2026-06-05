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
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import {
  UpdateScoreDto,
  AddMatchEventDto,
  AddPlayerPerformanceDto,
  QueryMatchDto,
} from './dto/update-match.dto';
import {
  MatchResponseDto,
  PaginatedMatchesDto,
} from './dto/match-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AuditAction, AuditSeverity } from '../audit/enums/audit.enum';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Matches')
@ApiBearerAuth('JWT-auth')
@UseInterceptors(AuditInterceptor)
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  @RequirePermissions('matches:create')
  @HttpCode(HttpStatus.CREATED)
  @AuditLog({
    action: AuditAction.MATCH_CREATED,
    resource: 'Match',
    severity: AuditSeverity.LOW,
    captureBody: true,
  })
  @ApiOperation({ summary: 'Schedule a new match' })
  @ApiResponse({ status: 201, type: MatchResponseDto })
  create(@Body() dto: CreateMatchDto, @CurrentUser() user: RequestUser) {
    return this.matchesService.create(dto, user);
  }

  @Get()
  @RequirePermissions('matches:read')
  @ApiOperation({ summary: 'List matches (paginated + filters)' })
  @ApiResponse({ status: 200, type: PaginatedMatchesDto })
  findAll(@CurrentUser() user: RequestUser, @Query() query: QueryMatchDto) {
    return this.matchesService.findAll(query, user);
  }

  @Get('live')
  @RequirePermissions('matches:read')
  @ApiOperation({ summary: 'Get all currently live matches' })
  getLive(@CurrentUser() user: RequestUser) {
    return this.matchesService.getLive(user);
  }

  @Get('upcoming')
  @RequirePermissions('matches:read')
  @ApiOperation({ summary: 'Get upcoming scheduled matches' })
  @ApiQuery({ name: 'limit', required: false, example: 5 })
  getUpcoming(@CurrentUser() user: RequestUser, @Query('limit') limit = 5) {
    return this.matchesService.getUpcoming(+limit, user);
  }

  @Get('stats')
  @RequirePermissions('matches:read')
  @ApiOperation({ summary: 'Match statistics summary' })
  getStats(@CurrentUser() user: RequestUser) {
    return this.matchesService.getStats(user);
  }

  @Get('h2h')
  @RequirePermissions('matches:read')
  @ApiOperation({ summary: 'Head-to-head record between two teams' })
  @ApiQuery({ name: 'teamAId', required: true })
  @ApiQuery({ name: 'teamBId', required: true })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  getH2H(
    @CurrentUser() user: RequestUser,
    @Query('teamAId') teamAId: string,
    @Query('teamBId') teamBId: string,
    @Query('limit') limit = 10,
  ) {
    return this.matchesService.getHeadToHead(teamAId, teamBId, +limit, user);
  }

  @Get(':id')
  @RequirePermissions('matches:read')
  @ApiOperation({ summary: 'Get match by ID (includes events & performances)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: MatchResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.matchesService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermissions('matches:update')
  @AuditLog({
    action: AuditAction.MATCH_UPDATED,
    resource: 'Match',
    severity: AuditSeverity.LOW,
  })
  @ApiOperation({ summary: 'Update match details / status' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: MatchResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMatchDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.matchesService.update(id, dto, user);
  }

  @Patch(':id/score')
  @RequirePermissions('matches:update')
  @ApiOperation({ summary: 'Update live match score' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: MatchResponseDto })
  updateScore(
    @Param('id') id: string,
    @Body() dto: UpdateScoreDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.matchesService.updateScore(id, dto, user);
  }

  @Post(':id/finalise')
  @RequirePermissions('matches:update')
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    action: AuditAction.MATCH_UPDATED,
    resource: 'MatchResult',
    severity: AuditSeverity.MEDIUM,
  })
  @ApiOperation({ summary: 'Finalise match — auto-compute result from scores' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: MatchResponseDto })
  finalise(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.matchesService.finalise(id, user);
  }

  @Post(':id/events')
  @RequirePermissions('matches:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add an event to match timeline (goal, card, etc.)',
  })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: MatchResponseDto })
  addEvent(
    @Param('id') id: string,
    @Body() dto: AddMatchEventDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.matchesService.addEvent(id, dto, user);
  }

  @Delete(':id/events/:eventId')
  @RequirePermissions('matches:update')
  @ApiOperation({ summary: 'Remove an event from match timeline' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'eventId' })
  removeEvent(
    @Param('id') id: string,
    @Param('eventId') eventId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.matchesService.removeEvent(id, eventId, user);
  }

  @Post(':id/performances')
  @RequirePermissions('matches:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add or update a player performance record for this match',
  })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: MatchResponseDto })
  upsertPerformance(
    @Param('id') id: string,
    @Body() dto: AddPlayerPerformanceDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.matchesService.upsertPerformance(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions('matches:delete')
  @AuditLog({
    action: AuditAction.MATCH_DELETED,
    resource: 'Match',
    severity: AuditSeverity.HIGH,
  })
  @ApiOperation({ summary: 'Soft-delete a match' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.matchesService.remove(id, user);
  }
}
