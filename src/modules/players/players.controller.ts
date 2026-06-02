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
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import {
  PlayerResponseDto,
  PaginatedPlayersDto,
} from './dto/player-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AuditAction, AuditSeverity } from '../audit/enums/audit.enum';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';
import { PlayerStatus } from './enums/player.enum';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Players')
@ApiBearerAuth('JWT-auth')
@UseInterceptors(AuditInterceptor)
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  // ─── POST /players ────────────────────────────────────────────
  @Post()
  @RequirePermissions('players:create')
  @HttpCode(HttpStatus.CREATED)
  @AuditLog({
    action: AuditAction.PLAYER_CREATED,
    resource: 'Player',
    severity: AuditSeverity.LOW,
    captureBody: true,
  })
  @ApiOperation({ summary: 'Create a new player profile' })
  @ApiBody({ type: CreatePlayerDto })
  @ApiResponse({ status: 201, type: PlayerResponseDto })
  create(@Body() dto: CreatePlayerDto, @CurrentUser() user: RequestUser) {
    return this.playersService.create(dto, user);
  }

  // ─── GET /players ─────────────────────────────────────────────
  @Get()
  @RequirePermissions('players:read')
  @ApiOperation({ summary: 'List players (paginated + filters)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'teamId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: PlayerStatus })
  @ApiResponse({ status: 200, type: PaginatedPlayersDto })
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('organizationId') organizationId?: string,
    @Query('teamId') teamId?: string,
    @Query('status') status?: string,
  ) {
    return this.playersService.findAll(+page, +limit, user, {
      organizationId,
      teamId,
      status,
      search,
    });
  }

  // ─── GET /players/stats ───────────────────────────────────────
  @Get('stats')
  @RequirePermissions('players:read')
  @ApiOperation({ summary: 'Player count statistics' })
  getStats(@CurrentUser() user: RequestUser) {
    return this.playersService.getStats(user);
  }

  // ─── GET /players/:id ─────────────────────────────────────────
  @Get(':id')
  @RequirePermissions('players:read')
  @ApiOperation({ summary: 'Get player by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: PlayerResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.playersService.findOne(id, user);
  }

  // ─── PATCH /players/:id ───────────────────────────────────────
  @Patch(':id')
  @RequirePermissions('players:update')
  @AuditLog({
    action: AuditAction.PLAYER_UPDATED,
    resource: 'Player',
    severity: AuditSeverity.LOW,
    captureBody: true,
  })
  @ApiOperation({ summary: 'Update player profile' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdatePlayerDto })
  @ApiResponse({ status: 200, type: PlayerResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePlayerDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.playersService.update(id, dto, user);
  }

  // ─── DELETE /players/:id ──────────────────────────────────────
  @Delete(':id')
  @RequirePermissions('players:delete')
  @AuditLog({
    action: AuditAction.PLAYER_DELETED,
    resource: 'Player',
    severity: AuditSeverity.HIGH,
  })
  @ApiOperation({ summary: 'Soft-delete a player' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.playersService.remove(id, user);
  }
}
