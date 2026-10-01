import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { Gender } from '../../../../generated/client';

export class SearchDoctorsToolInputDto {
  @IsString()
  @IsNotEmpty()
  specialty!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  hospital?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsIn(['AR', 'EN'])
  language?: 'AR' | 'EN';
}