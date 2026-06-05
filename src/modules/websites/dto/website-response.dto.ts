import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  WebsiteStatus,
  WebsiteTemplateCategory,
  WebsiteTemplateType,
  CustomWebsiteRequestStatus,
} from '../enums/website.enum';

export class TemplateInfoDto {
  @ApiPropertyOptional() templateId?: string;
  @ApiPropertyOptional() templateName?: string;
  @ApiPropertyOptional({ enum: WebsiteTemplateType })
  templateType?: WebsiteTemplateType;
  @ApiPropertyOptional() previewUrl?: string;
  @ApiPropertyOptional() thumbnailUrl?: string;
}

export class WebsiteResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() organizationId!: string;
  @ApiProperty({ enum: WebsiteTemplateCategory })
  category!: WebsiteTemplateCategory;
  @ApiProperty({ type: () => TemplateInfoDto }) template!: TemplateInfoDto;
  @ApiPropertyOptional() websiteTitle?: string;
  @ApiPropertyOptional() subdomain?: string;
  @ApiPropertyOptional() customDomain?: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty({ enum: WebsiteStatus }) status!: WebsiteStatus;
  @ApiPropertyOptional() activatedAt?: Date;
  @ApiPropertyOptional() cancelledAt?: Date;
  @ApiProperty() createdBy!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class CustomWebsiteRequestResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() referenceNumber!: string;
  @ApiPropertyOptional() organizationId?: string;
  @ApiProperty({ enum: WebsiteTemplateCategory })
  category!: WebsiteTemplateCategory;
  @ApiProperty() description!: string;
  @ApiProperty({ enum: CustomWebsiteRequestStatus })
  status!: CustomWebsiteRequestStatus;
  @ApiPropertyOptional() adminNotes?: string;
  @ApiProperty() submittedBy!: string;
  @ApiPropertyOptional() reviewedAt?: Date;
  @ApiPropertyOptional() completedAt?: Date;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PaginatedWebsitesDto {
  @ApiProperty({ type: [WebsiteResponseDto] }) data!: WebsiteResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}

export class PaginatedCustomRequestsDto {
  @ApiProperty({ type: [CustomWebsiteRequestResponseDto] })
  data!: CustomWebsiteRequestResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}
