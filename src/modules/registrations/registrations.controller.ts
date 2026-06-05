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
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RegistrationsService } from './registrations.service';
import { Step1Dto } from './dto/step1.dto';
import { Step2Dto } from './dto/step2.dto';
import { Step3Dto } from './dto/step3.dto';
import { Step4Dto } from './dto/step4.dto';
import { Step5Dto } from './dto/step5.dto';
import {
  RegistrationResponseDto,
  PaginatedRegistrationsDto,
} from './dto/registration-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { RegistrationStatus } from './enums/registration.enum';

@ApiTags('Registrations')
@ApiBearerAuth('JWT-auth')
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Start a new registration form — returns registration ID for subsequent steps',
  })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiResponse({ status: 201, type: RegistrationResponseDto })
  start(
    @CurrentUser() user: RequestUser,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.registrationsService.start(user, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'List all registrations' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: RegistrationStatus })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, type: PaginatedRegistrationsDto })
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
    @Query('organizationId') organizationId?: string,
    @Query('search') search?: string,
  ) {
    return this.registrationsService.findAll(+page, +limit, user, {
      status,
      organizationId,
      search,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Registration statistics' })
  getStats(@CurrentUser() user: RequestUser) {
    return this.registrationsService.getStats(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a registration by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: RegistrationResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.registrationsService.findOne(id, user);
  }

  @Post(':id/step-1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Step 1 — Preliminary questions: ' +
      'used before, session type (new/copy), timeline, copy details',
  })
  @ApiParam({ name: 'id', description: 'Registration ID' })
  @ApiResponse({ status: 200, type: RegistrationResponseDto })
  saveStep1(
    @Param('id') id: string,
    @Body() dto: Step1Dto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.registrationsService.saveStep1(id, dto, user);
  }

  @Post(':id/step-2')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Step 2 — Registration details: ' +
      'org info, sport, who registers, waivers, groups, financials',
  })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: RegistrationResponseDto })
  saveStep2(
    @Param('id') id: string,
    @Body() dto: Step2Dto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.registrationsService.saveStep2(id, dto, user);
  }

  @Post(':id/step-3')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Step 3 — Contact information: ' +
      'public contact, internal contact, notification preferences',
  })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: RegistrationResponseDto })
  saveStep3(
    @Param('id') id: string,
    @Body() dto: Step3Dto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.registrationsService.saveStep3(id, dto, user);
  }

  @Post(':id/step-4')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Step 4 — Agreement: ' +
      'digital signature + agree to terms. ' +
      'signatureData: base64 image or typed name',
  })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: RegistrationResponseDto })
  saveStep4(
    @Param('id') id: string,
    @Body() dto: Step4Dto,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ??
      req.socket?.remoteAddress ??
      'unknown';
    return this.registrationsService.saveStep4(id, dto, user, ip);
  }

  @Post(':id/step-5')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Step 5 — Payment: ' +
      'Rush fee ($100 if rush timeline). ' +
      'No payment gateway implemented yet — invoice will be sent.',
  })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: RegistrationResponseDto })
  saveStep5(
    @Param('id') id: string,
    @Body() dto: Step5Dto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.registrationsService.saveStep5(id, dto, user);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Step 6 — Submit the completed registration. ' +
      'All steps must be saved before submitting.',
  })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: RegistrationResponseDto })
  submit(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.registrationsService.submit(id, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Admin: update registration status' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      example: {
        status: 'processing',
        adminNotes: 'We have received your registration and are processing it.',
      },
    },
  })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: RegistrationStatus,
    @Body('adminNotes') adminNotes: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.registrationsService.updateStatus(id, status, adminNotes, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a draft registration' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.registrationsService.remove(id, user);
  }
}
