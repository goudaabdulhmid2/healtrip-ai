import { Injectable } from '@nestjs/common';
import { Gender, Prisma } from '../../generated/client';
import { PrismaService } from '../../database/prisma.service';

export interface SearchDoctorsParams {
  specialty: string;
  city: string;
  hospital?: string;
  gender?: Gender;
  language?: string;
}

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(params: SearchDoctorsParams) {
    const { specialty, city, hospital, gender, language } = params;

    const hospitalWhere: Prisma.HospitalWhereInput = {
      city: {
        equals: city,
        mode: 'insensitive',
      },
      ...(hospital
        ? {
            name: {
              contains: hospital,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const where: Prisma.DoctorWhereInput = {
      gender,
      languages: language
        ? {
            has: language,
          }
        : undefined,

      specialties: {
        some: {
          specialty: {
            code: specialty,
          },
        },
      },

      hospitals: {
        some: {
          hospital: hospitalWhere,
        },
      },
    };

    return this.prisma.doctor.findMany({
      where,
      include: {
        specialties: {
          include: {
            specialty: true,
          },
        },
        hospitals: {
          where: {
            hospital: hospitalWhere,
          },
          include: {
            hospital: true,
          },
        },
      },
      orderBy: {
        yearsOfExperience: 'desc',
      },
    });
  }
}
