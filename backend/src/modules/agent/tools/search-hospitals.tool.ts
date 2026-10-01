import { BadRequestException, Injectable } from '@nestjs/common';

import { HospitalsService } from '../../hospitals/hospitals.service';
import { SpecialtiesService } from '../../specialties/specialties.service';

import { SearchHospitalsToolInputDto } from './dto/search-hospitals-tool-input.dto';
import { validateToolInput } from './utils/validate-tool-input';
import { AgentTool } from './interfaces/agent-tool.interface';

@Injectable()
export class SearchHospitalsTool implements AgentTool {
  constructor(
    private readonly hospitalsService: HospitalsService,
    private readonly specialtiesService: SpecialtiesService,
  ) {}

  async execute(input: unknown) {
    const dto = await validateToolInput(
      SearchHospitalsToolInputDto,
      input,
    );

    if (dto.specialty) {
      const specialtyExists =
        await this.specialtiesService.existsByCode(
          dto.specialty,
        );

      if (!specialtyExists) {
        throw new BadRequestException(
          `Unsupported specialty: ${dto.specialty}`,
        );
      }
    }

    const hospitals = await this.hospitalsService.search({
      city: dto.city,
      specialty: dto.specialty,
      services: dto.services,
    });

    return {
      success: true,
      count: hospitals.length,
      hospitals,
    };
  }
}