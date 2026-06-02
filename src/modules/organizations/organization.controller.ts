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
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import {
  OrganizationResponseDto,
  PaginatedOrganizationsDto,
} from './dto/organization-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AuditAction, AuditSeverity } from '../audit/enums/audit.enum';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';
import {
  imageFileFilter,
  logoStorage,
  MAX_FILE_SIZE,
} from 'src/common/upload/multer.config';
import { UpdateOrganizationDto } from './dto/update-organization';

@ApiTags('Organizations')
@ApiBearerAuth('JWT-auth')
@UseInterceptors(AuditInterceptor)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  // POST /organizations
  @Post()
  @RequirePermissions('organizations:create')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: logoStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  @AuditLog({
    action: AuditAction.ORGANIZATION_CREATED,
    resource: 'Organization',
    severity: AuditSeverity.MEDIUM,
    captureBody: true,
  })
  @ApiOperation({ summary: 'Create a new organization (with optional logo)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Organization data + optional logo file',
    schema: {
      type: 'object',
      required: [
        'name',
        'sports',
        'gender',
        'address',
        'city',
        'state',
        'country',
        'zipCode',
      ],
      properties: {
        name: { type: 'string', example: 'Lahore Lions SC' },
        acronym: { type: 'string', example: 'LLSC' },
        sports: {
          type: 'array',
          items: { type: 'string' },
          example: ['cricket', 'football'],
        },
        gender: { type: 'string', example: 'mixed' },
        email: { type: 'string', example: 'info@llsc.com' },
        phone: { type: 'string', example: '+923001234567' },
        website: { type: 'string', example: 'https://llsc.com' },
        address: { type: 'string', example: '123 Main St' },
        city: { type: 'string', example: 'Lahore' },
        state: { type: 'string', example: 'Punjab' },
        country: { type: 'string', example: 'Pakistan' },
        zipCode: { type: 'string', example: '54000' },
        timezone: { type: 'string', example: 'Asia/Karachi' },
        color: { type: 'string', example: '#1A73E8' },
        logo: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, type: OrganizationResponseDto })
  @ApiResponse({
    status: 409,
    description: 'Organization name/acronym already exists',
  })
  create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: RequestUser,
    @UploadedFile() logoFile?: Express.Multer.File,
  ) {
    return this.organizationsService.create(dto, user, logoFile);
  }

  // GET /organizations
  @Get()
  @RequirePermissions('organizations:read')
  @ApiOperation({ summary: 'List organizations (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, type: PaginatedOrganizationsDto })
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
  ) {
    return this.organizationsService.findAll(+page, +limit, search, user);
  }

  // GET /organizations/stats
  @Get('stats')
  @RequirePermissions('organizations:read')
  @ApiOperation({ summary: 'Organization statistics' })
  getStats(@CurrentUser() user: RequestUser) {
    return this.organizationsService.getStats(user);
  }

  // GET /organizations/:id
  @Get(':id')
  @RequirePermissions('sports:read')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.organizationsService.findOne(id, user);
  }

  // PATCH /organizations/:id
  @Patch(':id')
  @RequirePermissions('organizations:update')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: logoStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  @AuditLog({
    action: AuditAction.ORGANIZATION_UPDATED,
    resource: 'Organization',
    severity: AuditSeverity.MEDIUM,
    captureBody: true,
  })
  @ApiOperation({ summary: 'Update organization (with optional new logo)' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: RequestUser,
    @UploadedFile() logoFile?: Express.Multer.File,
  ) {
    return this.organizationsService.update(id, dto, user, logoFile);
  }

  // DELETE /organizations/:id/logo
  @Delete(':id/logo')
  @RequirePermissions('organizations:update')
  @ApiOperation({ summary: 'Remove organization logo' })
  @ApiParam({ name: 'id' })
  removeLogo(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.organizationsService.removeLogo(id, user);
  }

  // POST /organizations/:id/members/:userId
  @Post(':id/members/:userId')
  @RequirePermissions('organizations:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a member to an organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiParam({ name: 'userId', description: 'User ID to add' })
  addMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.organizationsService.addMember(id, userId, user);
  }

  // DELETE /organizations/:id/members/:userId
  @Delete(':id/members/:userId')
  @RequirePermissions('organizations:update')
  @ApiOperation({ summary: 'Remove a member from an organization' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'userId' })
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.organizationsService.removeMember(id, userId, user);
  }

  // DELETE /organizations/:id
  @Delete(':id')
  @AuditLog({
    action: AuditAction.ORGANIZATION_DELETED,
    resource: 'Organization',
    severity: AuditSeverity.HIGH,
  })
  @RequirePermissions('organizations:delete')
  @ApiOperation({ summary: 'Soft-delete an organization' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.organizationsService.remove(id, user);
  }
}
