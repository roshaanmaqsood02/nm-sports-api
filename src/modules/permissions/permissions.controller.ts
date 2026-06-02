import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import {
  AssignPermissionsToUserDto,
  RevokePermissionsDto,
} from './dto/assign-permission.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { UserRole } from '../users/enums/user.enum';

@ApiTags('Permissions')
@ApiBearerAuth('JWT-auth')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequirePermissions('permissions:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new permission' })
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  @Get()
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: 'Get all permissions (flat or grouped)' })
  @ApiQuery({ name: 'grouped', required: false, type: Boolean })
  findAll(@Query('grouped') grouped?: string) {
    return this.permissionsService.findAll(grouped === 'true');
  }

  @Get(':id')
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: 'Get a permission by ID' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequirePermissions('permissions:update')
  @ApiOperation({ summary: 'Update a permission' })
  @ApiParam({ name: 'id' })
  update(@Param('id') id: string, @Body() dto: Partial<CreatePermissionDto>) {
    return this.permissionsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions('permissions:delete')
  @ApiOperation({ summary: 'Delete a permission (non-system only)' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }

  @Post('assign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequirePermissions('permissions:assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign permissions to a user' })
  assign(@Body() dto: AssignPermissionsToUserDto) {
    return this.permissionsService.assignToUser(dto);
  }

  @Post('revoke')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequirePermissions('permissions:assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke permissions from a user' })
  revoke(@Body() dto: RevokePermissionsDto) {
    return this.permissionsService.revokeFromUser(dto);
  }

  @Get('user/:userId')
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: "Get a user's current permissions" })
  @ApiParam({ name: 'userId' })
  getUserPermissions(@Param('userId') userId: string) {
    return this.permissionsService.getUserPermissions(userId);
  }
}
