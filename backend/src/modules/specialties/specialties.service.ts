import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SpecialtiesService {
  constructor(private readonly prisma: PrismaService) {}

  async existsByCode(code: string): Promise<boolean> {
    const specialty = await this.prisma.specialty.findUnique({
      where: {
        code,
      },
      select: {
        id: true,
      },
    });

    return specialty !== null;
  }
}