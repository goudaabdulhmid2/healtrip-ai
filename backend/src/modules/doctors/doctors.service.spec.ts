import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { DoctorsService } from './doctors.service';

describe('DoctorsService', () => {
  let service: DoctorsService;
  const findMany = jest.fn();

  beforeEach(async () => {
    findMany.mockReset().mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorsService,
        { provide: PrismaService, useValue: { doctor: { findMany } } },
      ],
    }).compile();
    service = module.get<DoctorsService>(DoctorsService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('uses case-insensitive city matching and returns only matching hospital links', async () => {
    await service.search({ specialty: 'CARDIOLOGY', city: 'madinah' });
    const query = findMany.mock.calls[0][0];
    expect(query.where.hospitals.some.hospital.city).toEqual({
      equals: 'madinah',
      mode: 'insensitive',
    });
    expect(query.include.hospitals.where.hospital.city).toEqual({
      equals: 'madinah',
      mode: 'insensitive',
    });
  });

  it('combines gender, language and hospital preferences with the required filters', async () => {
    await service.search({
      specialty: 'CARDIOLOGY',
      city: 'Madinah',
      hospital: 'Ansar',
      gender: 'FEMALE',
      language: 'AR',
    });
    const query = findMany.mock.calls[0][0];
    expect(query.where.gender).toBe('FEMALE');
    expect(query.where.languages).toEqual({ has: 'AR' });
    expect(query.where.hospitals.some.hospital.name).toEqual({
      contains: 'Ansar',
      mode: 'insensitive',
    });
  });
});
