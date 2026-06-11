// games.controller.ts (updated)
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import {
  UpdateGameDto,
  AddOpponentDto,
  UpdateGameScoreDto,
} from './dto/update-game.dto';
import { GameResponseDto, PaginatedGamesDto } from './dto/game-response.dto';
import { GameQueryDto, GameStatsQueryDto } from './dto/game-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { GameStatus } from './enums/game.enum';

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
  @ApiResponse({ status: 200, type: PaginatedGamesDto })
  findAll(@CurrentUser() user: RequestUser, @Query() query: GameQueryDto) {
    return this.gamesService.findAll(query, user);
  }

  @Get('stats/:organizationId')
  @RequirePermissions('teams:read')
  @ApiOperation({ summary: 'Game statistics for an organization' })
  @ApiParam({ name: 'organizationId' })
  getStats(
    @Param('organizationId') organizationId: string,
    @Query() query: GameStatsQueryDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.gamesService.getStats(organizationId, query, user);
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
    @Body() dto: UpdateGameScoreDto,
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
