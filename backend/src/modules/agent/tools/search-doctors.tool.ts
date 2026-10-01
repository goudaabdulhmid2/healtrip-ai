import { BadRequestException, Injectable } from '@nestjs/common';

import { DoctorsService } from '../../doctors/doctors.service';
import { SearchDoctorsToolInputDto } from './dto/search-doctors-tool-input.dto';
import { validateToolInput } from './utils/validate-tool-input';

const SUPPORTED_SPECIALTIES = new Set([
  'CARDIOLOGY',
  'NEUROLOGY',
  'DERMATOLOGY',
  'ORTHOPEDICS',
]);

@Injectable()
export class SearchDoctorsTool {
  constructor(
    private readonly doctorsService: DoctorsService,
  ) {}

  async execute(input: unknown) {
    const dto = await validateToolInput(
      SearchDoctorsToolInputDto,
      input,
    );

    if (!SUPPORTED_SPECIALTIES.has(dto.specialty)) {
      throw new BadRequestException(
        `Unsupported specialty: ${dto.specialty}`,
      );
    }

    const doctors = await this.doctorsService.search({
      specialty: dto.specialty,
      city: dto.city,
      hospital: dto.hospital,
      gender: dto.gender,
      language: dto.language,
    });

    return {
      success: true,
      count: doctors.length,
      doctors,
    };
  }
}