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
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import {
  UpdateStaffDto,
  UpdatePermissionsDto,
  AcceptInvitationDto,
} from './dto/update-staff.dto';
import { StaffResponseDto, PaginatedStaffDto } from './dto/staff-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { OrgAccessType, StaffStatus } from './enums/staff.enum';

@ApiTags('Staff')
@ApiBearerAuth('JWT-auth')
@Controller('organizations/:organizationId/staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  // ─── POST /organizations/:orgId/staff ────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a staff member — Super Admin only',
    description:
      'Creates a staff member and sends an invitation email. ' +
      'orgAccess: no_access | full_access | limited_access. ' +
      'For limited_access, provide resourcePermissions array with ' +
      'checkboxes for organization, teams, players, leagues.',
  })
  @ApiParam({ name: 'organizationId' })
  @ApiResponse({ status: 201, type: StaffResponseDto })
  @ApiResponse({
    status: 403,
    description: 'Only Super Admins can create staff',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already registered in this org',
  })
  create(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateStaffDto,
    @CurrentUser() user: RequestUser,
  ) {
    dto.organizationId = organizationId;
    return this.staffService.create(dto, user);
  }

  // ─── GET /organizations/:orgId/staff ─────────────────────────
  @Get()
  @ApiOperation({ summary: 'List all staff in an organization — Admin only' })
  @ApiParam({ name: 'organizationId' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: StaffStatus })
  @ApiQuery({ name: 'orgAccess', required: false, enum: OrgAccessType })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, type: PaginatedStaffDto })
  findAll(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
    @Query('orgAccess') orgAccess?: string,
    @Query('search') search?: string,
  ) {
    return this.staffService.findAll(organizationId, +page, +limit, user, {
      status,
      orgAccess,
      search,
    });
  }

  // ─── GET /organizations/:orgId/staff/stats ────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Staff statistics — Admin only' })
  @ApiParam({ name: 'organizationId' })
  getStats(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.staffService.getStats(organizationId, user);
  }

  // ─── GET /organizations/:orgId/staff/:id ─────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get a staff member by ID — Admin only' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: StaffResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.staffService.findOne(id, user);
  }

  // ─── PATCH /organizations/:orgId/staff/:id ───────────────────
  @Patch(':id')
  @ApiOperation({ summary: 'Update staff details — Super Admin only' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: StaffResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.staffService.update(id, dto, user);
  }

  // ─── PATCH /organizations/:orgId/staff/:id/permissions ───────
  @Patch(':id/permissions')
  @ApiOperation({
    summary:
      'Update staff permissions — Super Admin only. ' +
      'Change orgAccess level and/or individual resource checkboxes.',
  })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: StaffResponseDto })
  updatePermissions(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.staffService.updatePermissions(id, dto, user);
  }

  // ─── POST /organizations/:orgId/staff/:id/suspend ────────────
  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a staff member — Super Admin only' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  suspend(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.staffService.suspend(id, user);
  }

  // ─── POST /organizations/:orgId/staff/:id/activate ───────────
  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Re-activate a suspended staff member — Super Admin only',
  })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  activate(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.staffService.activate(id, user);
  }

  // ─── POST /organizations/:orgId/staff/:id/resend-invitation ──
  @Post(':id/resend-invitation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend invitation email — Super Admin only' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  resendInvitation(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.staffService.resendInvitation(id, user);
  }

  // ─── POST /staff/accept-invitation ──────────────────────────
  // @Public — no auth required to accept an invite
  @Public()
  @Post('/accept-invitation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Accept a staff invitation — public endpoint. ' +
      'Called when the invited staff member clicks the email link.',
  })
  acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.staffService.acceptInvitation(dto);
  }

  // ─── DELETE /organizations/:orgId/staff/:id ──────────────────
  @Delete(':id')
  @ApiOperation({ summary: 'Remove a staff member — Super Admin only' })
  @ApiParam({ name: 'organizationId' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.staffService.remove(id, user);
  }
}
