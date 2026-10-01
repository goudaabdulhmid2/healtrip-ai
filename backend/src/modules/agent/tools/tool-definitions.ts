export const TOOL_DEFINITIONS = [
  {
    name: 'search_doctors',
    description:
      'Search for doctors when the user needs a doctor recommendation based on specialty and city. Use only when enough information is available.',
    input_schema: {
      type: 'object',
      properties: {
        specialty: {
          type: 'string',
          description:
            'Canonical specialty code such as CARDIOLOGY, NEUROLOGY, DERMATOLOGY, or ORTHOPEDICS.',
        },
        city: {
          type: 'string',
          description: 'City where the doctor should be located.',
        },
        hospital: {
          type: 'string',
          description: 'Optional hospital name.',
        },
        gender: {
          type: 'string',
          enum: ['MALE', 'FEMALE'],
          description: 'Optional preferred doctor gender.',
        },
        language: {
          type: 'string',
          enum: ['AR', 'EN'],
          description: 'Optional preferred language.',
        },
      },
      required: ['specialty', 'city'],
      additionalProperties: false,
    },
  },

  {
    name: 'search_hospitals',
    description:
      'Search for hospitals in a city, optionally filtered by specialty and hospital services.',
    input_schema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'City where the hospital should be located.',
        },
        specialty: {
          type: 'string',
          description:
            'Optional canonical specialty code.',
        },
        services: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'EMERGENCY',
              'ICU',
              'RADIOLOGY',
              'LABORATORY',
              'PHARMACY',
            ],
          },
          description:
            'Optional hospital services to filter by.',
        },
      },
      required: ['city'],
      additionalProperties: false,
    },
  },
] as const;