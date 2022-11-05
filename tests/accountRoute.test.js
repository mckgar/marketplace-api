const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const findAccountByUsername = jest.fn();
const findAccountByEmail = jest.fn();
const createAccount = jest.fn();

const app = require('../app')({
  findAccountByUsername,
  findAccountByEmail,
  createAccount
});

describe('POST /account', () => {
  describe('Given valid registration data', () => {
    const data = [
      { username: 'tester1', password: 'poorPassword1$', email: 'test@example.com' },
      { username: 'tester2', password: 'poorPassword2$', email: 'signal@wow.edu' },
      { username: 'tester3', password: 'poorPassword3$', email: 'another@one.net' }
    ];

    beforeEach(() => {
      createAccount.mockReset();
    });

    test('Hashes password before saving to database', async () => {
      for (const body of data) {
        createAccount.mockReset();
        await request(app)
          .post('/account')
          .send(body);
        expect(await bcrypt.compare(body.password, createAccount.mock.calls[0][1]))
          .toBeTruthy();
      }
    })

    test('Saves new account to database', async () => {
      for (const body of data) {
        createAccount.mockReset();
        await request(app)
          .post('/account')
          .send(body);
        expect(createAccount.mock.calls.length).toBe(1);
        expect(createAccount.mock.calls[0][0]).toBe(body.username);
        expect(await bcrypt.compare(body.password, createAccount.mock.calls[0][1]))
          .toBeTruthy();
        expect(createAccount.mock.calls[0][2]).toBe(body.email);
      }
    });

    test('Responds with 201 status code', async () => {
      const response = await request(app)
        .post('/account')
        .send(data[0]);
      expect(response.statusCode).toBe(201);
    });

    test('Responds with json in content-type header', async () => {
      const response = await request(app)
        .post('/account')
        .send(data[0]);
      expect(response.headers['content-type'])
        .toEqual(expect.stringContaining('json'));
    });

    test('Responds with JWT in json object', async () => {
      const response = await request(app)
        .post('/account')
        .send(data[0]);
      expect(response.body.token).toBeDefined();
    });

    test('JWT is valid', async () => {
      let i = 0;
      for (const body of data) {
        createAccount.mockResolvedValue(i);
        const response = await request(app)
          .post('/account')
          .send(body);
        const valid = await jwt.verify(response.body.token, process.env.JWT_SECRET);
        expect(valid.account_id).toBe(i);
        i++;
      }
    });
  });

  describe('Given invalid registration data', () => {
    // Isolate invalid case types to properly test each
    // Define valid pieces for easier modification in event of validity change
    const validUsername = 'badtester1';
    const validPassword = 'Password1$';
    const validEmail = 'bad@tester.com';
    // Username must be less than 20 characters
    // Username must be unique
    const badUsernames = [
      { password: validPassword, email: validEmail },
      { username: null, password: validPassword, email: validEmail },
      { username: '', password: validPassword, email: validEmail },
      { username: 'taken', password: validPassword, email: validEmail },
      { username: 'waytoolongofausernamelmaowhatevenisthisname', password: validPassword, email: validEmail },
    ];
    // Password must be at least 8 characters
    // Password must have at least one uppercase letter
    // Password must have at least one lowercase letter
    // Password must have at least one number
    // Password must have at least one symbol
    const badPasswords = [
      { username: validUsername, email: validEmail },
      { username: validUsername, password: null, email: validEmail },
      { username: validUsername, password: '', email: validEmail },
      { username: validUsername, password: 'short1$', email: validEmail },
      { username: validUsername, password: 'nonumbershere', email: validEmail },
      { username: validUsername, password: '0123456789', email: validEmail },
      { username: validUsername, password: '!@#$%^&*', email: validEmail },
      { username: validUsername, password: '0123!@#$%^&*', email: validEmail },
      { username: validUsername, password: 'asdf!@#$%^&*', email: validEmail },
      { username: validUsername, password: 'asdf01234', email: validEmail },
    ];
    const badEmails = [
      { username: validUsername, password: validPassword },
      { username: validUsername, password: validPassword, email: null },
      { username: validUsername, password: validPassword, email: '' },
      { username: validUsername, password: validPassword, email: 'noatsym' },
      { username: validUsername, password: validPassword, email: 'taken@inuse.com' },
      { username: validUsername, password: validPassword, email: '@q' },
      { username: validUsername, password: validPassword, email: 'q@' },
      { username: validUsername, password: validPassword, email: '@' },
    ];
    describe('Given invalid username', () => {
      test('Responds with 400 status code', async () => {
        for (const body of badUsernames) {
          if (body.username === 'taken') {
            findAccountByUsername.mockResolvedValueOnce(true);
          }
          const response = await request(app)
            .post('/account')
            .send(body);
          expect(response.statusCode).toBe(400);
        }
      });

      test('Responds with json in content-type header', async () => {
        for (const body of badUsernames) {
          if (body.username === 'taken') {
            findAccountByUsername.mockResolvedValueOnce(true);
          }
          const response = await request(app)
            .post('/account')
            .send(body);
          expect(response.headers['content-type'])
            .toEqual(expect.stringContaining('json'));
        }
      });

      test('Responds with error message in json object', async () => {
        for (const body of badUsernames) {
          if (body.username === 'taken') {
            findAccountByUsername.mockResolvedValueOnce(true);
          }
          const response = await request(app)
            .post('/account')
            .send(body);
          expect(response.body.errors).toBeDefined();
        }
      });

      test('Error message is only for username', async () => {
        for (const body of badUsernames) {
          if (body.username === 'taken') {
            findAccountByUsername.mockResolvedValueOnce(true);
          }
          const response = await request(app)
            .post('/account')
            .send(body);
          expect(response.body.errors.length).toBe(1);
          expect(response.body.errors[0].param).toBe('username');
        }
      });
    });

    describe('Given invalid password', () => {
      test('Responds with 400 status code', async () => {
        for (const body of badPasswords) {
          const response = await request(app)
            .post('/account')
            .send(body);
          expect(response.statusCode).toBe(400);
        }
      });

      test('Responds with json in content-type header', async () => {
        for (const body of badPasswords) {
          const response = await request(app)
            .post('/account')
            .send(body);
          expect(response.headers['content-type'])
            .toEqual(expect.stringContaining('json'));
        }
      });

      test('Responds with error message in json object', async () => {
        for (const body of badPasswords) {
          const response = await request(app)
            .post('/account')
            .send(body);
          expect(response.body.errors).toBeDefined();
        }
      });

      test('Error message is only for password', async () => {
        for (const body of badPasswords) {
          const response = await request(app)
            .post('/account')
            .send(body);
          expect(response.body.errors.length).toBe(1);
          expect(response.body.errors[0].param).toBe('password');
        }
      });
    });

    describe('Given invalid email', () => {
      test('Responds with 400 status code', async () => {
        for (const body of badEmails) {
          if (body.email === 'taken@inuse.com') {
            findAccountByEmail.mockResolvedValueOnce(true);
          }
          const response = await request(app)
            .post('/account')
            .send(body);
          expect(response.statusCode).toBe(400);
        }
      });

      test('Responds with json in content-type header', async () => {
        for (const body of badEmails) {
          if (body.email === 'taken@inuse.com') {
            findAccountByEmail.mockResolvedValueOnce(true);
          }
          const response = await request(app)
            .post('/account')
            .send(body);
          expect(response.headers['content-type'])
            .toEqual(expect.stringContaining('json'));
        }
      });

      test('Responds with error message in json object', async () => {
        for (const body of badEmails) {
          if (body.email === 'taken@inuse.com') {
            findAccountByEmail.mockResolvedValueOnce(true);
          }
          const response = await request(app)
            .post('/account')
            .send(body);
          expect(response.body.errors).toBeDefined();
        }
      });

      test('Error message is only for email', async () => {
        for (const body of badEmails) {
          if (body.email === 'taken@inuse.com') {
            findAccountByEmail.mockResolvedValueOnce(true);
          }
          const response = await request(app)
            .post('/account')
            .send(body);
          expect(response.body.errors.length).toBe(1);
          expect(response.body.errors[0].param).toBe('email');
        }
      });
    });
  });
});
