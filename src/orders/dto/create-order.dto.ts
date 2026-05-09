import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateRecipientDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @Matches(/^\d{1,4}$/)
  phoneCountryCode!: string;

  @IsString()
  @Matches(/^\d{7,15}$/)
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsNotEmpty()
  department!: string;

  @IsString()
  @IsNotEmpty()
  municipality!: string;

  @IsOptional()
  @IsString()
  referencePoint?: string;

  @IsOptional()
  @IsString()
  instructions?: string;
}

export class CreatePackageItemDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  lengthCm!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  heightCm!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  widthCm!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  weightPounds!: number;

  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  pickupAddress!: string;

  @IsDateString()
  scheduledDate!: string;

  @ValidateNested()
  @Type(() => CreateRecipientDto)
  recipient!: CreateRecipientDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePackageItemDto)
  packages!: CreatePackageItemDto[];
}
