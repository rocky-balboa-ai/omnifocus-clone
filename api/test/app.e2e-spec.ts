import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('OmniFocus API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Auth', () => {
    it('/api/auth/me (GET) - should return unauthenticated', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(200)
        .expect({ authenticated: false });
    });
  });

  describe('Perspectives', () => {
    it('/api/perspectives (GET) - should require auth', () => {
      return request(app.getHttpServer())
        .get('/api/perspectives')
        .expect(403);
    });
  });
});
