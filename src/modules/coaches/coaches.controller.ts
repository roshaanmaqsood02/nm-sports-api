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
import { CoachesService } from './coaches.service';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';
import {
  CoachResponseDto,
  PaginatedCoachesDto,
} from './dto/coach-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { CoachStatus, CoachRole } from './enums/coach.enum';

@ApiTags('Coaches')
@ApiBearerAuth('JWT-auth')
@Controller('organizations/:organizationId/coaches')
export class CoachesController {
  constructor(private readonly coachesService: CoachesService) {}

  @Post()
  @RequirePermissions('teams:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a coach and assign to a team' })
  @ApiParam({ name: 'organizationId' })
  @ApiResponse({ status: 201, type: CoachResponseDto })
  @ApiResponse({ status: 409, description: 'Email already exists in this org' })
  create(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateCoachDto,
    @CurrentUser() user: RequestUser,
  ) {
    dto.organizationId = organizationId;
    return this.coachesService.create(dto, user);
  }

  @Get()
  @RequirePermissions('teams:read')
  @ApiOperation({ summary: 'List all coaches in an organization' })
  @ApiParam({ name: 'organizationId' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'teamId', required: false, description: 'Filter by team' })
  @ApiQuery({ name: 'status', required: false, enum: CoachStatus })
  @ApiQuery({ name: 'coachRole', required: false, enum: CoachRole })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, type: PaginatedCoachesDto })
  findAll(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('teamId') teamId?: string,
    @Query('status') status?: string,
    @Query('coachRole') coachRole?: string,
    @Query('search') search?: string,
  ) {
    return this.coachesService.findAll(organizationId, +page, +limit, user, {
      teamId,
      status,
      coachRole,
      search,
    });
  }

  @Get('stats')
  @RequirePermissions('teams:read')
  @ApiOperation({ summary: 'Coach statistics' })
  @ApiParam({ name: 'organizationId' })
  getStats(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.coachesService.getStats(organizationId, user);
  }

  @Get('team/:teamId')
  @RequirePermissions('teams:read')
  @ApiOperation({ summary: 'Get all coaches for a specific team' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'teamId' })
  @ApiResponse({ status: 200, type: [CoachResponseDto] })
  findByTeam(
    @Param('teamId') teamId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.coachesService.findByTeam(teamId, user);
  }

  @Get(':id')
  @RequirePermissions('teams:read')
  @ApiOperation({ summary: 'Get a coach by ID' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: CoachResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.coachesService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermissions('teams:update')
  @ApiOperation({ summary: 'Update a coach' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: CoachResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCoachDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.coachesService.update(id, dto, user);
  }

  @Patch(':id/toggle-status')
  @RequirePermissions('teams:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle coach status between active and inactive' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: CoachResponseDto })
  toggleStatus(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.coachesService.toggleStatus(id, user);
  }

  @Delete(':id')
  @RequirePermissions('teams:delete')
  @ApiOperation({ summary: 'Remove a coach' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.coachesService.remove(id, user);
  }
}
