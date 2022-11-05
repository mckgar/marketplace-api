const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const findAccountByUsername = jest.fn();
const findAccountByEmail = jest.fn();

const app = require('../app')({
  findAccountByUsername,
  findAccountByEmail
});

describe('POST /login', () => {
  describe('Given valid credentials', () => {
    const usernameCred = [
      { username: 'validuser1', password: 'validPassword1$' },
      { username: 'validuser2', password: 'validPassword1$' },
      { username: 'validuser3', password: 'validPassword1$' }
    ];

    const emailCred = [
      { email: 'valid1@example.com', password: 'validPassword1$' },
      { email: 'valid2@example.com', password: 'validPassword1$' },
      { email: 'valid3@example.com', password: 'validPassword1$' }
    ];

    const data = [...usernameCred, ...emailCred];

    beforeEach(() => {
      findAccountByUsername.mockReset();
      findAccountByEmail.mockReset();
    });

    test('Searches database for valid account by username', async () => {
      for (const body of usernameCred) {
        findAccountByUsername.mockReset();
        await request(app)
          .post('/login')
          .send(body);
        expect(findAccountByUsername.mock.calls.length).toBe(1);
        expect(findAccountByUsername.mock.calls[0][0]).toBe(body.username);
      }
    });

    test('Searches database for valid account by email', async () => {
      for (const body of emailCred) {
        findAccountByEmail.mockReset();
        await request(app)
          .post('/login')
          .send(body);
        expect(findAccountByEmail.mock.calls.length).toBe(1);
        expect(findAccountByEmail.mock.calls[0][0]).toBe(body.email);
      }
    });

    test('Responds with 200 status code', async () => {
      for (const body of data) {
        findAccountByUsername.mockResolvedValue({
          account_id: 0,
          hashedPassword: await bcrypt.hash(body.password, 1)
        });
        findAccountByEmail.mockResolvedValue({
          account_id: 0,
          hashedPassword: await bcrypt.hash(body.password, 1)
        });
        const response = await request(app)
          .post('/login')
          .send(body);
        expect(response.statusCode).toBe(200);
      }
    });

    test('Responds with json in content-type header', async () => {
      for (const body of data) {
        findAccountByUsername.mockResolvedValue({
          account_id: 0,
          hashedPassword: await bcrypt.hash(body.password, 1)
        });
        findAccountByEmail.mockResolvedValue({
          account_id: 0,
          hashedPassword: await bcrypt.hash(body.password, 1)
        });
        const response = await request(app)
          .post('/login')
          .send(body);
        expect(response.headers['content-type'])
          .toEqual(expect.stringContaining('json'));
      }
    });

    test('Responds with JWT in json object', async () => {
      for (const body of data) {
        findAccountByUsername.mockResolvedValue({
          account_id: 0,
          hashedPassword: await bcrypt.hash(body.password, 1)
        });
        findAccountByEmail.mockResolvedValue({
          account_id: 0,
          hashedPassword: await bcrypt.hash(body.password, 1)
        });
        const response = await request(app)
          .post('/login')
          .send(body);
        expect(response.body.token).toBeDefined();
      }
    });

    test('JWT is valid', async () => {
      let i = 0;
      for (const body of data) {
        findAccountByUsername.mockResolvedValue({
          account_id: i,
          hashedPassword: await bcrypt.hash(body.password, 1)
        });
        findAccountByEmail.mockResolvedValue({
          account_id: i,
          hashedPassword: await bcrypt.hash(body.password, 1)
        });
        const response = await request(app)
          .post('/login')
          .send(body);
        const valid = await jwt.verify(response.body.token, process.env.JWT_SECRET);
        expect(valid.account_id).toBe(i);
        i++;
      }
    });
  });

  describe('Given invalid credentials', () => {
    const invalidUsernames = [
      { password: 'validPassword1$' },
      { username: null, password: 'validPassword1$' },
      { username: '', password: 'validPassword1$' },
      { username: 'doesnotexist', password: 'validPassword1$' }
    ];

    const invalidEmails = [
      { password: 'validPassword1$' },
      { email: null, password: 'validPassword1$' },
      { email: '', password: 'validPassword1$' },
      { email: 'notinuse@invalid.net', password: 'validPassword1$' },
    ];

    const invalidPasswords = [
      { username: 'validUsername' },
      { username: 'validUsername', password: null },
      { username: 'validUsername', password: '' },
      { username: 'validUsername', password: 'wrongpassword' },
      { email: 'inuse@inuse.com' },
      { email: 'inuse@inuse.com', password: null },
      { email: 'inuse@inuse.com', password: '' },
      { email: 'inuse@inuse.com', password: 'wrongpassword' },
    ];

    describe('Given invalid username (and no email)', () => {

      beforeEach(() => {
        findAccountByUsername.mockReset();
      });

      test('Responds with 400 status code', async () => {
        findAccountByUsername.mockResolvedValue(null);
        for (const body of invalidUsernames) {
          const response = await request(app)
            .post('/login')
            .send(body);
          expect(response.statusCode).toBe(400);
        }
      });

      test('Responds with json in content-type header', async () => {
        findAccountByUsername.mockResolvedValue(null);
        for (const body of invalidUsernames) {
          const response = await request(app)
            .post('/login')
            .send(body);
          expect(response.headers['content-type'])
            .toEqual(expect.stringContaining('json'));
        }
      });

      test('Responds with errors message in json object', async () => {
        findAccountByUsername.mockResolvedValue(null);
        for (const body of invalidUsernames) {
          const response = await request(app)
            .post('/login')
            .send(body);
          expect(response.body.errors).toBeDefined();
        }
      });
    });

    describe('Given invalid email (and no username)', () => {

      beforeEach(() => {
        findAccountByEmail.mockReset();
      });

      test('Responds with 400 status code', async () => {
        findAccountByEmail.mockResolvedValue(null);
        for (const body of invalidEmails) {
          const response = await request(app)
            .post('/login')
            .send(body);
          expect(response.statusCode).toBe(400);
        }
      });

      test('Responds with json in content-type header', async () => {
        findAccountByEmail.mockResolvedValue(null);
        for (const body of invalidEmails) {
          const response = await request(app)
            .post('/login')
            .send(body);
          expect(response.headers['content-type'])
            .toEqual(expect.stringContaining('json'));
        }
      });

      test('Responds with errors message in json object', async () => {
        findAccountByEmail.mockResolvedValue(null);
        for (const body of invalidEmails) {
          const response = await request(app)
            .post('/login')
            .send(body);
          expect(response.body.errors).toBeDefined();
        }
      });
    });

    describe('Given invalid password', () => {
      
      beforeEach(() => {
        findAccountByUsername.mockReset();
        findAccountByEmail.mockReset();
      });

      test('Responds with 400 status code', async () => {
        const hashedPassword = await bcrypt.hash('correctPassword8$', 1);
        for (const body of invalidPasswords) {
          findAccountByUsername.mockResolvedValue({
            account_id: 0,
            hashedPassword
          });
          const response = await request(app)
            .post('/login')
            .send(body);
          expect(response.statusCode).toBe(400);
        }
      });

      test('Responds with json in content-type header', async () => {
        const hashedPassword = await bcrypt.hash('correctPassword8$', 1);
        for (const body of invalidPasswords) {
          findAccountByUsername.mockResolvedValue({
            account_id: 0,
            hashedPassword
          });
          const response = await request(app)
            .post('/login')
            .send(body);
          expect(response.headers['content-type'])
            .toEqual(expect.stringContaining('json'));
        }
      });

      test('Responds with errors message in json object', async () => {
        const hashedPassword = await bcrypt.hash('correctPassword8$', 1);
        for (const body of invalidPasswords) {
          findAccountByUsername.mockResolvedValue({
            account_id: 0,
            hashedPassword
          });
          const response = await request(app)
            .post('/login')
            .send(body);
          expect(response.body.errors).toBeDefined();
        }
      });
    });
  });
});
