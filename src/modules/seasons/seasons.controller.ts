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
import { SeasonsService } from './seasons.service';
import { CreateSeasonDto, CreateSubseasonDto } from './dto/create-season.dto';
import {
  UpdateSeasonDto,
  UpdateSubseasonDto,
  GenerateSeedsDto,
  GenerateGameIdsDto,
} from './dto/update-season.dto';
import {
  SeasonResponseDto,
  PaginatedSeasonsDto,
  GeneratedGameIdsDto,
  GeneratedSeedsDto,
} from './dto/season-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { SeasonType, SeasonStatus } from './enums/season.enum';

@ApiTags('Seasons')
@ApiBearerAuth('JWT-auth')
@Controller('organizations/:organizationId/seasons')
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  // SEASON CRUD

  @Post()
  @RequirePermissions('sports:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a season under an organization' })
  @ApiParam({ name: 'organizationId' })
  @ApiResponse({ status: 201, type: SeasonResponseDto })
  create(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateSeasonDto,
    @CurrentUser() user: RequestUser,
  ) {
    dto.organizationId = organizationId;
    return this.seasonsService.create(dto, user);
  }

  @Get()
  @RequirePermissions('sports:read')
  @ApiOperation({ summary: 'List all seasons in an organization' })
  @ApiParam({ name: 'organizationId' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'type', required: false, enum: SeasonType })
  @ApiQuery({ name: 'status', required: false, enum: SeasonStatus })
  @ApiQuery({ name: 'clubOrLeagueId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, type: PaginatedSeasonsDto })
  findAll(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('clubOrLeagueId') clubOrLeagueId?: string,
    @Query('search') search?: string,
  ) {
    return this.seasonsService.findAll(organizationId, +page, +limit, user, {
      type,
      status,
      clubOrLeagueId,
      search,
    });
  }

  @Get('stats')
  @RequirePermissions('sports:read')
  @ApiOperation({ summary: 'Season statistics for an organization' })
  @ApiParam({ name: 'organizationId' })
  getStats(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.seasonsService.getStats(organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('sports:read')
  @ApiOperation({ summary: 'Get a season by ID (includes subseasons)' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: SeasonResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.seasonsService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermissions('sports:update')
  @ApiOperation({ summary: 'Update a season' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSeasonDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.seasonsService.update(id, dto, user);
  }

  @Post(':id/activate')
  @RequirePermissions('sports:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a draft season' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  activate(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.seasonsService.activate(id, user);
  }

  @Post(':id/complete')
  @RequirePermissions('sports:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete an active season' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  complete(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.seasonsService.complete(id, user);
  }

  @Delete(':id')
  @RequirePermissions('sports:delete')
  @ApiOperation({ summary: 'Delete a season' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.seasonsService.remove(id, user);
  }

  // SUBSEASON

  @Post(':id/subseasons')
  @RequirePermissions('sports:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Add a subseason — choose dataSource: start_from_scratch | from_club_import | copy_subseason',
  })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id', description: 'Season ID' })
  @ApiResponse({ status: 201, type: SeasonResponseDto })
  addSubseason(
    @Param('id') id: string,
    @Body() dto: CreateSubseasonDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.seasonsService.addSubseason(id, dto, user);
  }

  @Patch(':id/subseasons/:subseasonId')
  @RequirePermissions('sports:update')
  @ApiOperation({ summary: 'Update a subseason' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'subseasonId' })
  updateSubseason(
    @Param('id') id: string,
    @Param('subseasonId') subseasonId: string,
    @Body() dto: UpdateSubseasonDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.seasonsService.updateSubseason(id, subseasonId, dto, user);
  }

  @Delete(':id/subseasons/:subseasonId')
  @RequirePermissions('sports:delete')
  @ApiOperation({ summary: 'Remove a subseason' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'subseasonId' })
  removeSubseason(
    @Param('id') id: string,
    @Param('subseasonId') subseasonId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.seasonsService.removeSubseason(id, subseasonId, user);
  }

  @Patch(':id/subseasons/reorder')
  @RequirePermissions('sports:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder subseasons by providing ordered IDs' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      example: {
        orderedIds: ['64abc123def456', '64abc123def457', '64abc123def458'],
      },
    },
  })
  reorderSubseasons(
    @Param('id') id: string,
    @Body('orderedIds') orderedIds: string[],
    @CurrentUser() user: RequestUser,
  ) {
    return this.seasonsService.reorderSubseasons(id, orderedIds, user);
  }

  // GAME ID GENERATION

  @Post(':id/subseasons/:subseasonId/generate-game-ids')
  @RequirePermissions('sports:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Generate game IDs for a subseason (requires gameIdGeneration = auto_generate)',
  })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'subseasonId' })
  @ApiResponse({ status: 200, type: GeneratedGameIdsDto })
  generateGameIds(
    @Param('id') id: string,
    @Param('subseasonId') subseasonId: string,
    @Body() dto: GenerateGameIdsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.seasonsService.generateGameIds(id, subseasonId, dto, user);
  }

  // SEED GENERATION

  @Post(':id/subseasons/:subseasonId/generate-seeds')
  @RequirePermissions('sports:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Generate seeds for a subseason (requires seedConfig.enabled = true)',
  })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'subseasonId' })
  @ApiResponse({ status: 200, type: GeneratedSeedsDto })
  generateSeeds(
    @Param('id') id: string,
    @Param('subseasonId') subseasonId: string,
    @Body() dto: GenerateSeedsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.seasonsService.generateSeeds(id, subseasonId, dto, user);
  }
}
