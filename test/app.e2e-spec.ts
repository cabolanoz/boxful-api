import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertHealthResponse(body: unknown): asserts body is HealthResponse {
  expect(isRecord(body)).toBe(true);

  if (!isRecord(body)) {
    throw new Error('Health response body must be an object');
  }

  expect(body.status).toBe('ok');
  expect(body.service).toBe('boxful-api');
  expect(typeof body.timestamp).toBe('string');

  if (typeof body.timestamp !== 'string') {
    throw new Error('Health response timestamp must be a string');
  }
}

describe('Health endpoint (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/health (GET)', () => {
    const server = app.getHttpServer() as App;

    return request(server)
      .get('/api/health')
      .expect(200)
      .expect((response: Response) => {
        const body = response.body as unknown;

        assertHealthResponse(body);

        expect(Date.parse(body.timestamp)).not.toBeNaN();
      });
  });
});
