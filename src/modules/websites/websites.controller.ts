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
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WebsitesService } from './websites.service';
import {
  ActivateTemplateDto,
  CancelWebsiteDto,
} from './dto/activate-template.dto';
import {
  CreateCustomWebsiteRequestDto,
  UpdateCustomWebsiteRequestStatusDto,
} from './dto/custom-website-request.dto';
import {
  WebsiteResponseDto,
  CustomWebsiteRequestResponseDto,
  PaginatedWebsitesDto,
  PaginatedCustomRequestsDto,
} from './dto/website-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import {
  WebsiteStatus,
  WebsiteTemplateCategory,
  CustomWebsiteRequestStatus,
} from './enums/website.enum';

@ApiTags('Websites')
@ApiBearerAuth('JWT-auth')
@Controller('websites')
export class WebsitesController {
  constructor(private readonly websitesService: WebsitesService) {}

  @Post('activate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Activate a website template for an organization',
    description:
      'Activates a sport-specific template. ' +
      'Only one active template per organization allowed.',
  })
  @ApiResponse({ status: 201, type: WebsiteResponseDto })
  @ApiResponse({
    status: 409,
    description: 'Organization already has an active website',
  })
  activateTemplate(
    @Body() dto: ActivateTemplateDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.websitesService.activateTemplate(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List all websites' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: WebsiteTemplateCategory,
  })
  @ApiQuery({ name: 'status', required: false, enum: WebsiteStatus })
  @ApiResponse({ status: 200, type: PaginatedWebsitesDto })
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('organizationId') organizationId?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    return this.websitesService.findAllWebsites(+page, +limit, user, {
      organizationId,
      category,
      status,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Website and custom request statistics' })
  getStats(@CurrentUser() user: RequestUser) {
    return this.websitesService.getStats(user);
  }

  @Get('organization/:organizationId')
  @ApiOperation({ summary: 'Get active website for an organization' })
  @ApiParam({ name: 'organizationId' })
  @ApiResponse({ status: 200, type: WebsiteResponseDto })
  findByOrg(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.websitesService.findWebsiteByOrg(organizationId, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a website by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: WebsiteResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.websitesService.findWebsiteById(id, user);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel an active website template',
    description: 'Sets website status to cancelled.',
  })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: WebsiteResponseDto })
  cancelWebsite(
    @Param('id') id: string,
    @Body() dto: CancelWebsiteDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.websitesService.cancelWebsite(id, dto, user);
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate a cancelled website' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: WebsiteResponseDto })
  reactivateWebsite(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.websitesService.reactivateWebsite(id, user);
  }

  @Post('custom-requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit a custom website request',
    description:
      'Request a custom-built website. ' +
      'Provide the sport category and a detailed description of your requirements.',
  })
  @ApiResponse({ status: 201, type: CustomWebsiteRequestResponseDto })
  createCustomRequest(
    @Body() dto: CreateCustomWebsiteRequestDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.websitesService.createCustomRequest(dto, user);
  }

  @Get('custom-requests')
  @ApiOperation({ summary: 'List all custom website requests' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: WebsiteTemplateCategory,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: CustomWebsiteRequestStatus,
  })
  @ApiResponse({ status: 200, type: PaginatedCustomRequestsDto })
  findAllCustomRequests(
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('organizationId') organizationId?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    return this.websitesService.findAllCustomRequests(+page, +limit, user, {
      organizationId,
      category,
      status,
    });
  }

  @Get('custom-requests/:id')
  @ApiOperation({ summary: 'Get a custom website request by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: CustomWebsiteRequestResponseDto })
  findCustomRequestById(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.websitesService.findCustomRequestById(id, user);
  }

  @Patch('custom-requests/:id/status')
  @ApiOperation({ summary: 'Admin: update custom request status' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: CustomWebsiteRequestResponseDto })
  updateCustomRequestStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCustomWebsiteRequestStatusDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.websitesService.updateCustomRequestStatus(id, dto, user);
  }

  @Delete('custom-requests/:id')
  @ApiOperation({ summary: 'Cancel a custom website request' })
  @ApiParam({ name: 'id' })
  cancelCustomRequest(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.websitesService.cancelCustomRequest(id, user);
  }
}
