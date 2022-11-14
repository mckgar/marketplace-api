const request = require('supertest');

const findAccountById = jest.fn();
const saveItem = jest.fn();
const findCategoryByName = jest.fn();
const findItemById = jest.fn();
const updateItemName = jest.fn();
const updateItemDescription = jest.fn();
const updateItemPrice = jest.fn();
const updateItemQuantity = jest.fn();
const updateItemCategory = jest.fn();
const deleteItem = jest.fn();

const app = require('../app')({
  findAccountById,
  saveItem,
  findCategoryByName,
  findItemById,
  updateItemName,
  updateItemDescription,
  updateItemPrice,
  updateItemQuantity,
  updateItemCategory,
  deleteItem
});

const mockedId = '86d48fc4-9231-446e-8073-a6e5c0702f85';
const mockedId3 = '86d48fc4-9231-446e-8073-a6e5c0702f86';
const mockedId2 = '86d48fc4-9231-446e-8073-a6e5c0702f87';

const cred = require('../issueToken')(1);

const validName = 'item';
const validDescription = 'This is fine';
const validPrice = 19.99;
const validQuantity = 23;
const validCategory = 'Books';

let longString = 'tooLong';
while (longString.length < 1024) longString += longString;

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
    });
  });
});

describe('GET /item/:itemId', () => {
  describe('itemId is valid', () => {

    const data = [
      { name: 'name1', description: 'this is item1', seller: { username: 'name1', rating: 3 }, price: 1.5, quantity: 1, category: 'catid1', date_added: new Date() },
      { name: 'name3', description: 'blah blah', seller: { username: 'anotherme', rating: 1 }, price: 8.35, quantity: 62, category: 'catid2', date_added: new Date() },
      { name: 'name2', description: 'ipsum stuff', seller: { username: 'whoami', rating: 4 }, price: 7.4, quantity: 32, category: 'catid3', date_added: new Date() },
    ];

    beforeEach(() => {
      findItemById.mockReset();
    });

    test('Responds with 200 status code', async () => {
      findItemById.mockReset();
      findItemById.mockResolvedValue(data[0]);
      const response = await request(app)
        .get(`/item/${mockedId}`);
      expect(response.statusCode).toBe(200);
    });

    test('Searches database for item', async () => {
      const ids = [mockedId, mockedId2, mockedId3];
      for (const id of ids) {
        findItemById.mockReset();
        findItemById.mockResolvedValue(data[0]);
        await request(app)
          .get(`/item/${id}`);
        expect(findItemById.mock.calls.length).toBe(1);
        expect(findItemById.mock.calls[0][0]).toBe(id)
      }
    });

    test('Responds with json in content-type header', async () => {
      findItemById.mockReset();
      findItemById.mockResolvedValue(data[0]);
      const response = await request(app)
        .get(`/item/${mockedId}`);
      expect(response.headers['content-type'])
        .toEqual(expect.stringContaining('json'));
    });

    test('Responds with item in json object', async () => {
      findItemById.mockReset();
      findItemById.mockResolvedValue(data[0]);
      const response = await request(app)
        .get(`/item/${mockedId}`);
      expect(response.body.item).toBeDefined();
    });

    test('Item has all needed information', async () => {
      findItemById.mockReset();
      findItemById.mockResolvedValue(data[0]);
      const response = await request(app)
        .get(`/item/${mockedId}`);
      expect(response.body.item.name).toBeDefined();
      expect(response.body.item.description).toBeDefined();
      expect(response.body.item.seller).toBeDefined();
      expect(response.body.item.seller.username).toBeDefined();
      expect(response.body.item.seller.rating).toBeDefined();
      expect(response.body.item.price).toBeDefined();
      expect(response.body.item.quantity).toBeDefined();
      expect(response.body.item.category).toBeDefined();
      expect(response.body.item.date_added).toBeDefined();
    });

    test('Item information is correct', async () => {
      for (const item of data) {
        findItemById.mockReset();
        findItemById.mockResolvedValue(item);
        const response = await request(app)
          .get(`/item/${mockedId}`);
        expect(response.body.item.name).toBe(item.name);
        expect(response.body.item.description).toBe(item.description);
        expect(response.body.item.seller.username).toBe(item.seller.username);
        expect(response.body.item.seller.rating).toBe(item.seller.rating);
        expect(response.body.item.price).toBe(item.price);
        expect(response.body.item.quantity).toBe(item.quantity);
        expect(response.body.item.category).toBe(item.category);
        expect(new Date(response.body.item.date_added).toString()).toBe(item.date_added.toString());
      }
    });
  });

  describe('itemId is invalid', () => {
    test('Responds with 404 status code', async () => {
      for (const id of [351, 'mockedId', '5-5-5-5', mockedId]) {
        findItemById.mockReset();
        findItemById.mockResolvedValue(null);
        const response = await request(app)
          .get(`/item/${id}`);
        expect(response.statusCode).toBe(404);
      }
    });
  });
});

