import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ChatRequestDto } from '../src/modules/chat/dto/create-chat.dto';
import { ToolResultPart } from 'ai'; // Importar si es necesario para tipar

describe('ChatController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/chat/generate (POST) - simple text response', () => {
    const chatRequest: ChatRequestDto = {
      messages: [{ role: 'user', content: 'Hello, world!' }],
    };

    return request(app.getHttpServer())
      .post('/api/chat/generate')
      .send(chatRequest)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('sessionId');
        expect(res.body).toHaveProperty('text');
        expect(typeof res.body.text).toBe('string');
        // Add more assertions if needed, e.g., for finishReason
      });
  }, 15000); // Increased timeout to 15 seconds

  it('/api/chat/generate (POST) - with tool call for flight info', async () => {
    const chatRequest: ChatRequestDto = {
      messages: [
        {
          role: 'user',
          content:
            'Can you find the next flight from Seattle to Miami and tell me the details in your response?',
        },
      ],
    };

    const response = await request(app.getHttpServer())
      .post('/api/chat/generate')
      .send(chatRequest)
      .expect(200);

    // console.log('DEBUG - Flight Info Test Response Body:', JSON.stringify(response.body, null, 2));

    expect(response.body).toHaveProperty('sessionId');
    expect(response.body).toHaveProperty('text');
    expect(typeof response.body.text).toBe('string');
    expect(response.body).toHaveProperty('finishReason');

    // Verificar que la herramienta fue llamada y devolvió el resultado esperado
    // `generateText` con herramientas que tienen `execute` debería manejar el ciclo completo.
    // El resultado final debería tener `toolResults` si una herramienta fue ejecutada.
    expect(response.body).toHaveProperty('toolResults');
    expect(Array.isArray(response.body.toolResults)).toBe(true);

    // Si el modelo decidió usar la herramienta y esta se ejecutó.
    if (response.body.toolResults && response.body.toolResults.length > 0) {
      const toolResults = response.body.toolResults as ToolResultPart[];
      const flightToolResult = toolResults.find(
        (tr) => tr.toolName === 'getFlightInfo',
      );

      expect(flightToolResult).toBeDefined();
      if (flightToolResult) {
        expect(flightToolResult).toHaveProperty('toolCallId');
        expect(typeof flightToolResult.toolCallId).toBe('string');
        expect(flightToolResult).toHaveProperty('result');
        // La herramienta getFlightInfo para "Seattle" a "Miami" debe devolver detalles del vuelo.
        // El `result` es el objeto devuelto por la función `execute` de la herramienta.
        expect(flightToolResult.result).toHaveProperty('airline', 'Delta');
        expect(flightToolResult.result).toHaveProperty(
          'flight_number',
          'DL123',
        );
        expect(flightToolResult.result).toHaveProperty('flight_date'); // Verificar existencia
        expect(flightToolResult.result).toHaveProperty('flight_time'); // Verificar existencia
      }
    } else {
      console.warn(
        '[Flight Info Test] Warning: toolResults was empty or undefined. The LLM might not have called the tool, or an issue occurred.',
      );
    }

    expect(response.body.text).toMatch(/flight|airline|Delta|DL123/i);
  }, 15000); // Increased timeout to 15 seconds

  it('/api/chat/generate (POST) - with specific session ID', () => {
    const chatRequest: ChatRequestDto = {
      messages: [{ role: 'user', content: 'Hello again!' }],
    };
    const customSessionId = 'test-session-123';

    return request(app.getHttpServer())
      .post('/api/chat/generate')
      .set('x-session-id', customSessionId)
      .send(chatRequest)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('sessionId', customSessionId);
        expect(res.body).toHaveProperty('text');
      });
  });

  it('/api/chat/generate (POST) - with system prompt', () => {
    const chatRequest: ChatRequestDto = {
      messages: [{ role: 'user', content: 'Tell me a joke.' }],
      systemPrompt: 'You are a helpful assistant that tells funny jokes.',
    };

    return request(app.getHttpServer())
      .post('/api/chat/generate')
      .send(chatRequest)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('sessionId');
        expect(res.body).toHaveProperty('text');
        // Further checks could involve analyzing if the joke is appropriate
        // or if the persona was adopted, though this is harder to assert automatically.
      });
  });

  it('/api/chat/generate (POST) - invalid request body (e.g., missing messages)', () => {
    const invalidRequest = {}; // Missing 'messages' property

    return request(app.getHttpServer())
      .post('/api/chat/generate')
      .send(invalidRequest)
      .expect(400); // Expecting Bad Request due to validation pipe
  });

  it('/api/chat/generate (POST) - invalid message structure', () => {
    const chatRequest = {
      messages: [{ role: 'invalid-role', content: 'Test' }], // Invalid role
    };

    return request(app.getHttpServer())
      .post('/api/chat/generate')
      .send(chatRequest)
      .expect(400); // Expecting Bad Request
  });
});
