import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  WebsiteTemplateCategory,
  WebsiteTemplateType,
} from '../enums/website.enum';

export class ActivateTemplateDto {
  @ApiProperty({ example: '64abc123def456' })
  @IsMongoId()
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({
    enum: WebsiteTemplateCategory,
    example: WebsiteTemplateCategory.CRICKET,
    description: 'Sport category for the website template',
  })
  @IsEnum(WebsiteTemplateCategory)
  category!: WebsiteTemplateCategory;

  @ApiPropertyOptional({ example: 'tmpl_cricket_premium_01' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  templateId?: string;

  @ApiPropertyOptional({ example: 'Cricket Pro' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  templateName?: string;

  @ApiPropertyOptional({
    enum: WebsiteTemplateType,
    example: WebsiteTemplateType.STANDARD,
  })
  @IsOptional()
  @IsEnum(WebsiteTemplateType)
  templateType?: WebsiteTemplateType;

  @ApiPropertyOptional({ example: 'Lahore Lions Official Website' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  websiteTitle?: string;

  @ApiPropertyOptional({
    example: 'lahore-lions',
    description: 'Subdomain slug (lowercase, hyphens only)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Subdomain must be lowercase letters, numbers, and hyphens only',
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  subdomain?: string;

  @ApiPropertyOptional({ example: 'www.lahore-lions.com' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  customDomain?: string;

  @ApiPropertyOptional({
    example: 'Official website for Lahore Lions Sports Club',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class CancelWebsiteDto {
  @ApiPropertyOptional({ example: 'Switching to custom website' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
