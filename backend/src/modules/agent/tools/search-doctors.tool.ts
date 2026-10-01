import { BadRequestException, Injectable } from '@nestjs/common';

import { DoctorsService } from '../../doctors/doctors.service';
import { SpecialtiesService } from '../../specialties/specialties.service';

import { SearchDoctorsToolInputDto } from './dto/search-doctors-tool-input.dto';
import { validateToolInput } from './utils/validate-tool-input';

@Injectable()
export class SearchDoctorsTool {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly specialtiesService: SpecialtiesService,
  ) {}

  async execute(input: unknown) {
    const dto = await validateToolInput(
      SearchDoctorsToolInputDto,
      input,
    );

    const specialtyExists =
      await this.specialtiesService.existsByCode(dto.specialty);

    if (!specialtyExists) {
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