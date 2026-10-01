-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('EMERGENCY', 'ICU', 'RADIOLOGY', 'LABORATORY', 'PHARMACY');

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "Gender",
    "languages" TEXT[],
    "yearsOfExperience" INTEGER,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hospital" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialty" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorSpecialty" (
    "doctorId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DoctorSpecialty_pkey" PRIMARY KEY ("doctorId","specialtyId")
);

-- CreateTable
CREATE TABLE "DoctorHospital" (
    "doctorId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "department" TEXT,

    CONSTRAINT "DoctorHospital_pkey" PRIMARY KEY ("doctorId","hospitalId")
);

-- CreateTable
CREATE TABLE "HospitalSpecialty" (
    "hospitalId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,

    CONSTRAINT "HospitalSpecialty_pkey" PRIMARY KEY ("hospitalId","specialtyId")
);

-- CreateTable
CREATE TABLE "HospitalService" (
    "hospitalId" TEXT NOT NULL,
    "service" "ServiceType" NOT NULL,

    CONSTRAINT "HospitalService_pkey" PRIMARY KEY ("hospitalId","service")
);

-- CreateIndex
CREATE INDEX "Doctor_name_idx" ON "Doctor"("name");

-- CreateIndex
CREATE INDEX "Hospital_city_idx" ON "Hospital"("city");

-- CreateIndex
CREATE INDEX "Hospital_name_idx" ON "Hospital"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_code_key" ON "Specialty"("code");

-- CreateIndex
CREATE INDEX "Specialty_name_idx" ON "Specialty"("name");

-- CreateIndex
CREATE INDEX "DoctorSpecialty_specialtyId_idx" ON "DoctorSpecialty"("specialtyId");

-- CreateIndex
CREATE INDEX "DoctorHospital_hospitalId_idx" ON "DoctorHospital"("hospitalId");

-- CreateIndex
CREATE INDEX "HospitalSpecialty_specialtyId_idx" ON "HospitalSpecialty"("specialtyId");

-- CreateIndex
CREATE INDEX "HospitalService_service_idx" ON "HospitalService"("service");

-- AddForeignKey
ALTER TABLE "DoctorSpecialty" ADD CONSTRAINT "DoctorSpecialty_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorSpecialty" ADD CONSTRAINT "DoctorSpecialty_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorHospital" ADD CONSTRAINT "DoctorHospital_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorHospital" ADD CONSTRAINT "DoctorHospital_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalSpecialty" ADD CONSTRAINT "HospitalSpecialty_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalSpecialty" ADD CONSTRAINT "HospitalSpecialty_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalService" ADD CONSTRAINT "HospitalService_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;
