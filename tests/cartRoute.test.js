const request = require('supertest');

const findAccountById = jest.fn();
const findCartByUser = jest.fn();
const addItemToCart = jest.fn();
const removeItemFromCart = jest.fn();
const findItemById = jest.fn();

const app = require('../app')({
  findAccountById,
  findCartByUser,
  addItemToCart,
  removeItemFromCart,
  findItemById
});

const cred = require('../issueToken')(1);

const mockedId = '86d48fc4-9231-446e-8073-a6e5c0702f85';
const mockedId3 = '86d48fc4-9231-446e-8073-a6e5c0702f86';
const mockedId2 = '86d48fc4-9231-446e-8073-a6e5c0702f87';

describe('GET /cart', () => {
  describe('Given valid credentials', () => {
    beforeEach(() => {
      findAccountById.mockReset();
      findAccountById.mockResolvedValue({ account_id: 1 });
      findCartByUser.mockReset();
    });

    test('Responds with 200 status code', async () => {
      const response = await request(app)
        .get('/cart')
        .set('Authorization', `Bearer ${cred}`);
      expect(response.statusCode).toBe(200);
    });

    test('Searches database for cart', async () => {
      findCartByUser.mockResolvedValue([]);
      await request(app)
        .get('/cart')
        .set('Authorization', `Bearer ${cred}`);
      expect(findCartByUser.mock.calls.length).toBe(1);
      expect(findCartByUser.mock.calls[0][0]).toBe(1);
    });

    test('Responds with json in content-type header', async () => {
      const response = await request(app)
        .get('/cart')
        .set('Authorization', `Bearer ${cred}`);
      expect(response.headers['content-type'])
        .toEqual(expect.stringContaining('json'));
    });

    test('Responds with cart in json object', async () => {
      const response = await request(app)
        .get('/cart')
        .set('Authorization', `Bearer ${cred}`);
      expect(response.body.cart).toBeDefined();
    });

    test('Cart in an array', async () => {
      const response = await request(app)
        .get('/cart')
        .set('Authorization', `Bearer ${cred}`);
      expect(response.body.cart).toBeInstanceOf(Array);
    });

    test('Cart is database response', async () => {
      const data = [
        [],
        ['h'],
        ['gg', 'ez']
      ];
      for (const r of data) {
        findCartByUser.mockReset();
        findCartByUser.mockResolvedValue(r);
        const response = await request(app)
          .get('/cart')
          .set('Authorization', `Bearer ${cred}`);
        expect(response.body.cart).toEqual(r);
      }
    });
  });

  describe('Given invalid credentials', () => {
    test('Responds with 401 status code', async () => {
      findAccountById.mockReset();
      findAccountById.mockResolvedValue(null);
      const response = await request(app)
        .get('/cart')
        .set('Authorization', `Bearer ${cred}`);
      expect(response.statusCode).toBe(401);
    });
  });

  describe('Given no credentials', () => {
    test('Responds with 401 status code', async () => {
      const response = await request(app)
        .get('/cart');
      expect(response.statusCode).toBe(401);
    });
  });
});