describe('PUT /item/:itemId', () => {
  describe('Given valid item', () => {
    describe('Given valid credentials', () => {

      beforeAll(() => {
        findAccountById.mockResolvedValue({
          account_id: 1,
          username: 'seller'
        });
        findItemById.mockResolvedValue({ seller: 1 })
      });

      describe('Updating name', () => {
        describe('Given valid info', () => {
          const data = [
            { name: validName },
            { name: 'another name' },
            { name: 'snake oil' }
          ];

          test('Responds with 200 status code', async () => {
            const response = await request(app)
              .put(`/item/${mockedId}`)
              .send(data[0])
              .set('Authorization', `Bearer ${cred}`);
            expect(response.statusCode).toBe(200);
          });

          test('Update is made on correct item', async () => {
            for (const id of [mockedId, mockedId2, mockedId3]) {
              updateItemName.mockReset();
              await request(app)
                .put(`/item/${id}`)
                .send(data[0])
                .set('Authorization', `Bearer ${cred}`);
              expect(updateItemName.mock.calls.length).toBe(1);
              expect(updateItemName.mock.calls[0][0]).toBe(id);
            }
          });

          test('Name is updated', async () => {
            for (const body of data) {
              updateItemName.mockReset();
              await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(updateItemName.mock.calls[0][1]).toBe(body.name);
            }
          });
        });

        describe('Given invalid info', () => {
          const data = [
            { name: null },
            { name: '' },
            { name: longString }
          ];

          test('Responds with 400 status code', async () => {
            for (const body of data) {
              const response = await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.statusCode).toBe(400);
            }
          });

          test('Responds with json in content-type header', async () => {
            for (const body of data) {
              const response = await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.headers['content-type'])
                .toEqual(expect.stringContaining('json'));
            }
          });

          test('Responds with errors in json object', async () => {
            for (const body of data) {
              const response = await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.body.errors).toBeDefined();
            }
          });

          test('Error message is only for name', async () => {
            for (const body of data) {
              const response = await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.body.errors.length).toBe(1);
              expect(response.body.errors[0].param).toBe('name');
            }
          });
        });
      });

      describe('Updating description', () => {
        describe('Given valid info', () => {
          const data = [
            { description: validDescription },
            { description: 'another description' },
            { description: 'cures everything forever' }
          ];

          test('Responds with 200 status code', async () => {
            const response = await request(app)
              .put(`/item/${mockedId}`)
              .send(data[0])
              .set('Authorization', `Bearer ${cred}`);
            expect(response.statusCode).toBe(200);
          });

          test('Update is made on correct item', async () => {
            for (const id of [mockedId, mockedId2, mockedId3]) {
              updateItemDescription.mockReset();
              await request(app)
                .put(`/item/${id}`)
                .send(data[0])
                .set('Authorization', `Bearer ${cred}`);
              expect(updateItemDescription.mock.calls.length).toBe(1);
              expect(updateItemDescription.mock.calls[0][0]).toBe(id);
            }
          });

          test('Description is updated', async () => {
            for (const body of data) {
              updateItemDescription.mockReset();
              await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(updateItemDescription.mock.calls[0][1]).toBe(body.description);
            }
          });
        });

        describe('Given invalid info', () => {
          const data = [
            { description: null },
            { description: '' },
            { description: longString }
          ];

          test('Responds with 400 status code', async () => {
            for (const body of data) {
              const response = await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.statusCode).toBe(400);
            }
          });

          test('Responds with json in content-type header', async () => {
            for (const body of data) {
              const response = await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.headers['content-type'])
                .toEqual(expect.stringContaining('json'));
            }
          });

          test('Responds with errors in json object', async () => {
            for (const body of data) {
              const response = await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.body.errors).toBeDefined();
            }
          });

          test('Error message is only for description', async () => {
            for (const body of data) {
              const response = await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.body.errors.length).toBe(1);
              expect(response.body.errors[0].param).toBe('description');
            }
          });
        });
      });

      describe('Updating price', () => {
        describe('Given valid info', () => {
          const data = [
            { price: validPrice },
            { price: 6 },
            { price: 23.23 },
            { price: 0 }
          ];

          test('Responds with 200 status code', async () => {
            const response = await request(app)
              .put(`/item/${mockedId}`)
              .send(data[0])
              .set('Authorization', `Bearer ${cred}`);
            expect(response.statusCode).toBe(200);
          });

          test('Update is made on correct item', async () => {
            for (const id of [mockedId, mockedId2, mockedId3]) {
              updateItemPrice.mockReset();
              await request(app)
                .put(`/item/${id}`)
                .send(data[0])
                .set('Authorization', `Bearer ${cred}`);
              expect(updateItemPrice.mock.calls.length).toBe(1);
              expect(updateItemPrice.mock.calls[0][0]).toBe(id);
            }
          });

          test('Price is updated', async () => {
            for (const body of data) {
              updateItemPrice.mockReset();
              await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(updateItemPrice.mock.calls[0][1]).toBe(body.price);
            }
          });
        });

        describe('Given invalid info', () => {
          const data = [
            { price: null },
            { price: '' },
            { price: 'free' },
            { price: -1 },
            { price: '$1' }
          ];

          test('Responds with 400 status code', async () => {
            for (const body of data) {
              const response = await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.statusCode).toBe(400);
            }
          });

          test('Responds with json in content-type header', async () => {
            for (const body of data) {
              const response = await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.headers['content-type'])
                .toEqual(expect.stringContaining('json'));
            }
          });

          test('Responds with errors in json object', async () => {
            for (const body of data) {
              const response = await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.body.errors).toBeDefined();
            }
          });

          test('Error message is only for price', async () => {
            for (const body of data) {
              const response = await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.body.errors.length).toBe(1);
              expect(response.body.errors[0].param).toBe('price');
            }
          });
        });
      });

      describe('Updating quantity', () => {
        describe('Given valid info', () => {
          const data = [
            { quantity: validQuantity },
            { quantity: 6000 },
            { quantity: 23 },
            { quantity: 1 }
          ];

          test('Responds with 200 status code', async () => {
            const response = await request(app)
              .put(`/item/${mockedId}`)
              .send(data[0])
              .set('Authorization', `Bearer ${cred}`);
            expect(response.statusCode).toBe(200);
          });

          test('Update is made on correct item', async () => {
            for (const id of [mockedId, mockedId2, mockedId3]) {
              updateItemQuantity.mockReset();
              await request(app)
                .put(`/item/${id}`)
                .send(data[0])
                .set('Authorization', `Bearer ${cred}`);
              expect(updateItemQuantity.mock.calls.length).toBe(1);
              expect(updateItemQuantity.mock.calls[0][0]).toBe(id);
            }
          });

          test('Quantity is updated', async () => {
            for (const body of data) {
              updateItemQuantity.mockReset();
              await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(updateItemQuantity.mock.calls[0][1]).toBe(body.quantity);
            }
          });
        });

        describe('Given invalid info', () => {
          const data = [
            { quantity: null },
            { quantity: '' },
            { quantity: 'none' },
            { quantity: -1 },
            { quantity: 0 },
            { quantity: '5 items' },
            { quantity: 5.5 },
          ];

          test('Responds with 400 status code', async () => {
            for (const body of data) {
              const response = await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.statusCode).toBe(400);
            }
          });

          test('Responds with json in content-type header', async () => {
            for (const body of data) {
              const response = await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.headers['content-type'])
                .toEqual(expect.stringContaining('json'));
            }
          });

          test('Responds with errors in json object', async () => {
            for (const body of data) {
              const response = await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.body.errors).toBeDefined();
            }
          });

          test('Error message is only for quantity', async () => {
            for (const body of data) {
              const response = await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.body.errors.length).toBe(1);
              expect(response.body.errors[0].param).toBe('quantity');
            }
          });
        });
      });

      describe('Updating category', () => {
        describe('Given valid info', () => {
          const data = [
            { category: validCategory },
            { category: 'Another valid' },
            { category: 'clothing' }
          ];

          beforeEach(() => {
            findCategoryByName.mockReset();
            findCategoryByName.mockResolvedValue(mockedId2);
          });

          test('Responds with 200 status code', async () => {
            const response = await request(app)
              .put(`/item/${mockedId}`)
              .send(data[0])
              .set('Authorization', `Bearer ${cred}`);
            expect(response.statusCode).toBe(200);
          });

          test('Category id is retrieved from database', async () => {
            for (const body of data) {
              findCategoryByName.mockReset();
              await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(findCategoryByName.mock.calls.length).toBe(1);
              expect(findCategoryByName.mock.calls[0][0]).toBe(body.category);
            }
          });

          test('Update is made on correct item', async () => {
            for (const id of [mockedId, mockedId2, mockedId3]) {
              updateItemCategory.mockReset();
              await request(app)
                .put(`/item/${id}`)
                .send(data[0])
                .set('Authorization', `Bearer ${cred}`);
              expect(updateItemCategory.mock.calls.length).toBe(1);
              expect(updateItemCategory.mock.calls[0][0]).toBe(id);
            }
          });

          test('Category is updated', async () => {
            let i = 0;
            for (const body of data) {
              updateItemCategory.mockReset();
              findCategoryByName.mockReset();
              findCategoryByName.mockResolvedValue(i);
              await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(updateItemCategory.mock.calls[0][1]).toBe(i);
              i++;
            }
          });
        });

        describe('Given invalid info', () => {
          const data = [
            { category: null },
            { category: '' },
            { category: 'does not exist' },
            { category: longString }
          ];

          beforeEach(() => {
            findCategoryByName.mockReset();
            findCategoryByName.mockResolvedValue(null);
          })

          test('Responds with 400 status code', async () => {
            for (const body of data) {
              const response = await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.statusCode).toBe(400);
            }
          });

          test('Responds with json in content-type header', async () => {
            for (const body of data) {
              const response = await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.headers['content-type'])
                .toEqual(expect.stringContaining('json'));
            }
          });

          test('Responds with errors in json object', async () => {
            for (const body of data) {
              const response = await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.body.errors).toBeDefined();
            }
          });

          test('Error message is only for category', async () => {
            for (const body of data) {
              const response = await request(app)
                .put(`/item/${mockedId}`)
                .send(body)
                .set('Authorization', `Bearer ${cred}`);
              expect(response.body.errors.length).toBe(1);
              expect(response.body.errors[0].param).toBe('category');
            }
          });
        });
      });
    })

    describe('Given invalid crendentials', () => {

      beforeAll(() => {
        findAccountById.mockResolvedValue({
          account_id: 1,
          username: 'seller'
        });
        findItemById.mockResolvedValue({ seller: 2 });
      });

      test('Responds with 403 status code', async () => {
        const response = await request(app)
          .put(`/item/${mockedId}`)
          .send({ name: 'newName' })
          .set('Authorization', `Bearer ${cred}`);
        expect(response.status).toBe(403);
      });
    });

    describe('Given no credentials', () => {
      test('Responds with 401 status code', async () => {
        findAccountById.mockResolvedValue(null);
        const response = await request(app)
          .put(`/item/${mockedId}`)
          .send({ name: 'newName' });
        expect(response.status).toBe(401);
      });
    })
  });

  describe('Given invalid item', () => {

    const data = [351, 'mockedId', '5-5-5-5', mockedId];

    describe('Given credentials', () => {

      beforeAll(() => {
        findAccountById.mockResolvedValue({
          account_id: 1,
          username: 'seller'
        });
      });

      // Can't have permission to edit something that doesn't exist
      test('Responds with 403 status code', async () => {
        findItemById.mockResolvedValue(null);
        for (const id of data) {
          const response = await request(app)
            .put(`/item/${id}`)
            .send({ name: 'newName' })
            .set('Authorization', `Bearer ${cred}`);
          expect(response.status).toBe(403);
        }
      });
    });

    describe('Given no credentials', () => {

      beforeAll(() => {
        findAccountById.mockResolvedValue(null);
      });

      test('Responds with 401 status code', async () => {
        for (const id of data) {
          const response = await request(app)
            .put(`/item/${id}`)
            .send({ name: 'newName' });
          expect(response.status).toBe(401);
        }
      });
    });
  });
});

