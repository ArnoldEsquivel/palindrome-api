import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/products/search (GET) - should return search results', () => {
    return request(app.getHttpServer())
      .get('/api/products/search?q=test')
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeDefined();
        expect(res.body.items).toBeDefined();
        expect(Array.isArray(res.body.items)).toBeTruthy();
        expect(res.body.query).toBe('test');
        expect(typeof res.body.isPalindrome).toBe('boolean');
      });
  });
});
