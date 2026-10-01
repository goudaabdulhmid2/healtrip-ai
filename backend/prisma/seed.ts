import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  Gender,
  PrismaClient,
  ServiceType,
} from "../src/generated/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seed...");

  // -----------------------------------------------------
  // 1. Specialties
  // -----------------------------------------------------

  const cardiology = await prisma.specialty.upsert({
    where: { code: "CARDIOLOGY" },
    update: {},
    create: {
      code: "CARDIOLOGY",
      name: "Cardiology",
    },
  });

  const neurology = await prisma.specialty.upsert({
    where: { code: "NEUROLOGY" },
    update: {},
    create: {
      code: "NEUROLOGY",
      name: "Neurology",
    },
  });

  const dermatology = await prisma.specialty.upsert({
    where: { code: "DERMATOLOGY" },
    update: {},
    create: {
      code: "DERMATOLOGY",
      name: "Dermatology",
    },
  });

  const orthopedics = await prisma.specialty.upsert({
    where: { code: "ORTHOPEDICS" },
    update: {},
    create: {
      code: "ORTHOPEDICS",
      name: "Orthopedics",
    },
  });

  // -----------------------------------------------------
  // 2. Hospitals
  // -----------------------------------------------------

  const kingFahad = await prisma.hospital.create({
    data: {
      name: "King Fahad Hospital",
      city: "Madinah",
      summary:
        "A general hospital offering emergency and specialized medical services.",

      services: {
        create: [
          { service: ServiceType.EMERGENCY },
          { service: ServiceType.ICU },
          { service: ServiceType.RADIOLOGY },
          { service: ServiceType.LABORATORY },
          { service: ServiceType.PHARMACY },
        ],
      },

      specialties: {
        create: [
          { specialtyId: cardiology.id },
          { specialtyId: neurology.id },
          { specialtyId: orthopedics.id },
        ],
      },
    },
  });

  const alAnsar = await prisma.hospital.create({
    data: {
      name: "Al Ansar Hospital",
      city: "Madinah",
      summary:
        "A hospital providing outpatient and specialized medical services.",

      services: {
        create: [
          { service: ServiceType.EMERGENCY },
          { service: ServiceType.RADIOLOGY },
          { service: ServiceType.PHARMACY },
        ],
      },

      specialties: {
        create: [
          { specialtyId: cardiology.id },
          { specialtyId: dermatology.id },
        ],
      },
    },
  });

  const uhud = await prisma.hospital.create({
    data: {
      name: "Uhud Hospital",
      city: "Madinah",
      summary:
        "A general hospital with emergency and diagnostic capabilities.",

      services: {
        create: [
          { service: ServiceType.EMERGENCY },
          { service: ServiceType.LABORATORY },
          { service: ServiceType.PHARMACY },
        ],
      },

      specialties: {
        create: [
          { specialtyId: neurology.id },
          { specialtyId: dermatology.id },
        ],
      },
    },
  });

  const riyadhCare = await prisma.hospital.create({
    data: {
      name: "Riyadh Care Hospital",
      city: "Riyadh",
      summary:
        "A specialized hospital included to test city-based provider searches.",

      services: {
        create: [
          { service: ServiceType.EMERGENCY },
          { service: ServiceType.ICU },
          { service: ServiceType.RADIOLOGY },
        ],
      },

      specialties: {
        create: [
          { specialtyId: cardiology.id },
          { specialtyId: orthopedics.id },
        ],
      },
    },
  });

  // -----------------------------------------------------
  // 3. Doctors
  // -----------------------------------------------------

  const ahmed = await prisma.doctor.create({
    data: {
      name: "Dr. Ahmed Hassan",
      gender: Gender.MALE,
      languages: ["AR", "EN"],
      yearsOfExperience: 15,
      summary:
        "Consultant cardiologist with extensive experience in cardiovascular care.",

      specialties: {
        create: [
          {
            specialtyId: cardiology.id,
            isPrimary: true,
          },
        ],
      },

      hospitals: {
        create: [
          {
            hospitalId: kingFahad.id,
            department: "Cardiology",
          },
          {
            hospitalId: alAnsar.id,
            department: "Cardiology",
          },
        ],
      },
    },
  });

  const sara = await prisma.doctor.create({
    data: {
      name: "Dr. Sara Mohamed",
      gender: Gender.FEMALE,
      languages: ["AR", "EN"],
      yearsOfExperience: 10,
      summary:
        "Cardiologist focused on outpatient cardiovascular assessment and follow-up.",

      specialties: {
        create: [
          {
            specialtyId: cardiology.id,
            isPrimary: true,
          },
        ],
      },

      hospitals: {
        create: [
          {
            hospitalId: kingFahad.id,
            department: "Cardiology",
          },
        ],
      },
    },
  });

  const omar = await prisma.doctor.create({
    data: {
      name: "Dr. Omar Khaled",
      gender: Gender.MALE,
      languages: ["AR"],
      yearsOfExperience: 12,
      summary:
        "Neurologist providing diagnosis and management of common neurological conditions.",

      specialties: {
        create: [
          {
            specialtyId: neurology.id,
            isPrimary: true,
          },
        ],
      },

      hospitals: {
        create: [
          {
            hospitalId: kingFahad.id,
            department: "Neurology",
          },
          {
            hospitalId: uhud.id,
            department: "Neurology",
          },
        ],
      },
    },
  });

  const layla = await prisma.doctor.create({
    data: {
      name: "Dr. Layla Ahmed",
      gender: Gender.FEMALE,
      languages: ["AR", "EN"],
      yearsOfExperience: 8,
      summary:
        "Dermatologist providing general dermatological consultations.",

      specialties: {
        create: [
          {
            specialtyId: dermatology.id,
            isPrimary: true,
          },
        ],
      },

      hospitals: {
        create: [
          {
            hospitalId: alAnsar.id,
            department: "Dermatology",
          },
          {
            hospitalId: uhud.id,
            department: "Dermatology",
          },
        ],
      },
    },
  });

  const yusuf = await prisma.doctor.create({
    data: {
      name: "Dr. Yusuf Ali",
      gender: Gender.MALE,
      languages: ["AR", "EN"],
      yearsOfExperience: 18,
      summary:
        "Orthopedic consultant with experience in musculoskeletal conditions.",

      specialties: {
        create: [
          {
            specialtyId: orthopedics.id,
            isPrimary: true,
          },
        ],
      },

      hospitals: {
        create: [
          {
            hospitalId: kingFahad.id,
            department: "Orthopedics",
          },
          {
            hospitalId: riyadhCare.id,
            department: "Orthopedics",
          },
        ],
      },
    },
  });

  // -----------------------------------------------------
  // 4. Multi-specialty doctor
  // -----------------------------------------------------

  await prisma.doctor.create({
    data: {
      name: "Dr. Noor Ibrahim",
      gender: Gender.FEMALE,
      languages: ["AR", "EN"],
      yearsOfExperience: 7,
      summary:
        "Physician with experience across cardiovascular and general internal medicine.",

      specialties: {
        create: [
          {
            specialtyId: cardiology.id,
            isPrimary: true,
          },
          {
            specialtyId: neurology.id,
            isPrimary: false,
          },
        ],
      },

      hospitals: {
        create: [
          {
            hospitalId: alAnsar.id,
            department: "Specialized Clinics",
          },
        ],
      },
    },
  });

  console.log("✅ Seed completed successfully.");
  console.log({
    hospitals: 4,
    doctors: 6,
    specialties: 4,
  });
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });