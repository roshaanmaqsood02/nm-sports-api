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
  Put,
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
import { PowerRankingsService } from './power-rankings.service';
import { CreatePowerRankingDto } from './dto/create-power-ranking.dto';
import {
  UpdatePowerRankingDto,
  RankedTeamDto,
  ReorderRankingsDto,
} from './dto/update-power-ranking.dto';
import {
  PowerRankingResponseDto,
  PaginatedPowerRankingsDto,
} from './dto/power-ranking-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { PowerRankingStatus } from './enums/power-ranking.enum';

@ApiTags('Power Rankings')
@ApiBearerAuth('JWT-auth')
@Controller('power-rankings')
export class PowerRankingsController {
  constructor(private readonly powerRankingsService: PowerRankingsService) {}

  @Post()
  @RequirePermissions('sports:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new power ranking',
    description:
      'Creates the ranking header (title, label, league, subseason). ' +
      'Team rows are added separately via POST /power-rankings/:id/rows.',
  })
  @ApiResponse({ status: 201, type: PowerRankingResponseDto })
  create(@Body() dto: CreatePowerRankingDto, @CurrentUser() user: RequestUser) {
    return this.powerRankingsService.create(dto, user);
  }

  @Get()
  @RequirePermissions('sports:read')
  @ApiOperation({ summary: 'List all power rankings (paginated + filters)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'leagueId', required: false })
  @ApiQuery({ name: 'subseasonId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: PowerRankingStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, type: PaginatedPowerRankingsDto })
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('organizationId') organizationId?: string,
    @Query('leagueId') leagueId?: string,
    @Query('subseasonId') subseasonId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.powerRankingsService.findAll(+page, +limit, user, {
      organizationId,
      leagueId,
      subseasonId,
      status,
      search,
    });
  }

  @Get('stats')
  @RequirePermissions('sports:read')
  @ApiOperation({ summary: 'Power ranking statistics' })
  getStats(@CurrentUser() user: RequestUser) {
    return this.powerRankingsService.getStats(user);
  }

  @Get(':id')
  @RequirePermissions('sports:read')
  @ApiOperation({
    summary: 'Get a power ranking by ID (includes all team rows)',
  })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: PowerRankingResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.powerRankingsService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermissions('sports:update')
  @ApiOperation({
    summary:
      'Edit power ranking — update title, subseason name, label, ' +
      'and optionally replace the full rankings array at once.',
  })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: PowerRankingResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePowerRankingDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.powerRankingsService.update(id, dto, user);
  }

  @Post(':id/publish')
  @RequirePermissions('sports:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a draft power ranking' })
  @ApiParam({ name: 'id' })
  publish(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.powerRankingsService.publish(id, user);
  }

  @Post(':id/archive')
  @RequirePermissions('sports:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a power ranking' })
  @ApiParam({ name: 'id' })
  archive(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.powerRankingsService.archive(id, user);
  }

  @Delete(':id')
  @RequirePermissions('sports:delete')
  @ApiOperation({ summary: 'Delete a power ranking' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.powerRankingsService.remove(id, user);
  }

  @Post(':id/rows')
  @RequirePermissions('sports:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add a team row to the ranking',
    description:
      'Adds a new ranked team row. ' +
      'If the rank position is already taken, existing rows shift down automatically.',
  })
  @ApiParam({ name: 'id', description: 'Power Ranking ID' })
  @ApiResponse({ status: 200, type: PowerRankingResponseDto })
  addRow(
    @Param('id') id: string,
    @Body() dto: RankedTeamDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.powerRankingsService.addRow(id, dto, user);
  }

  @Patch(':id/rows/:rowId')
  @RequirePermissions('sports:update')
  @ApiOperation({
    summary: 'Update a specific team row',
    description:
      'Updates rank, team name, record, points, notes for a specific row. ' +
      'Change direction (up/down/same) is auto-computed from previousRank vs rank.',
  })
  @ApiParam({ name: 'id', description: 'Power Ranking ID' })
  @ApiParam({ name: 'rowId', description: 'Row _id' })
  @ApiResponse({ status: 200, type: PowerRankingResponseDto })
  updateRow(
    @Param('id') id: string,
    @Param('rowId') rowId: string,
    @Body() dto: RankedTeamDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.powerRankingsService.updateRow(id, rowId, dto, user);
  }

  @Delete(':id/rows/:rowId')
  @RequirePermissions('sports:update')
  @ApiOperation({
    summary: 'Remove a row (hard delete from ranking)',
    description: 'Permanently removes the row from the rankings array.',
  })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'rowId' })
  @ApiResponse({ status: 200, type: PowerRankingResponseDto })
  deleteRow(
    @Param('id') id: string,
    @Param('rowId') rowId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.powerRankingsService.deleteRow(id, rowId, user);
  }

  @Post(':id/rows/reorder')
  @RequirePermissions('sports:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reorder rows by providing ordered row IDs',
    description:
      'Pass orderedIds in the new top-to-bottom order. ' +
      'Ranks are automatically reassigned (1, 2, 3...) ' +
      'and changeDirection is updated based on previous positions.',
  })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      example: {
        orderedIds: [
          '64abc123def459',
          '64abc123def460',
          '64abc123def461',
          '64abc123def462',
        ],
      },
    },
  })
  @ApiResponse({ status: 200, type: PowerRankingResponseDto })
  reorderRows(
    @Param('id') id: string,
    @Body() dto: ReorderRankingsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.powerRankingsService.reorderRows(id, dto, user);
  }
}
