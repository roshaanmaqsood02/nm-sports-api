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
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import {
  RegisterTeamDto,
  UpdateTeamRegistrationDto,
  AssignGroupsDto,
} from './dto/tournament-team.dto';
import {
  CreateBracketMatchDto,
  UpdateBracketMatchDto,
  UpdateStandingDto,
} from './dto/bracket.dto';
import {
  TournamentResponseDto,
  PaginatedTournamentsDto,
} from './dto/tournament-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AuditAction, AuditSeverity } from '../audit/enums/audit.enum';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';
import { SportType } from '../organizations/enums/organization.enum';
import {
  TournamentFormat,
  TournamentStatus,
  BracketRound,
} from './enums/tournament.enum';

@ApiTags('Tournaments')
@ApiBearerAuth('JWT-auth')
@UseInterceptors(AuditInterceptor)
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  @RequirePermissions('tournaments:create')
  @HttpCode(HttpStatus.CREATED)
  @AuditLog({
    action: AuditAction.TOURNAMENT_CREATED,
    resource: 'Tournament',
    severity: AuditSeverity.MEDIUM,
    captureBody: true,
  })
  @ApiOperation({ summary: 'Create a new tournament' })
  @ApiResponse({ status: 201, type: TournamentResponseDto })
  create(@Body() dto: CreateTournamentDto, @CurrentUser() user: RequestUser) {
    return this.tournamentsService.create(dto, user);
  }

  @Get()
  @RequirePermissions('tournaments:read')
  @ApiOperation({ summary: 'List tournaments (paginated + filters)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'sport', required: false, enum: SportType })
  @ApiQuery({ name: 'format', required: false, enum: TournamentFormat })
  @ApiQuery({ name: 'status', required: false, enum: TournamentStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, type: PaginatedTournamentsDto })
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('organizationId') organizationId?: string,
    @Query('sport') sport?: string,
    @Query('format') format?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.tournamentsService.findAll(+page, +limit, user, {
      organizationId,
      sport,
      format,
      status,
      search,
    });
  }

  @Get('stats')
  @RequirePermissions('tournaments:read')
  @ApiOperation({ summary: 'Tournament count statistics' })
  getStats(@CurrentUser() user: RequestUser) {
    return this.tournamentsService.getStats(user);
  }

  @Get(':id')
  @RequirePermissions('tournaments:read')
  @ApiOperation({ summary: 'Get tournament by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: TournamentResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.tournamentsService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermissions('tournaments:update')
  @AuditLog({
    action: AuditAction.TOURNAMENT_UPDATED,
    resource: 'Tournament',
    severity: AuditSeverity.MEDIUM,
  })
  @ApiOperation({ summary: 'Update tournament details' })
  @ApiParam({ name: 'id' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTournamentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tournamentsService.update(id, dto, user);
  }

  // Lifecycle

  @Post(':id/publish')
  @RequirePermissions('tournaments:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a draft tournament (opens registration)' })
  @ApiParam({ name: 'id' })
  publish(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.tournamentsService.publish(id, user);
  }

  @Post(':id/start')
  @RequirePermissions('tournaments:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start tournament (sets status to active)' })
  @ApiParam({ name: 'id' })
  start(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.tournamentsService.start(id, user);
  }

  @Post(':id/complete')
  @RequirePermissions('tournaments:manage')
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    action: AuditAction.TOURNAMENT_UPDATED,
    resource: 'TournamentComplete',
    severity: AuditSeverity.HIGH,
  })
  @ApiOperation({ summary: 'Mark tournament as completed' })
  @ApiParam({ name: 'id' })
  complete(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.tournamentsService.complete(id, user);
  }

  @Delete(':id')
  @RequirePermissions('tournaments:delete')
  @AuditLog({
    action: AuditAction.TOURNAMENT_DELETED,
    resource: 'Tournament',
    severity: AuditSeverity.HIGH,
  })
  @ApiOperation({
    summary: 'Delete tournament (also clears bracket + standings)',
  })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.tournamentsService.remove(id, user);
  }

  @Post(':id/teams')
  @RequirePermissions('tournaments:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register a team in the tournament' })
  @ApiParam({ name: 'id' })
  registerTeam(
    @Param('id') id: string,
    @Body() dto: RegisterTeamDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tournamentsService.registerTeam(id, dto, user);
  }

  @Patch(':id/teams/:teamId')
  @RequirePermissions('tournaments:update')
  @ApiOperation({ summary: 'Update team registration (seed, group, status)' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'teamId' })
  updateTeamRegistration(
    @Param('id') id: string,
    @Param('teamId') teamId: string,
    @Body() dto: UpdateTeamRegistrationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tournamentsService.updateTeamRegistration(
      id,
      teamId,
      dto,
      user,
    );
  }

  @Delete(':id/teams/:teamId')
  @RequirePermissions('tournaments:update')
  @ApiOperation({ summary: 'Remove a team from tournament' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'teamId' })
  removeTeam(
    @Param('id') id: string,
    @Param('teamId') teamId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tournamentsService.removeTeam(id, teamId, user);
  }

  @Post(':id/teams/assign-groups')
  @RequirePermissions('tournaments:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign teams to groups (group stage tournaments)' })
  @ApiParam({ name: 'id' })
  assignGroups(
    @Param('id') id: string,
    @Body() dto: AssignGroupsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tournamentsService.assignGroups(id, dto, user);
  }

  // BRACKET

  @Post(':id/bracket/generate')
  @RequirePermissions('tournaments:manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Auto-generate bracket from registered teams (clears existing)',
  })
  @ApiParam({ name: 'id' })
  generateBracket(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.tournamentsService.generateBracket(id, user);
  }

  @Get(':id/bracket')
  @RequirePermissions('tournaments:read')
  @ApiOperation({ summary: 'Get full bracket (grouped by round)' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'round', required: false, enum: BracketRound })
  @ApiQuery({ name: 'group', required: false, example: 'A' })
  @ApiQuery({ name: 'roundNumber', required: false, example: 1 })
  getBracket(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Query('round') round?: string,
    @Query('group') group?: string,
    @Query('roundNumber') roundNumber?: number,
  ) {
    return this.tournamentsService.getBracket(
      id,
      { round, group, roundNumber: roundNumber ? +roundNumber : undefined },
      user,
    );
  }

  @Post(':id/bracket/matches')
  @RequirePermissions('tournaments:update')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Manually add a bracket match' })
  @ApiParam({ name: 'id' })
  addBracketMatch(
    @Param('id') id: string,
    @Body() dto: CreateBracketMatchDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tournamentsService.addBracketMatch(id, dto, user);
  }

  @Patch(':id/bracket/matches/:matchId')
  @RequirePermissions('tournaments:update')
  @ApiOperation({ summary: 'Update bracket match score / winner / status' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'matchId' })
  updateBracketMatch(
    @Param('id') id: string,
    @Param('matchId') matchId: string,
    @Body() dto: UpdateBracketMatchDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tournamentsService.updateBracketMatch(id, matchId, dto, user);
  }

  @Get(':id/standings')
  @RequirePermissions('tournaments:read')
  @ApiOperation({ summary: 'Get tournament standings table' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'group', required: false, example: 'A' })
  getStandings(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Query('group') group?: string,
  ) {
    return this.tournamentsService.getStandings(id, group, user);
  }

  @Post(':id/standings')
  @RequirePermissions('tournaments:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upsert a team standing entry' })
  @ApiParam({ name: 'id' })
  updateStanding(
    @Param('id') id: string,
    @Body() dto: UpdateStandingDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tournamentsService.updateStanding(id, dto, user);
  }
}
