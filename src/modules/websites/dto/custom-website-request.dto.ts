import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  WebsiteTemplateCategory,
  CustomWebsiteRequestStatus,
} from '../enums/website.enum';

export class CreateCustomWebsiteRequestDto {
  @ApiPropertyOptional({ example: '64abc123def456' })
  @IsOptional()
  @IsMongoId()
  organizationId?: string;

  @ApiProperty({
    enum: WebsiteTemplateCategory,
    example: WebsiteTemplateCategory.CRICKET,
    description: 'Sport category for the custom website',
  })
  @IsEnum(WebsiteTemplateCategory)
  category!: WebsiteTemplateCategory;

  @ApiProperty({
    example:
      'We need a professional website for our cricket club. ' +
      'We want a dark theme with blue accents, player profiles, ' +
      'match schedules, and a news section. The site should ' +
      'support both English and Urdu languages.',
    description:
      'Detailed description of your custom website requirements (max 3000 chars)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20, {
    message:
      'Please provide a more detailed description (at least 20 characters)',
  })
  @MaxLength(3000)
  description!: string;
}

export class UpdateCustomWebsiteRequestStatusDto {
  @ApiProperty({ enum: CustomWebsiteRequestStatus })
  @IsEnum(CustomWebsiteRequestStatus)
  status!: CustomWebsiteRequestStatus;

  @ApiPropertyOptional({ example: 'Request approved. Work starts Monday.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNotes?: string;
}
