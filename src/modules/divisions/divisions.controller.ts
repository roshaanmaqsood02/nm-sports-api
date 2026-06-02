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
import { DivisionsService } from './divisions.service';
import { CreateDivisionDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';
import {
  DivisionResponseDto,
  PaginatedDivisionsDto,
} from './dto/division-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { DivisionType, DivisionStatus } from './enums/division.enum';

@ApiTags('Divisions')
@ApiBearerAuth('JWT-auth')
@Controller('organizations/:organizationId/divisions')
export class DivisionsController {
  constructor(private readonly divisionsService: DivisionsService) {}

  // ─── POST /organizations/:organizationId/divisions ────────────
  @Post()
  @RequirePermissions('sports:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a division under an organization' })
  @ApiParam({ name: 'organizationId' })
  @ApiResponse({ status: 201, type: DivisionResponseDto })
  create(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateDivisionDto,
    @CurrentUser() user: RequestUser,
  ) {
    dto.organizationId = organizationId;
    return this.divisionsService.create(dto, user);
  }

  // ─── GET /organizations/:organizationId/divisions ─────────────
  @Get()
  @RequirePermissions('sports:read')
  @ApiOperation({ summary: 'List all divisions in an organization' })
  @ApiParam({ name: 'organizationId' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'type', required: false, enum: DivisionType })
  @ApiQuery({ name: 'status', required: false, enum: DivisionStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, type: PaginatedDivisionsDto })
  findAll(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.divisionsService.findAll(organizationId, +page, +limit, user, {
      type,
      status,
      search,
    });
  }

  // ─── GET /organizations/:organizationId/divisions/:id ─────────
  @Get(':id')
  @RequirePermissions('sports:read')
  @ApiOperation({ summary: 'Get a division by ID' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: DivisionResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.divisionsService.findOne(id, user);
  }

  // ─── PATCH /organizations/:organizationId/divisions/:id ───────
  @Patch(':id')
  @RequirePermissions('sports:update')
  @ApiOperation({ summary: 'Update a division' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: DivisionResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDivisionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.divisionsService.update(id, dto, user);
  }

  // ─── DELETE /organizations/:organizationId/divisions/:id ──────
  @Delete(':id')
  @RequirePermissions('sports:delete')
  @ApiOperation({ summary: 'Delete a division' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.divisionsService.remove(id, user);
  }
}