describe('PUT /cart', () => {
  describe('Given valid credentials', () => {
    beforeEach(() => {
      findAccountById.mockReset();
      findAccountById.mockResolvedValue({ account_id: mockedId });
    });
    describe('Given valid method', () => {
      describe('Given valid submission info', () => {
        test('Responds with 200 status code', async () => {
          findItemById.mockReset();
          findItemById.mockResolvedValue(true);
          const data = [
            { item_id: mockedId, quantity: 2 },
            { item_id: mockedId2, quantity: 17 },
            { item_id: mockedId3, quantity: 23 },
          ];
          for (const body of data) {
            for (const method of ['add', 'remove']) {
              const response = await request(app)
                .put(`/cart?m=${method}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.statusCode).toBe(200);
            }
          }
        });
  
        test('Adds item to cart', async () => {
          findItemById.mockReset();
          findItemById.mockResolvedValue(true);
          const data = [
            { item_id: mockedId, quantity: 2 },
            { item_id: mockedId2, quantity: 17 },
            { item_id: mockedId3, quantity: 23 },
          ];
          for (const body of data) {
            addItemToCart.mockReset();
            await request(app)
              .put('/cart?m=add')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(addItemToCart.mock.calls.length).toBe(1);
            expect(addItemToCart.mock.calls[0][0]).toBe(mockedId); // account id
            expect(addItemToCart.mock.calls[0][1]).toBe(body.item_id);
            expect(addItemToCart.mock.calls[0][2]).toBe(body.quantity);
          }
        });
  
        test('Removes item from cart', async () => {
          findItemById.mockReset();
          findItemById.mockResolvedValue(true);
          const data = [
            { item_id: mockedId, quantity: 2 },
            { item_id: mockedId2, quantity: 17 },
            { item_id: mockedId3, quantity: 23 },
          ];
          for (const body of data) {
            removeItemFromCart.mockReset();
            await request(app)
              .put('/cart?m=remove')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(removeItemFromCart.mock.calls.length).toBe(1);
            expect(removeItemFromCart.mock.calls[0][0]).toBe(mockedId); // account id
            expect(removeItemFromCart.mock.calls[0][1]).toBe(body.item_id);
            expect(removeItemFromCart.mock.calls[0][2]).toBe(body.quantity);
          }
        });
      });
  
      describe('Given invalid submission info', () => {
        const data = [
          {},
          { quantity: 1 },
          { item_id: null, quantity: 1 },
          { item_id: '', quantity: 1 },
          { item_id: '1', quantity: 1 },
          { item_id: mockedId },
          { item_id: mockedId, quantity: null },
          { item_id: mockedId, quantity: '' },
          { item_id: mockedId, quantity: 'a' },
          { item_id: mockedId, quantity: 'twelve' },
          { item_id: mockedId, quantity: '12a' },
          { item_id: mockedId, quantity: 12, itemNotFound: true },
        ];
  
        test('Responds with 400 status code', async () => {
          for (const body of data) {
            findItemById.mockReset();
            findItemById.mockResolvedValue(body.itemNotFound ? null : true);
            const response = await request(app)
              .put('/cart?m=add')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.statusCode).toBe(400);
          }
        });
  
        test('Responds with json in content-type header', async () => {
          for (const body of data) {
            findItemById.mockReset();
            findItemById.mockResolvedValue(body.itemNotFound ? null : true);
            const response = await request(app)
              .put('/cart?m=add')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.headers['content-type'])
              .toEqual(expect.stringContaining('json'));
          }
        });
  
        test('Responds with errors in json object', async () => {
          for (const body of data) {
            findItemById.mockReset();
            findItemById.mockResolvedValue(body.itemNotFound ? null : true);
            const response = await request(app)
              .put('/cart?m=add')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.body.errors).toBeDefined();
          }
        });
      });
    });

    describe('Given invalid method', () => {
      test('Responds with 400 status code', async () => {
          findItemById.mockReset();
          findItemById.mockResolvedValue(true);
          const data = [
            { item_id: mockedId, quantity: 2 },
            { item_id: mockedId2, quantity: 17 },
            { item_id: mockedId3, quantity: 23 },
          ];
          for (const body of data) {
            for (const method of ['bad', 'rremove']) {
              const response = await request(app)
                .put(`/cart?m=${method}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.statusCode).toBe(400);
            }
          }
        });
    })
  });

  describe('Given invalid credentials', () => {
    test('Responds with 401 status code', async () => {
      findAccountById.mockReset();
      findAccountById.mockResolvedValue(null);
      const response = await request(app)
        .put('/cart')
        .set('Authorization', `Bearer ${cred}`);
      expect(response.statusCode).toBe(401);
    });
  });

  describe('Given no credentials', () => {
    test('Responds with 401 status code', async () => {
      const response = await request(app)
        .put('/cart');
      expect(response.statusCode).toBe(401);
    });
  });
});
