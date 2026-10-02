import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { HospitalsService } from './hospitals.service';

describe('HospitalsService', () => {
  let service: HospitalsService;
  const findMany = jest.fn();

  beforeEach(async () => {
    findMany.mockReset().mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HospitalsService,
        { provide: PrismaService, useValue: { hospital: { findMany } } },
      ],
    }).compile();
    service = module.get<HospitalsService>(HospitalsService);
  });

  it('requires every requested service and applies specialty and city filters', async () => {
    await service.search({
      city: 'Madinah',
      specialty: 'CARDIOLOGY',
      services: ['EMERGENCY', 'ICU'],
    });
    const query = findMany.mock.calls[0][0];
    expect(query.where.city.mode).toBe('insensitive');
    expect(query.where.specialties.some.specialty.code).toBe('CARDIOLOGY');
    expect(query.where.AND).toEqual([
      { services: { some: { service: 'EMERGENCY' } } },
      { services: { some: { service: 'ICU' } } },
    ]);
  });
});