describe('DELETE /item/:itemid', () => {
  describe('Given valid item', () => {
    describe('Given valid credentials', () => {

      beforeAll(() => {
        findAccountById.mockResolvedValue({
          account_id: 1
        });
        findItemById.mockResolvedValue({ seller: 1 });
      });

      test('Responds with 200 status code', async () => {
        const response = await request(app)
          .delete(`/item/${mockedId}`)
          .set('Authorization', `Bearer ${cred}`);
        expect(response.statusCode).toBe(200);
      });

      test('Item is deleted from database', async () => {
        for (const id of [mockedId, mockedId2, mockedId3]) {
          deleteItem.mockReset();
          await request(app)
            .delete(`/item/${id}`)
            .set('Authorization', `Bearer ${cred}`);
          expect(deleteItem.mock.calls.length).toBe(1);
          expect(deleteItem.mock.calls[0][0]).toBe(id);
        }
      });
    });

    describe('Given invalid credentials', () => {

      beforeAll(() => {
        findAccountById.mockResolvedValue({
          account_id: 1
        });
        findItemById.mockResolvedValue({ seller: 2 });
      });

      test('Responds with 403 status code', async () => {
        const response = await request(app)
          .delete(`/item/${mockedId}`)
          .set('Authorization', `Bearer ${cred}`);
        expect(response.statusCode).toBe(403);
      });
    });

    describe('Given no credentials', () => {

      beforeAll(() => {
        findAccountById.mockResolvedValue(null);
        findItemById.mockResolvedValue({ seller: 2 });
      });

      test('Responds with 401 status code', async () => {
        const response = await request(app)
          .delete(`/item/${mockedId}`);
        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('Given invalid item', () => {
    describe('Given credentials', () => {

      beforeAll(() => {
        findAccountById.mockResolvedValue({
          account_id: 1
        });
        findItemById.mockResolvedValue(null);
      });

      test('Responds with 403 status code', async () => {
        for (const id of [mockedId, 'wrong', '123']) {
          const response = await request(app)
            .delete(`/item/${id}`)
            .set('Authorization', `Bearer ${cred}`);
          expect(response.statusCode).toBe(403);
        }
      });
    });

    describe('Given no credentials', () => {

      beforeAll(() => {
        findAccountById.mockResolvedValue(null);
        findItemById.mockResolvedValue(null);
      });

      test('Responds with 401 status code', async () => {
        for (const id of [mockedId, 'wrong', '123']) {
          const response = await request(app)
            .delete(`/item/${id}`);
          expect(response.statusCode).toBe(401);
        }
      });
    });
  });
});
