import { Module } from '@nestjs/common';
import { HospitalsService } from './hospitals.service';

@Module({
  providers: [HospitalsService],
  exports: [HospitalsService],
})
export class HospitalsModule {}