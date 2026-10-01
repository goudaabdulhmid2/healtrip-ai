import { BadRequestException, Injectable } from '@nestjs/common';
import { Gender } from '../../../generated/client';
import {
  DoctorsService,
  SearchDoctorsParams,
} from '../../doctors/doctors.service';

const SUPPORTED_SPECIALTIES = new Set([
  'CARDIOLOGY',
  'NEUROLOGY',
  'DERMATOLOGY',
  'ORTHOPEDICS',
]);

const SUPPORTED_LANGUAGES = new Set(['AR', 'EN']);

export interface SearchDoctorsToolInput {
  specialty: string;
  city: string;
  hospital?: string;
  gender?: 'MALE' | 'FEMALE';
  language?: 'AR' | 'EN';
}

@Injectable()
export class SearchDoctorsTool {
  constructor(private readonly doctorsService: DoctorsService) {}

  async execute(input: SearchDoctorsToolInput) {
    const params = this.validateAndNormalize(input);

    const doctors = await this.doctorsService.search(params);

    return {
      success: true,
      count: doctors.length,
      doctors,
    };
  }

  private validateAndNormalize(
    input: SearchDoctorsToolInput,
  ): SearchDoctorsParams {
    if (!input?.specialty || typeof input.specialty !== 'string') {
      throw new BadRequestException('specialty is required');
    }

    if (!input?.city || typeof input.city !== 'string') {
      throw new BadRequestException('city is required');
    }

    const specialty = input.specialty.trim().toUpperCase();
    const city = input.city.trim();

    if (!SUPPORTED_SPECIALTIES.has(specialty)) {
      throw new BadRequestException(
        `Unsupported specialty: ${input.specialty}`,
      );
    }

    if (
      input.gender !== undefined &&
      !['MALE', 'FEMALE'].includes(input.gender)
    ) {
      throw new BadRequestException('Invalid gender');
    }

    if (
      input.language !== undefined &&
      !SUPPORTED_LANGUAGES.has(input.language)
    ) {
      throw new BadRequestException('Unsupported language');
    }

    return {
      specialty,
      city,
      hospital: input.hospital?.trim() || undefined,
      gender: input.gender as Gender | undefined,
      language: input.language,
    };
  }
}