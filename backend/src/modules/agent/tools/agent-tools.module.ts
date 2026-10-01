import { Module } from '@nestjs/common';
import { DoctorsModule } from '../../doctors/doctors.module';
import { SearchDoctorsTool } from './search-doctors.tool';

@Module({
  imports: [DoctorsModule],
  providers: [SearchDoctorsTool],
  exports: [SearchDoctorsTool],
})
export class AgentToolsModule {}