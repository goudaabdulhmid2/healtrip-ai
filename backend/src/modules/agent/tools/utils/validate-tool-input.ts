import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

type ClassConstructor<T extends object> = new (...args: any[]) => T;

export async function validateToolInput<T extends object>(
  dtoClass: ClassConstructor<T>,
  input: unknown,
): Promise<T> {
  const dto = plainToInstance(dtoClass, input);

  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    throw new BadRequestException({
      message: 'Invalid tool arguments',
      errors: errors.map((error) => ({
        field: error.property,
        constraints: error.constraints,
      })),
    });
  }

  return dto;
}