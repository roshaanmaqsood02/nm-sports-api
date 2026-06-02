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
import { ClubsService } from './clubs.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubResponseDto, PaginatedClubsDto } from './dto/club-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { SportType } from '../organizations/enums/organization.enum';
import { ClubGender, ClubStatus } from './enums/club.enum';

@ApiTags('Clubs')
@ApiBearerAuth('JWT-auth')
@Controller('organizations/:organizationId/clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  // ─── POST /organizations/:organizationId/clubs ────────────────
  @Post()
  @RequirePermissions('sports:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a club under an organization' })
  @ApiParam({ name: 'organizationId' })
  @ApiResponse({ status: 201, type: ClubResponseDto })
  create(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateClubDto,
    @CurrentUser() user: RequestUser,
  ) {
    dto.organizationId = organizationId;
    return this.clubsService.create(dto, user);
  }

  // ─── GET /organizations/:organizationId/clubs ─────────────────
  @Get()
  @RequirePermissions('sports:read')
  @ApiOperation({ summary: 'List all clubs in an organization' })
  @ApiParam({ name: 'organizationId' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'sport', required: false, enum: SportType })
  @ApiQuery({ name: 'gender', required: false, enum: ClubGender })
  @ApiQuery({ name: 'divisionId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ClubStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, type: PaginatedClubsDto })
  findAll(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('sport') sport?: string,
    @Query('gender') gender?: string,
    @Query('divisionId') divisionId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.clubsService.findAll(organizationId, +page, +limit, user, {
      sport,
      gender,
      divisionId,
      status,
      search,
    });
  }

  // ─── GET /organizations/:organizationId/clubs/:id ─────────────
  @Get(':id')
  @RequirePermissions('sports:read')
  @ApiOperation({ summary: 'Get a club by ID' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: ClubResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.clubsService.findOne(id, user);
  }

  // ─── PATCH /organizations/:organizationId/clubs/:id ───────────
  @Patch(':id')
  @RequirePermissions('sports:update')
  @ApiOperation({ summary: 'Update a club' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: ClubResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClubDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.clubsService.update(id, dto, user);
  }

  // ─── DELETE /organizations/:organizationId/clubs/:id ──────────
  @Delete(':id')
  @RequirePermissions('sports:delete')
  @ApiOperation({ summary: 'Delete a club' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.clubsService.remove(id, user);
  }
}
