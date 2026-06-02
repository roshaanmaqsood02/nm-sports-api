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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-roles.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { UserRole } from '../users/enums/user.enum';

@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequirePermissions('roles:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new role' })
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Get()
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'Get all active roles' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Get(':id/permissions')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: "Get a role's permissions" })
  @ApiParam({ name: 'id' })
  getRolePermissions(@Param('id') id: string) {
    return this.rolesService.getRolePermissions(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequirePermissions('roles:update')
  @ApiOperation({ summary: 'Update a role' })
  @ApiParam({ name: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Patch(':id/permissions/add')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequirePermissions('roles:update', 'permissions:assign')
  @ApiOperation({ summary: 'Add permissions to a role' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      example: { permissions: ['reports:export', 'audit:read'] },
    },
  })
  addPermissions(
    @Param('id') id: string,
    @Body('permissions') permissions: string[],
  ) {
    return this.rolesService.addPermissionsToRole(id, permissions);
  }

  @Patch(':id/permissions/remove')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequirePermissions('roles:update', 'permissions:assign')
  @ApiOperation({ summary: 'Remove permissions from a role' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      example: { permissions: ['reports:export'] },
    },
  })
  removePermissions(
    @Param('id') id: string,
    @Body('permissions') permissions: string[],
  ) {
    return this.rolesService.removePermissionsFromRole(id, permissions);
  }

  @Post('assign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @RequirePermissions('roles:assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a role to a user' })
  assignRole(@Body() dto: AssignRoleDto) {
    return this.rolesService.assignRoleToUser(dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions('roles:delete')
  @ApiOperation({ summary: 'Delete a role (non-system only)' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
