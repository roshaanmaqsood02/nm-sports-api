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
import { ClubsService } from './clubs.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubResponseDto, PaginatedClubsDto } from './dto/club-response.dto';
import { QueryClubDto } from './dto/club-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Clubs')
@ApiBearerAuth('JWT-auth')
@Controller('organizations/:organizationId/clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

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

  @Get()
  @RequirePermissions('sports:read')
  @ApiOperation({ summary: 'List all clubs in an organization' })
  @ApiParam({ name: 'organizationId' })
  @ApiResponse({ status: 200, type: PaginatedClubsDto })
  findAll(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: RequestUser,
    @Query() query: QueryClubDto,
  ) {
    const { page, limit, ...filters } = query;
    return this.clubsService.findAll(
      organizationId,
      page,
      limit,
      user,
      filters,
    );
  }

  @Get(':id')
  @RequirePermissions('sports:read')
  @ApiOperation({ summary: 'Get a club by ID' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: ClubResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.clubsService.findOne(id, user);
  }

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

  @Delete(':id')
  @RequirePermissions('sports:delete')
  @ApiOperation({ summary: 'Delete a club' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.clubsService.remove(id, user);
  }
}
