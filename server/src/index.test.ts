import request from 'supertest';
import app from './index';

describe('GET /', () => {
  it('should respond with a message', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Express + TypeScript Server');
  });
});