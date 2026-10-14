import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DatabaseService } from './../src/database/database.service.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const createUser = vi.fn();

  beforeEach(async () => {
    createUser.mockReset();
    createUser.mockResolvedValue({
      id: 1,
      username: 'jane',
      name: 'Jane Doe',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseService)
      .useValue({ createUser })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/auth/register (POST) creates a user without returning the password', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: 'jane', name: 'Jane Doe', password: 'password123' })
      .expect(201);

    expect(response.body).toEqual({
      id: 1,
      username: 'jane',
      name: 'Jane Doe',
    });
    expect(createUser).toHaveBeenCalledWith({
      username: 'jane',
      name: 'Jane Doe',
      password: expect.stringMatching(/^scrypt\$/),
    });
  });

  it('/auth/register (POST) validates the password', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: 'jane', name: 'Jane Doe', password: 'short' })
      .expect(400);
  });

  it('/auth/register (POST) rejects duplicate usernames', () => {
    createUser.mockResolvedValueOnce(undefined);

    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: 'jane', name: 'Jane Doe', password: 'password123' })
      .expect(409);
  });

  afterEach(async () => {
    await app.close();
  });
});
