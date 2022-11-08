const request = require('supertest');

const findAccountById = jest.fn();
const saveItem = jest.fn();
const findCategoryByName = jest.fn();

const app = require('../app')({
  findAccountById,
  saveItem,
  findCategoryByName
});

const cred = require('../issueToken')(1);

describe('POST /item', () => {
  describe('Given valid credentials', () => {
    describe('Given valid info', () => {
      const data = [
        { name: 'item1', description: 'This is for sale', price: 19.99, quantity: 8, category: 'Clothing' },
        { name: 'item2', description: 'This is overpirced', price: 199.99, quantity: 23, category: 'Books' },
        { name: 'item3', description: 'This is fun', price: 6.99, quantity: 89, category: 'Toys' },
      ];

      test('Responds with 201 status code', async () => {
        findAccountById.mockResolvedValue({
          account_id: 1,
          username: 'seller'
        });
        findCategoryByName.mockResolvedValue(1);
        for (const body of data) {
          const response = await request(app)
            .post('/item')
            .send(body)
            .set('Authorization', `Bearer ${cred}`);
          expect(response.statusCode).toBe(201);
        }
      });

      test('Saves item in database', async () => {
        let i = 0;
        for (const body of data) {
          findAccountById.mockReset();
          findAccountById.mockResolvedValue({
            account_id: i,
            username: 'seller'
          });
          findCategoryByName.mockReset();
          findCategoryByName.mockResolvedValue(i);
          saveItem.mockReset();
          await request(app)
            .post('/item')
            .send(body)
            .set('Authorization', `Bearer ${cred}`);
          expect(saveItem.mock.calls.length).toBe(1);
          expect(saveItem.mock.calls[0][0]).toBe(i);
          expect(saveItem.mock.calls[0][1]).toBe(body.name);
          expect(saveItem.mock.calls[0][2]).toBe(body.description);
          expect(saveItem.mock.calls[0][3]).toBe(body.price);
          expect(saveItem.mock.calls[0][4]).toBe(body.quantity);
          expect(findCategoryByName.mock.calls.length).toBe(1);
          expect(findCategoryByName.mock.calls[0][0]).toBe(body.category);
          expect(saveItem.mock.calls[0][5]).toBe(i);
          i++;
        }
      });
    });

    describe('Given invalid info', () => {
      const validName = 'item';
      const validDescription = 'This is fine';
      const validPrice = 19.99;
      const validQuantity = 23;
      const validCategory = 'Books';

      let longString = 'tooLong';
      while (longString.length < 1024) longString += longString;

      // Categories will be predefined, must match one of those
      const badCategory = [
        { name: validName, description: validDescription, price: validPrice, quantity: validQuantity },
        { name: validName, description: validDescription, price: validPrice, quantity: validQuantity, category: null },
        { name: validName, description: validDescription, price: validPrice, quantity: validQuantity, category: '' },
        { name: validName, description: validDescription, price: validPrice, quantity: validQuantity, category: 'madeup' },
        { name: validName, description: validDescription, price: validPrice, quantity: validQuantity, category: longString },
      ];
      const badName = [
        { description: validDescription, price: validPrice, quantity: validQuantity, category: validCategory },
        { name: null, description: validDescription, price: validPrice, quantity: validQuantity, category: validCategory },
        { name: '', description: validDescription, price: validPrice, quantity: validQuantity, category: validCategory },
        { name: longString, description: validDescription, price: validPrice, quantity: validQuantity, category: validCategory },
      ];
      const badDescription = [
        { name: validName, price: validPrice, quantity: validQuantity, category: validCategory },
        { name: validName, description: null, price: validPrice, quantity: validQuantity, category: validCategory },
        { name: validName, description: '', price: validPrice, quantity: validQuantity, category: validCategory },
        { name: validName, description: longString, price: validPrice, quantity: validQuantity, category: validCategory },
      ];
      // Blank/null values will not be corrected to zero/free to ensure explicit price setting
      // Price will be assumed to be in US Dollars
      // Including $ will be invalid, numerical value only
      // >= 0
      const badPrice = [
        { name: validName, description: validDescription, quantity: validQuantity, category: validCategory },
        { name: validName, description: validDescription, price: null, quantity: validQuantity, category: validCategory },
        { name: validName, description: validDescription, price: '', quantity: validQuantity, category: validCategory },
        { name: validName, description: validDescription, price: 'five', quantity: validQuantity, category: validCategory },
        { name: validName, description: validDescription, price: -8, quantity: validQuantity, category: validCategory },
        { name: validName, description: validDescription, price: '$1', quantity: validQuantity, category: validCategory },
      ];
      // Positive integers only
      // Blank/null will not be corrected to zero
      const badQuantity = [
        { name: validName, description: validDescription, price: validPrice, category: validCategory },
        { name: validName, description: validDescription, price: validPrice, quantity: null, category: validCategory },
        { name: validName, description: validDescription, price: validPrice, quantity: '', category: validCategory },
        { name: validName, description: validDescription, price: validPrice, quantity: 'five', category: validCategory },
        { name: validName, description: validDescription, price: validPrice, quantity: 5.5, category: validCategory },
        { name: validName, description: validDescription, price: validPrice, quantity: -5, category: validCategory },
        { name: validName, description: validDescription, price: validPrice, quantity: 0, category: validCategory },
        { name: validName, description: validDescription, price: validPrice, quantity: '6 items', category: validCategory },
      ];

      describe('Given invalid category', () => {
        const data = badCategory;

        beforeEach(() => {
          findAccountById.mockResolvedValue({
            account_id: 1,
            username: 'seller'
          });
          findCategoryByName.mockReset();
          findCategoryByName.mockResolvedValue(null);
        });

        test('Responds with 400 status code', async () => {
          for (const body of data) {
            const response = await request(app)
              .post('/item')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.statusCode).toBe(400);
          }
        });

        test('Responds with json in content-type header', async () => {
          for (const body of data) {
            const response = await request(app)
              .post('/item')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.headers['content-type'])
              .toEqual(expect.stringContaining('json'));
          }
        });

        test('Responds with errors in json object', async () => {
          for (const body of data) {
            const response = await request(app)
              .post('/item')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.body.errors).toBeDefined();
          }
        });

        test('Error message is only for category', async () => {
          for (const body of data) {
            const response = await request(app)
              .post('/item')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.body.errors.length).toBe(1);
            expect(response.body.errors[0].param).toBe('category');
          }
        });
      });

      describe('Given invalid name', () => {
        const data = badName;

        beforeEach(() => {
          findAccountById.mockResolvedValue({
            account_id: 1,
            username: 'seller'
          });
          findCategoryByName.mockResolvedValue(1);
        });

        test('Responds with 400 status code', async () => {
          for (const body of data) {
            const response = await request(app)
              .post('/item')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.statusCode).toBe(400);
          }
        });

        test('Responds with json in content-type header', async () => {
          for (const body of data) {
            const response = await request(app)
              .post('/item')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.headers['content-type'])
              .toEqual(expect.stringContaining('json'));
          }
        });

        test('Responds with errors in json object', async () => {
          for (const body of data) {
            const response = await request(app)
              .post('/item')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.body.errors).toBeDefined();
          }
        });

        test('Error message is only for name', async () => {
          for (const body of data) {
            const response = await request(app)
              .post('/item')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.body.errors.length).toBe(1);
            expect(response.body.errors[0].param).toBe('name');
          }
        });
      });

      describe('Given invalid description', () => {
        const data = badDescription;

        beforeEach(() => {
          findAccountById.mockResolvedValue({
            account_id: 1,
            username: 'seller'
          });
          findCategoryByName.mockResolvedValue(1);
        });

        test('Responds with 400 status code', async () => {
          for (const body of data) {
            const response = await request(app)
              .post('/item')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.statusCode).toBe(400);
          }
        });

        test('Responds with json in content-type header', async () => {
          for (const body of data) {
            const response = await request(app)
              .post('/item')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.headers['content-type'])
              .toEqual(expect.stringContaining('json'));
          }
        });

        test('Responds with errors in json object', async () => {
          for (const body of data) {
            const response = await request(app)
              .post('/item')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.body.errors).toBeDefined();
          }
        });

        test('Error message is only for description', async () => {
          for (const body of data) {
            const response = await request(app)
              .post('/item')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.body.errors.length).toBe(1);
            expect(response.body.errors[0].param).toBe('description');
          }
        });
      });

      describe('Given invalid price', () => {
        const data = badPrice;

        beforeEach(() => {
          findAccountById.mockResolvedValue({
            account_id: 1,
            username: 'seller'
          });
          findCategoryByName.mockResolvedValue(1);
        });

        test('Responds with 400 status code', async () => {
          for (const body of data) {
            const response = await request(app)
              .post('/item')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.statusCode).toBe(400);
          }
        });

        test('Responds with json in content-type header', async () => {
          for (const body of data) {
            const response = await request(app)
              .post('/item')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.headers['content-type'])
              .toEqual(expect.stringContaining('json'));
          }
        });

        test('Responds with errors in json object', async () => {
          for (const body of data) {
            const response = await request(app)
              .post('/item')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.body.errors).toBeDefined();
          }
        });

        test('Error message is only for price', async () => {
          for (const body of data) {
            const response = await request(app)
              .post('/item')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.body.errors.length).toBe(1);
            expect(response.body.errors[0].param).toBe('price');
          }
        });
      });

      describe('Given invalid quantity', () => {
        const data = badQuantity;

        beforeEach(() => {
          findAccountById.mockResolvedValue({
            account_id: 1,
            username: 'seller'
          });
          findCategoryByName.mockResolvedValue(1);
        });

        test('Responds with 400 status code', async () => {
          for (const body of data) {
            const response = await request(app)
              .post('/item')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.statusCode).toBe(400);
          }
        });

        test('Responds with json in content-type header', async () => {
          for (const body of data) {
            const response = await request(app)
              .post('/item')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.headers['content-type'])
              .toEqual(expect.stringContaining('json'));
          }
        });

        test('Responds with errors in json object', async () => {
          for (const body of data) {
            const response = await request(app)
              .post('/item')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.body.errors).toBeDefined();
          }
        });

        test('Error message is only for quantity', async () => {
          for (const body of data) {
            const response = await request(app)
              .post('/item')
              .send(body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.body.errors.length).toBe(1);
            expect(response.body.errors[0].param).toBe('quantity');
          }
        });
      });
    });
  });

  describe('Given no credentials', () => {
    test('Responds with 401 status code', async () => {
      findAccountById.mockResolvedValue(null);
      const response = await request(app)
        .post('/item')
        .send({ name: 'item1', description: 'This is for sale', price: 19.99, quantity: 8, category: 'Clothing' });
      expect(response.statusCode).toBe(401);
    })
  })
})