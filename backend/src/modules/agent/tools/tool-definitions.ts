import { LLMToolDefinition } from '../interfaces/llm-provider.interface';

export const TOOL_DEFINITIONS: LLMToolDefinition[] = [
  {
    type: 'function',

    function: {
      name: 'search_doctors',

      description:
        'Search for doctors when the user needs to find a doctor. ' +
        'The specialty and city are required. ' +
        'Use this tool only when enough information is available.',

      parameters: {
        type: 'object',

        properties: {
          specialty: {
            type: 'string',
            description:
              'Canonical specialty code. ' +
              'Examples: CARDIOLOGY, NEUROLOGY, DERMATOLOGY, ORTHOPEDICS.',
          },

          city: {
            type: 'string',
            description:
              'City where the doctor should be located.',
          },

          hospital: {
            type: 'string',
            description:
              'Optional hospital name.',
          },

          gender: {
            type: 'string',
            enum: ['MALE', 'FEMALE'],
            description:
              'Optional preferred doctor gender.',
          },

          language: {
            type: 'string',
            enum: ['AR', 'EN'],
            description:
              'Optional preferred doctor language.',
          },
        },

        required: ['specialty', 'city'],
        additionalProperties: false,
      },
    },
  },

  {
    type: 'function',

    function: {
      name: 'search_hospitals',

      description:
        'Search for hospitals in a city. ' +
        'The city is required. ' +
        'Specialty and services are optional filters.',

      parameters: {
        type: 'object',

        properties: {
          city: {
            type: 'string',
            description:
              'City where the hospital should be located.',
          },

          specialty: {
            type: 'string',
            description:
              'Optional canonical specialty code. Example: CARDIOLOGY.',
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
  },
];