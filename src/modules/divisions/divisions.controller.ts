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
import { DivisionsService } from './divisions.service';
import { CreateDivisionDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';
import {
  DivisionResponseDto,
  PaginatedDivisionsDto,
} from './dto/division-response.dto';
import { QueryDivisionDto } from './dto/query-division.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Divisions')
@ApiBearerAuth('JWT-auth')
@Controller('organizations/:organizationId/divisions')
export class DivisionsController {
  constructor(private readonly divisionsService: DivisionsService) {}

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

  @Get()
  @RequirePermissions('sports:read')
  @ApiOperation({ summary: 'List all divisions in an organization' })
  @ApiParam({ name: 'organizationId' })
  @ApiResponse({ status: 200, type: PaginatedDivisionsDto })
  findAll(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: RequestUser,
    @Query() query: QueryDivisionDto,
  ) {
    const { page, limit, ...filters } = query;
    return this.divisionsService.findAll(
      organizationId,
      page,
      limit,
      user,
      filters,
    );
  }

  @Get(':id')
  @RequirePermissions('sports:read')
  @ApiOperation({ summary: 'Get a division by ID' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: DivisionResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.divisionsService.findOne(id, user);
  }

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

  @Delete(':id')
  @RequirePermissions('sports:delete')
  @ApiOperation({ summary: 'Delete a division' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.divisionsService.remove(id, user);
  }
}
