/* eslint-disable @typescript-eslint/require-await */
import { z } from 'zod';
import { Logger } from '@nestjs/common';

const flightToolParamsSchema = z.object({
  originCity: z.string().describe('The city of origin for the flight'),
  destinationCity: z.string().describe('The destination city for the flight'),
});

async function executeGetFlightInfo(
  params: z.infer<typeof flightToolParamsSchema>,
): Promise<object> {
  Logger.log(
    `Ejecutando herramienta getFlightInfo: ${params.originCity} a ${params.destinationCity} ✈️`,
    'FlightToolLogic',
  );

  if (
    params.originCity.toLowerCase() === 'seattle' &&
    params.destinationCity.toLowerCase() === 'miami'
  ) {
    return {
      airline: 'Delta',
      flight_number: 'DL123',
      flight_date: 'May 8th, 2025',
      flight_time: '10:00AM',
    };
  }
  return {
    error: 'No flights found between the specified cities for the given date.',
  };
}

export const flightTool = {
  name: 'getFlightInfo',
  description:
    'Devuelve información sobre el próximo vuelo disponible entre dos ciudades. Incluye aerolínea, número de vuelo, fecha y hora. ✈️🗓️⏰',
  parametersSchema: flightToolParamsSchema,
  execute: executeGetFlightInfo,
};
