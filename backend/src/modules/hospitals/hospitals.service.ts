import { Injectable } from '@nestjs/common';
import { Prisma, ServiceType } from '../../generated/client';
import { PrismaService } from '../../database/prisma.service';

export interface SearchHospitalsParams {
  city: string;
  specialty?: string;
  services?: ServiceType[];
}

@Injectable()
export class HospitalsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(params: SearchHospitalsParams) {
    const { city, specialty, services } = params;

    const where: Prisma.HospitalWhereInput = {
      city: {
        equals: city,
        mode: 'insensitive',
      },

      ...(specialty
        ? {
            specialties: {
              some: {
                specialty: {
                  code: specialty,
                },
              },
            },
          }
        : {}),

      ...(services?.length
        ? {
            AND: services.map((service) => ({
              services: {
                some: {
                  service,
                },
              },
            })),
          }
        : {}),
    };

    return this.prisma.hospital.findMany({
      where,
      include: {
        specialties: {
          include: {
            specialty: true,
          },
        },
        services: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}