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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamResponseDto, PaginatedTeamsDto } from './dto/team-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AuditAction, AuditSeverity } from '../audit/enums/audit.enum';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';
import {
  logoStorage,
  imageFileFilter,
  MAX_FILE_SIZE,
} from '../../common/upload/multer.config';
import { SportType } from '../organizations/enums/organization.enum';
import { TeamGender, TeamType, TeamStatus } from './enums/team.enum';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Teams')
@ApiBearerAuth('JWT-auth')
@UseInterceptors(AuditInterceptor)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @RequirePermissions('teams:create')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: logoStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  @AuditLog({
    action: AuditAction.TEAM_CREATED,
    resource: 'Team',
    severity: AuditSeverity.LOW,
    captureBody: true,
  })
  @ApiOperation({ summary: 'Create a new team' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Team data + optional logo file',
    schema: {
      type: 'object',
      required: [
        'name',
        'shortName',
        'abbreviation',
        'sport',
        'gender',
        'type',
        'season',
        'organizationId',
        'clubOrLeague',
      ],
      properties: {
        name: { type: 'string', example: 'Lahore Lions Cricket Club' },
        shortName: { type: 'string', example: 'Lahore Lions' },
        abbreviation: { type: 'string', example: 'LLC' },
        sport: { type: 'string', example: 'cricket' },
        gender: { type: 'string', example: 'male' },
        type: { type: 'string', example: 'club' },
        season: { type: 'string', example: '2024-25' },
        subSeason: { type: 'string', example: 'Spring' },
        organizationId: { type: 'string', example: '64abc123def456' },
        clubOrLeague: { type: 'string', example: '64abc123def456' },
        primaryColor: { type: 'string', example: '#1A73E8' },
        secondaryColor: { type: 'string', example: '#FFFFFF' },
        logo: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, type: TeamResponseDto })
  @ApiResponse({
    status: 409,
    description: 'Name or abbreviation already exists',
  })
  create(
    @Body() dto: CreateTeamDto,
    @CurrentUser() user: RequestUser,
    @UploadedFile() logoFile?: Express.Multer.File,
  ) {
    return this.teamsService.create(dto, user, logoFile);
  }

  @Get()
  @RequirePermissions('teams:read')
  @ApiOperation({ summary: 'List all teams (paginated + filters)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search name, shortName, abbreviation',
  })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'clubOrLeague', required: false })
  @ApiQuery({ name: 'sport', required: false, enum: SportType })
  @ApiQuery({ name: 'gender', required: false, enum: TeamGender })
  @ApiQuery({ name: 'type', required: false, enum: TeamType })
  @ApiQuery({ name: 'season', required: false, example: '2024-25' })
  @ApiQuery({ name: 'subSeason', required: false, example: 'Spring' })
  @ApiQuery({ name: 'status', required: false, enum: TeamStatus })
  @ApiResponse({ status: 200, type: PaginatedTeamsDto })
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('organizationId') organizationId?: string,
    @Query('clubOrLeague') clubOrLeague?: string,
    @Query('sport') sport?: string,
    @Query('gender') gender?: string,
    @Query('type') type?: string,
    @Query('season') season?: string,
    @Query('subSeason') subSeason?: string,
    @Query('status') status?: string,
  ) {
    return this.teamsService.findAll(+page, +limit, user, {
      organizationId,

      clubOrLeague,
      sport,
      gender,
      type,
      season,
      subSeason,
      status,
      search,
    });
  }

  @Get('stats')
  @RequirePermissions('teams:read')
  @ApiOperation({ summary: 'Team count statistics' })
  getStats(@CurrentUser() user: RequestUser) {
    return this.teamsService.getStats(user);
  }

  @Get(':id')
  @RequirePermissions('teams:read')
  @ApiOperation({ summary: 'Get a team by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: TeamResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.teamsService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermissions('teams:update')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: logoStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  @AuditLog({
    action: AuditAction.TEAM_UPDATED,
    resource: 'Team',
    severity: AuditSeverity.LOW,
    captureBody: true,
  })
  @ApiOperation({ summary: 'Update a team' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: TeamResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTeamDto,
    @CurrentUser() user: RequestUser,
    @UploadedFile() logoFile?: Express.Multer.File,
  ) {
    return this.teamsService.update(id, dto, user, logoFile);
  }

  @Delete(':id/logo')
  @RequirePermissions('teams:update')
  @ApiOperation({ summary: 'Remove team logo' })
  @ApiParam({ name: 'id' })
  removeLogo(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.teamsService.removeLogo(id, user);
  }

  @Delete(':id')
  @RequirePermissions('teams:delete')
  @AuditLog({
    action: AuditAction.TEAM_DELETED,
    resource: 'Team',
    severity: AuditSeverity.HIGH,
  })
  @ApiOperation({ summary: 'Soft-delete a team' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.teamsService.remove(id, user);
  }
}
