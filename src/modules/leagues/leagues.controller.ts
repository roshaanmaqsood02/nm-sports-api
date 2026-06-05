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
import { LeaguesService } from './leagues.service';
import { CreateLeagueDto } from './dto/create-league.dto';
import {
  CreateGameScheduleDto,
  UpdateGameScheduleDto,
  QueryGameScheduleDto,
} from './dto/game-schedule.dto';
import {
  UpsertPlayerStatsDto,
  QueryPlayerStatsDto,
} from './dto/player-stats.dto';
import { UpsertTeamStatsDto, QueryTeamStatsDto } from './dto/team-stats.dto';
import {
  LeagueResponseDto,
  PaginatedLeaguesDto,
  PaginatedGameScheduleDto,
} from './dto/league-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';
import {
  LeagueStatus,
  GameStatus,
  PlayerStatFilter,
  TeamStatFilter,
} from './enums/league.enum';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Leagues')
@ApiBearerAuth('JWT-auth')
@UseInterceptors(AuditInterceptor)
@Controller('leagues')
export class LeaguesController {
  constructor(private readonly leaguesService: LeaguesService) {}

  @Post()
  @RequirePermissions('sports:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new league' })
  @ApiResponse({ status: 201, type: LeagueResponseDto })
  createLeague(@Body() dto: CreateLeagueDto, @CurrentUser() user: RequestUser) {
    return this.leaguesService.createLeague(dto, user);
  }

  @Get()
  @RequirePermissions('sports:read')
  @ApiOperation({ summary: 'List all leagues (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: LeagueStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, type: PaginatedLeaguesDto })
  findAllLeagues(
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('organizationId') organizationId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.leaguesService.findAllLeagues(+page, +limit, user, {
      organizationId,
      status,
      search,
    });
  }

  @Get(':id')
  @RequirePermissions('sports:read')
  @ApiOperation({ summary: 'Get league by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: LeagueResponseDto })
  findLeagueById(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.leaguesService.findLeagueById(id, user);
  }

  @Patch(':id')
  @RequirePermissions('sports:update')
  @ApiOperation({ summary: 'Update a league' })
  @ApiParam({ name: 'id' })
  updateLeague(
    @Param('id') id: string,
    @Body() dto: Partial<CreateLeagueDto>,
    @CurrentUser() user: RequestUser,
  ) {
    return this.leaguesService.updateLeague(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions('sports:delete')
  @ApiOperation({ summary: 'Delete a league' })
  @ApiParam({ name: 'id' })
  removeLeague(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.leaguesService.removeLeague(id, user);
  }

  @Post(':id/games')
  @RequirePermissions('matches:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a game to the league schedule' })
  @ApiParam({ name: 'id', description: 'League ID' })
  @ApiResponse({ status: 201 })
  createGame(
    @Param('id') leagueId: string,
    @Body() dto: CreateGameScheduleDto,
    @CurrentUser() user: RequestUser,
  ) {
    dto.leagueId = leagueId;
    return this.leaguesService.createGame(dto, user);
  }

  @Get(':id/games')
  @RequirePermissions('matches:read')
  @ApiOperation({
    summary: 'Get game schedule — visitor, home, location, status, date/time',
  })
  @ApiParam({ name: 'id', description: 'League ID' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: GameStatus })
  @ApiQuery({ name: 'teamId', required: false })
  @ApiQuery({ name: 'from', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'to', required: false, example: '2025-12-31' })
  @ApiQuery({ name: 'season', required: false, example: '2024-25' })
  @ApiResponse({ status: 200, type: PaginatedGameScheduleDto })
  getGameSchedule(
    @Param('id') leagueId: string,
    @Query() query: QueryGameScheduleDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.leaguesService.getGameSchedule(leagueId, query, user);
  }

  @Get(':id/games/:gameId')
  @RequirePermissions('matches:read')
  @ApiOperation({ summary: 'Get a single game by ID' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'gameId' })
  findGameById(@Param('gameId') gameId: string) {
    return this.leaguesService.findGameById(gameId);
  }

  @Patch(':id/games/:gameId')
  @RequirePermissions('matches:update')
  @ApiOperation({ summary: 'Update game score / status / schedule' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'gameId' })
  updateGame(
    @Param('gameId') gameId: string,
    @Body() dto: UpdateGameScheduleDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.leaguesService.updateGame(gameId, dto, user);
  }

  @Delete(':id/games/:gameId')
  @RequirePermissions('matches:delete')
  @ApiOperation({ summary: 'Delete a scheduled game' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'gameId' })
  removeGame(
    @Param('gameId') gameId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.leaguesService.removeGame(gameId, user);
  }

  @Post(':id/player-stats')
  @RequirePermissions('players:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add or update player stats for this league' })
  @ApiParam({ name: 'id', description: 'League ID' })
  upsertPlayerStats(
    @Param('id') leagueId: string,
    @Body() dto: UpsertPlayerStatsDto,
    @CurrentUser() user: RequestUser,
  ) {
    dto.leagueId = leagueId;
    return this.leaguesService.upsertPlayerStats(dto, user);
  }

  @Get(':id/player-stats')
  @RequirePermissions('players:read')
  @ApiOperation({
    summary: 'Get player stats — filter: scoring | rebounds | misc',
  })
  @ApiParam({ name: 'id', description: 'League ID' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: PlayerStatFilter,
    description:
      'scoring → GP,PPG,FGM,FGA,FG%,FTM,FTA,FT%,3PM,3P%,PTS,HIGH | rebounds → GP,RPG,OFF,DEF,REB | misc → GP,AST,APG,STL,SPG,BLK,BLKPG',
  })
  @ApiQuery({ name: 'teamId', required: false })
  @ApiQuery({ name: 'season', required: false, example: '2024-25' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false, example: 'PTS' })
  @ApiQuery({ name: 'sortOrder', required: false, example: 'desc' })
  getPlayerStats(
    @Param('id') leagueId: string,
    @Query() query: QueryPlayerStatsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.leaguesService.getPlayerStats(leagueId, query, user);
  }

  @Post(':id/team-stats')
  @RequirePermissions('teams:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add or update team stats for this league' })
  @ApiParam({ name: 'id', description: 'League ID' })
  upsertTeamStats(
    @Param('id') leagueId: string,
    @Body() dto: UpsertTeamStatsDto,
    @CurrentUser() user: RequestUser,
  ) {
    dto.leagueId = leagueId;
    return this.leaguesService.upsertTeamStats(dto, user);
  }

  @Get(':id/team-stats')
  @RequirePermissions('teams:read')
  @ApiOperation({
    summary:
      'Get team stats — filter: team_record | player | scoring | rebounds | misc',
  })
  @ApiParam({ name: 'id', description: 'League ID' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: TeamStatFilter,
    description:
      'team_record → Team,Q1,Q2,OT,Total | player → Team,GP | scoring → Team,GP,FGM,FGA,FG%,FTM,FTA,FT%,3PM,3P%,PTS | rebounds → Team,GP,RPG,OFF,DEF,REB | misc → Team,GP,AST,APG,STL,SPG,BLK,BLKPG',
  })
  @ApiQuery({ name: 'season', required: false, example: '2024-25' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false, example: 'wins' })
  @ApiQuery({ name: 'sortOrder', required: false, example: 'desc' })
  getTeamStats(
    @Param('id') leagueId: string,
    @Query() query: QueryTeamStatsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.leaguesService.getTeamStats(leagueId, query, user);
  }
}
