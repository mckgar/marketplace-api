const request = require('supertest');

const findItemById = jest.fn();
const submitOrder = jest.fn();

const app = require('../app')({
  findItemById,
  submitOrder
});

const mockedId = '86d48fc4-9231-446e-8073-a6e5c0702f85';
const mockedId3 = '86d48fc4-9231-446e-8073-a6e5c0702f86';
const mockedId2 = '86d48fc4-9231-446e-8073-a6e5c0702f87';

const validEmail = 'test@example.com';

describe('POST /orders', () => {
  // Want to be able to order without logging in
  // Supply cart and email in body to create order, no auth required
  describe('Given valid email', () => {
    describe('Given valid cart', () => {
      const data = [
        [mockedId],
        [mockedId2, mockedId3],
        [mockedId, mockedId2, mockedId3],
      ];
      findItemById.mockReset();
      findItemById.mockResolvedValue({ name: 'item' });

      test('Responds with 201 status code', async () => {
        for (const cart of data) {
          const response = await request(app)
            .post('/orders')
            .send({ email: validEmail, cart: cart });
          expect(response.statusCode).toBe(201);
        }
      });

      test('Order is created', async () => {
        for (const cart of data) {
          submitOrder.mockReset();
          await request(app)
            .post('/orders')
            .send({ email: validEmail, cart: cart });
          expect(submitOrder.mock.calls.length).toBe(1);
          expect(submitOrder.mock.calls[0][0]).toEqual(validEmail);
          expect(submitOrder.mock.calls[0][1]).toEqual(cart);
        }
      });
    });

    describe('Given invalid cart', () => {
      const data = [
        null,
        'a',
        1,
        [],
        ['a'],
        [12],
        [mockedId]
      ];

      test('Responds with 400 status code', async () => {
        for (const cart of data) {
          findItemById.mockReset();
          findItemById.mockResolvedValue(null);
          const response = await request(app)
            .post('/orders')
            .send({ email: validEmail, cart: cart });
          expect(response.statusCode).toBe(400);
        }
      });

      test('Responds with json in content-type header', async () => {
        for (const cart of data) {
          findItemById.mockReset();
          findItemById.mockResolvedValue(null);
          const response = await request(app)
            .post('/orders')
            .send({ email: validEmail, cart: cart });
          expect(response.headers['content-type'])
            .toEqual(expect.stringContaining('json'));
        }
      });

      test('Responds with errors in json object', async () => {
        for (const cart of data) {
          findItemById.mockReset();
          findItemById.mockResolvedValue(null);
          const response = await request(app)
            .post('/orders')
            .send({ email: validEmail, cart: cart });
          expect(response.body.errors).toBeDefined();
        }
      });
    });
  });

  describe('Given invalid email', () => {
    const data = [
      null,
      '',
      'a',
      '@',
      8
    ];

    beforeEach(() => {
      findItemById.mockReset();
      findItemById.mockResolvedValue(true);
    });

    test('Responds with 400 status code', async () => {
      for (const email of data) {
        const response = await request(app)
          .post('/orders')
          .send({ email: email, cart: [mockedId] });
        expect(response.statusCode).toBe(400);
      }
    });

    test('Responds with json in content-type header', async () => {
      for (const email of data) {
        const response = await request(app)
          .post('/orders')
          .send({ email: email, cart: [mockedId] });
        expect(response.headers['content-type'])
          .toEqual(expect.stringContaining('json'));
      }
    });

    test('Responds with errors in json object', async () => {
      for (const email of data) {
        const response = await request(app)
          .post('/orders')
          .send({ email: email, cart: [mockedId] });
        expect(response.body.errors).toBeDefined();
      }
    });
  });
});
