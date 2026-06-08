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
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import {
  UpdateGameDto,
  AddOpponentDto,
  UpdateScoreDto,
} from './dto/update-game.dto';
import { GameResponseDto, PaginatedGamesDto } from './dto/game-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { GameStatus, GameType } from './enums/game.enum';

@ApiTags('Games')
@ApiBearerAuth('JWT-auth')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  @RequirePermissions('teams:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a game — name, date, time, venue, opponents',
  })
  @ApiResponse({ status: 201, type: GameResponseDto })
  create(@Body() dto: CreateGameDto, @CurrentUser() user: RequestUser) {
    return this.gamesService.create(dto, user);
  }

  @Get()
  @RequirePermissions('teams:read')
  @ApiOperation({ summary: 'List all games (paginated + filters)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'teamId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: GameStatus })
  @ApiQuery({ name: 'gameType', required: false, enum: GameType })
  @ApiQuery({ name: 'season', required: false })
  @ApiQuery({ name: 'leagueId', required: false })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-12-31' })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, type: PaginatedGamesDto })
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('organizationId') organizationId?: string,
    @Query('teamId') teamId?: string,
    @Query('status') status?: string,
    @Query('gameType') gameType?: string,
    @Query('season') season?: string,
    @Query('leagueId') leagueId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.gamesService.findAll(+page, +limit, user, {
      organizationId,
      teamId,
      status,
      gameType,
      season,
      leagueId,
      startDate,
      endDate,
      search,
    });
  }

  @Get('stats/:organizationId')
  @RequirePermissions('teams:read')
  @ApiOperation({ summary: 'Game statistics for an organization' })
  @ApiParam({ name: 'organizationId' })
  getStats(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.gamesService.getStats(organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('teams:read')
  @ApiOperation({ summary: 'Get game by ID (includes opponents, venue, time)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: GameResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.gamesService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermissions('teams:update')
  @ApiOperation({ summary: 'Update game details' })
  @ApiParam({ name: 'id' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGameDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.gamesService.update(id, dto, user);
  }

  @Patch(':id/status')
  @RequirePermissions('teams:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update game status' })
  @ApiParam({ name: 'id' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: GameStatus,
    @CurrentUser() user: RequestUser,
  ) {
    return this.gamesService.updateStatus(id, status, user);
  }

  @Patch(':id/score')
  @RequirePermissions('teams:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update game score' })
  @ApiParam({ name: 'id' })
  updateScore(
    @Param('id') id: string,
    @Body() dto: UpdateScoreDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.gamesService.updateScore(id, dto, user);
  }

  @Post(':id/opponents')
  @RequirePermissions('teams:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add an opponent to the game' })
  @ApiParam({ name: 'id' })
  addOpponent(
    @Param('id') id: string,
    @Body() dto: AddOpponentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.gamesService.addOpponent(id, dto, user);
  }

  @Delete(':id/opponents/:opponentId')
  @RequirePermissions('teams:update')
  @ApiOperation({ summary: 'Remove an opponent from the game' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'opponentId' })
  removeOpponent(
    @Param('id') id: string,
    @Param('opponentId') opponentId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.gamesService.removeOpponent(id, opponentId, user);
  }

  @Delete(':id')
  @RequirePermissions('teams:delete')
  @ApiOperation({ summary: 'Delete a game' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.gamesService.remove(id, user);
  }
}
