import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContactMethod } from '../enums/registration.enum';

export class ContactPersonDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(60)
  firstName!: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(60)
  lastName!: string;

  @ApiPropertyOptional({ example: '+1 (555) 123-4567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ example: 'john.smith@organization.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'john.smith@organization.com' })
  @IsEmail()
  confirmEmail!: string;
}

export class Step3Dto {
  @ApiProperty({ type: () => ContactPersonDto })
  @ValidateNested()
  @Type(() => ContactPersonDto)
  publicContact!: ContactPersonDto;

  @ApiProperty({
    example: true,
    description: 'Notify on every completed registration?',
  })
  @IsBoolean()
  notifyOnEveryRegistration!: boolean;

  @ApiProperty({
    example: false,
    description: 'Is the internal contact the same as the public contact?',
  })
  @IsBoolean()
  internalContactSameAsPublic!: boolean;

  @ApiPropertyOptional({
    type: () => ContactPersonDto,
    description: 'Required if internalContactSameAsPublic = false',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactPersonDto)
  internalContact?: ContactPersonDto;

  @ApiProperty({
    enum: ContactMethod,
    description: 'email | phone',
  })
  @IsEnum(ContactMethod)
  preferredContactMethod!: ContactMethod;

  @ApiProperty({
    example: false,
    description: 'Participate in Kingda Sports product research?',
  })
  @IsBoolean()
  participateInResearch!: boolean;
}
