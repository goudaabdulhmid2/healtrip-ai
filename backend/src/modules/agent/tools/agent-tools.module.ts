import { Module } from '@nestjs/common';

import { DoctorsModule } from '../../doctors/doctors.module';
import { HospitalsModule } from '../../hospitals/hospitals.module';
import { SpecialtiesModule } from '../../specialties/specialties.module';

import { SearchDoctorsTool } from './search-doctors.tool';
import { SearchHospitalsTool } from './search-hospitals.tool';

@Module({
  imports: [
    DoctorsModule,
    HospitalsModule,
    SpecialtiesModule,
  ],
  providers: [
    SearchDoctorsTool,
    SearchHospitalsTool,
  ],
  exports: [
    SearchDoctorsTool,
    SearchHospitalsTool,
  ],
})
export class AgentToolsModule {}