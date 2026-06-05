import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SignatureDto {
  @ApiProperty({
    example: 'data:image/png;base64,iVBORw0KGgo...',
    description:
      'Base64 encoded signature image OR typed full name as signature',
  })
  @IsString()
  @IsNotEmpty()
  signatureData!: string;

  @ApiProperty({ example: 'John Smith' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  signedBy!: string;
}

export class Step4Dto {
  @ApiProperty({ type: () => SignatureDto })
  signature!: SignatureDto;

  @ApiProperty({
    example: true,
    description:
      'Must be true to proceed — user agrees to terms and conditions',
  })
  @IsBoolean()
  agreedToTerms!: boolean;
}
