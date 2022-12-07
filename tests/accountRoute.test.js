const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const findAccountByUsername = jest.fn();
const findAccountByEmail = jest.fn();
const createAccount = jest.fn();
const findAccountById = jest.fn();
const updateFirstName = jest.fn();
const updateLastName = jest.fn();
const updateEmail = jest.fn();
const updatePassword = jest.fn();
const findItemsBySeller = jest.fn();
const deleteAccountById = jest.fn();

const app = require('../app')({
  findAccountByUsername,
  findAccountByEmail,
  createAccount,
  findAccountById,
  updateFirstName,
  updateLastName,
  updateEmail,
  updatePassword,
  findItemsBySeller,
  deleteAccountById,
});

const cred = require('../issueToken')(1);

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

describe('PUT /account/:username', () => {
  describe('Given valid credentials', () => {
    describe('Updating first_name', () => {
      describe('Given valid info', () => {
        const data = [
          { account_id: 1, username: 'editor1', body: { first_name: 'name1' } },
          { account_id: 2, username: 'editor2', body: { first_name: 'name2' } },
          { account_id: 3, username: 'editor3', body: { first_name: 'name3' } },
        ];

        test('Responds with 200 status code', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: input.account_id,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            const response = await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.statusCode).toBe(200);
          }
        });

        test('Update is made on correct account', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: input.account_id,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            updateFirstName.mockReset();
            await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(updateFirstName.mock.calls.length).toBe(1);
            expect(updateFirstName.mock.calls[0][0]).toBe(input.account_id);
          }
        });

        test('first_name is updated', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: input.account_id,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            updateFirstName.mockReset();
            await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(updateFirstName.mock.calls.length).toBe(1);
            expect(updateFirstName.mock.calls[0][1]).toBe(input.body.first_name);
          }
        });
      });

      describe('Given invalid info', () => {
        const data = [
          { username: 'editor1', body: { first_name: null } },
          { username: 'editor2', body: { first_name: 'thisnameiswaytoolongImeanjustlookatitwhonamestheirkidsomethinglikethiswaytoometa' } },
          // I want to restrict it to only letters, but there is probably 
          // someone whose legal name has other symbols or numbers
        ];

        test('Responds with 400 status code', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: 1,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            const response = await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.statusCode).toBe(400);
          }
        });

        test('Responds with json in content-type header', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: 1,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            const response = await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.headers['content-type'])
              .toEqual(expect.stringContaining('json'));
          }
        });

        test('Responds with errors in json object', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: 1,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            const response = await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.body.errors).toBeDefined();
          }
        });

        test('Error message is for only for first_name', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: 1,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            const response = await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.body.errors.length).toBe(1);
            expect(response.body.errors[0].param).toBe('first_name');
          }
        });
      });
    });

    describe('Updating last_name', () => {
      describe('Given valid info', () => {
        const data = [
          { account_id: 1, username: 'editor1', body: { last_name: 'lastname1' } },
          { account_id: 2, username: 'editor2', body: { last_name: 'lastname2' } },
          { account_id: 3, username: 'editor3', body: { last_name: 'lastname3' } }
        ];

        test('Responds with 200 status code', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: input.account_id,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            const response = await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.statusCode).toBe(200);
          }
        });

        test('Update is made on correct account', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: input.account_id,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            updateLastName.mockReset();
            await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(updateLastName.mock.calls.length).toBe(1);
            expect(updateLastName.mock.calls[0][0]).toBe(input.account_id);
          }
        });

        test('last_name is updated', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: input.account_id,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            updateLastName.mockReset();
            await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(updateLastName.mock.calls.length).toBe(1);
            expect(updateLastName.mock.calls[0][1]).toBe(input.body.last_name);
          }
        });
      });

      describe('Given invalid info', () => {
        const data = [
          { username: 'editor1', body: { last_name: null } },
          { username: 'editor2', body: { last_name: '' } },
          { username: 'editor3', body: { last_name: 'thisnameiswaytoolongImeanjustlookatitwhonamestheirkidsomethinglikethiswaytoometaandwaytoolongimaginehavingtospellyourfullnameoneveryassignmentinschooljeezthisisrough' } },
          // I want to restrict it to only letters, but there is probably 
          // someone whose legal surname has other symbols (like !@#$) or numbers
        ];

        test('Responds with 400 status code', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: 1,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            const response = await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.statusCode).toBe(400);
          }
        });

        test('Responds with json in content-type header', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: 1,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            const response = await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.headers['content-type'])
              .toEqual(expect.stringContaining('json'));
          }
        });

        test('Responds with errors in json object', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: 1,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            const response = await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.body.errors).toBeDefined();
          }
        });

        test('Error message is for only for last_name', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: 1,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            const response = await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.body.errors.length).toBe(1);
            expect(response.body.errors[0].param).toBe('last_name');
          }
        });
      });
    });

    describe('Updating email', () => {
      describe('Given valid info', () => {
        const data = [
          { account_id: 1, username: 'editor1', body: { email: 'newMail@new.com' } },
          { account_id: 2, username: 'editor2', body: { email: 'newMail2@newer.com' } }
        ];

        test('Responds with 200 status code', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: input.account_id,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            const response = await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.statusCode).toBe(200);
          }
        });

        test('Update is made on correct account', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: input.account_id,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            updateEmail.mockReset();
            await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(updateEmail.mock.calls.length).toBe(1);
            expect(updateEmail.mock.calls[0][0]).toBe(input.account_id);
          }
        });

        test('email is updated', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: input.account_id,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            updateEmail.mockReset();
            await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(updateEmail.mock.calls.length).toBe(1);
            expect(updateEmail.mock.calls[0][1]).toBe(input.body.email);
          }
        });
      });

      describe('Given invalid info', () => {
        const data = [
          { username: 'editor1', body: { email: null } },
          { username: 'editor2', body: { email: '' } },
          { username: 'editor3', body: { email: 'word' } },
          { username: 'editor4', body: { email: '@' } },
          { username: 'editor5', body: { email: 'front@' } },
          { username: 'editor6', body: { email: '@back' } },
        ];

        test('Responds with 400 status code', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: 1,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            const response = await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.statusCode).toBe(400);
          }
        });

        test('Responds with json in content-type header', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: 1,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            const response = await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.headers['content-type'])
              .toEqual(expect.stringContaining('json'));
          }
        });

        test('Responds with errors in json object', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: 1,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            const response = await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.body.errors).toBeDefined();
          }
        });

        test('Error message is for only for email', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: 1,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            const response = await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.body.errors.length).toBe(1);
            expect(response.body.errors[0].param).toBe('email');
          }
        });
      });
    });

    describe('Updating password', () => {
      describe('Given valid info', () => {
        const data = [
          { account_id: 1, username: 'editor1', body: { new_password: 'BrandNew1$' } },
          { account_id: 2, username: 'editor2', body: { new_password: 'BrandNew1$' } }
        ];

        test('Responds with 200 status code', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: input.account_id,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            const response = await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.statusCode).toBe(200);
          }
        });

        test('Update is made on correct account', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: input.account_id,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            updatePassword.mockReset();
            await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(updatePassword.mock.calls.length).toBe(1);
            expect(updatePassword.mock.calls[0][0]).toBe(input.account_id);
          }
        });

        test('Password is updated', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: input.account_id,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            updatePassword.mockReset();
            await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(updatePassword.mock.calls.length).toBe(1);
            expect(await bcrypt.compare(
              input.body.new_password,
              updatePassword.mock.calls[0][1]
            )).toBeTruthy();
          }
        });
      });

      describe('Given invalid info', () => {
        const data = [
          { username: 'editor1', body: { new_password: null } },
          { username: 'editor2', body: { new_password: '' } },
          { username: 'editor3', body: { new_password: 'short1$' } },
          { username: 'editor4', body: { new_password: 'nonumbershere' } },
          { username: 'editor5', body: { new_password: '0123456789' } },
          { username: 'editor6', body: { new_password: '!@#$%^&*' } },
          { username: 'editor7', body: { new_password: '0123!@#$%^&*' } },
          { username: 'editor8', body: { new_password: 'asdf!@#$%^&*' } },
          { username: 'editor8', body: { new_password: 'asdf01234' } },
        ];

        test('Responds with 400 status code', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: 1,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            const response = await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.statusCode).toBe(400);
          }
        });

        test('Responds with json in content-type header', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: 1,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            const response = await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.headers['content-type'])
              .toEqual(expect.stringContaining('json'));
          }
        });

        test('Responds with errors in json object', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: 1,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            const response = await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.body.errors).toBeDefined();
          }
        });

        test('Error message is for only for new_password', async () => {
          for (const input of data) {
            findAccountById.mockResolvedValue({
              account_id: 1,
              username: input.username,
              email: 'editor@email.com',
              first_name: null,
              last_name: null
            });
            const response = await request(app)
              .put(`/account/${input.username}`)
              .send(input.body)
              .set('Authorization', `Bearer ${cred}`);
            expect(response.body.errors.length).toBe(1);
            expect(response.body.errors[0].param).toBe('new_password');
          }
        });
      });
    });
  });

  describe('Given invalid credentials', () => {
    const data = [
      { username: 'editor1', body: { first_name: 'wrong_name' } },
      { username: 'editor2', body: { last_name: 'wrong_name' } },
      { username: 'editor3', body: { email: 'wrong@email.com' } },
    ];

    test('Responds with 403 status code', async () => {
      findAccountById.mockResolvedValue({
        account_id: 1,
        username: 'wrongaccount',
        email: 'wrong@email.com',
        first_name: null,
        last_name: null
      });
      for (const input of data) {
        const response = await request(app)
          .put(`/account/${input.username}`)
          .send(input.body)
          .set('Authorization', `Bearer ${cred}`);
        expect(response.statusCode).toBe(403);
      }
    });
  });

  describe('Given no credentials', () => {
    const data = [
      { username: 'editor1', body: { first_name: 'wrong_name' } },
      { username: 'editor2', body: { last_name: 'wrong_name' } },
      { username: 'editor3', body: { email: 'wrong@email.com' } },
    ];

    test('Responds with 403 status code', async () => {
      findAccountById.mockResolvedValue(null);
      for (const input of data) {
        const response = await request(app)
          .put(`/account/${input.username}`)
          .send(input.body);
        expect(response.statusCode).toBe(401);
      }
    });
  });

  // Case where user does not exist is equivalent to having the wrong (or no) credentials
});

describe('GET /account/:username', () => {
  describe('username is valid', () => {
    test('Responds with 200 status code', async () => {
      const data = [
        { username: 'tester1' },
        { username: 'tester2' },
        { username: 'tester3' },
      ];
      for (const input of data) {
        findAccountByUsername.mockReset();
        findAccountByUsername.mockResolvedValue(input);
        const response = await request(app)
          .get(`/account/${input.username}`);
        expect(response.statusCode).toBe(200);
      }
    });

    test('Searches database for user by username', async () => {
      const data = [
        { username: 'tester1' },
        { username: 'tester2' },
        { username: 'tester3' },
      ];
      for (const input of data) {
        findAccountByUsername.mockReset();
        findAccountByUsername.mockResolvedValue(input);
        await request(app)
          .get(`/account/${input.username}`);
        expect(findAccountByUsername.mock.calls.length).toBe(1);
        expect(findAccountByUsername.mock.calls[0][0]).toBe(input.username);
      }
    });

    test('Searches database for items posted by user', async () => {
      const data = [
        { username: 'tester1', account_id: 1 },
        { username: 'tester2', account_id: 2 },
        { username: 'tester3', account_id: 3 },
      ];
      for (const input of data) {
        findAccountByUsername.mockReset();
        findAccountByUsername.mockResolvedValue(input);
        findItemsBySeller.mockReset();
        await request(app)
          .get(`/account/${input.username}`);
        expect(findItemsBySeller.mock.calls.length).toBe(1);
        expect(findItemsBySeller.mock.calls[0][0]).toBe(input.account_id);
      }
    });

    test('Responds with json in content-type header', async () => {
      const data = [
        { username: 'tester1' },
        { username: 'tester2' },
        { username: 'tester3' },
      ];
      for (const input of data) {
        const response = await request(app)
          .get(`/account/${input.username}`);
        expect(response.headers['content-type'])
          .toEqual(expect.stringContaining('json'));
      }
    });

    test('Responds with user in json object', async () => {
      const data = [
        { username: 'tester1' },
        { username: 'tester2' },
        { username: 'tester3' },
      ];
      for (const input of data) {
        findAccountByUsername.mockReset();
        findAccountByUsername.mockResolvedValue(input);
        const response = await request(app)
          .get(`/account/${input.username}`);
        expect(response.body.user).toBeDefined();
      }
    });

    test('User does not contain sensitive account information', async () => {
      const data = [
        { account_id: 1, username: 'tester1', hashedPassword: 'itsacecret1', first_name: 'name1', last_name: 'surname1', email: 'contact1@secret.com', created_on: Date.now() },
        { account_id: 2, username: 'tester2', hashedPassword: 'itsacecret2', first_name: 'name2', last_name: 'surname2', email: 'contact2@secret.com', created_on: Date.now() },
        { account_id: 3, username: 'tester3', hashedPassword: 'itsacecret3', first_name: 'name3', last_name: 'surname3', email: 'contact3@secret.com', created_on: Date.now() },
      ];
      for (const input of data) {
        findAccountByUsername.mockReset();
        findAccountByUsername.mockResolvedValue(input);
        const response = await request(app)
          .get(`/account/${input.username}`);
        expect(response.body.user.account_id).not.toBeDefined();
        expect(response.body.user.hashedPassword).not.toBeDefined();
        expect(response.body.user.email).not.toBeDefined();
      }
    });

    test('User contains desired account information', async () => {
      const data = [
        { account_id: 1, username: 'tester1', hashedPassword: 'itsacecret1', first_name: 'name1', last_name: 'surname1', email: 'contact1@secret.com', created_on: Date.now() },
        { account_id: 2, username: 'tester2', hashedPassword: 'itsacecret2', first_name: 'name2', last_name: 'surname2', email: 'contact2@secret.com', created_on: Date.now() },
        { account_id: 3, username: 'tester3', hashedPassword: 'itsacecret3', first_name: 'name3', last_name: 'surname3', email: 'contact3@secret.com', created_on: Date.now() },
      ];
      for (const input of data) {
        findAccountByUsername.mockReset();
        findAccountByUsername.mockResolvedValue(input);
        const response = await request(app)
          .get(`/account/${input.username}`);
        expect(response.body.user.username).toBeDefined();
        expect(response.body.user.first_name).toBeDefined();
        expect(response.body.user.last_name).toBeDefined();
        expect(response.body.user.created_on).toBeDefined();
      }
    });

    test('User information matches database output', async () => {
      const data = [
        { account_id: 1, username: 'tester1', hashedPassword: 'itsacecret1', first_name: 'name1', last_name: 'surname1', email: 'contact1@secret.com', created_on: Date.now() },
        { account_id: 2, username: 'tester2', hashedPassword: 'itsacecret2', first_name: 'name2', last_name: 'surname2', email: 'contact2@secret.com', created_on: Date.now() },
        { account_id: 3, username: 'tester3', hashedPassword: 'itsacecret3', first_name: 'name3', last_name: 'surname3', email: 'contact3@secret.com', created_on: Date.now() },
      ];
      for (const input of data) {
        findAccountByUsername.mockReset();
        findAccountByUsername.mockResolvedValue(input);
        const response = await request(app)
          .get(`/account/${input.username}`);
        expect(response.body.user.username).toBe(input.username);
        expect(response.body.user.first_name).toBe(input.first_name);
        expect(response.body.user.last_name).toBe(input.last_name);
        expect(response.body.user.created_on).toBe(input.created_on);
      }
    });

    test('Responds with items in json object', async () => {
      const data = [
        { username: 'tester1' },
        { username: 'tester2' },
        { username: 'tester3' },
      ];
      for (const input of data) {
        findAccountByUsername.mockReset();
        findAccountByUsername.mockResolvedValue(input);
        findItemsBySeller.mockReset();
        const response = await request(app)
          .get(`/account/${input.username}`);
        expect(response.body.items).toBeDefined();
      }
    });

    test('Items is an array', async () => {
      const data = [
        { username: 'tester1' },
        { username: 'tester2' },
        { username: 'tester3' },
      ];
      for (const input of data) {
        findAccountByUsername.mockReset();
        findAccountByUsername.mockResolvedValue(input);
        findItemsBySeller.mockReset();
        const response = await request(app)
          .get(`/account/${input.username}`);
        expect(response.body.items).toBeInstanceOf(Array);
      }
    });

    test('Items is response from database search', async () => {
      const data = [
        { username: 'tester1', items: [] },
        { username: 'tester2', items: [{ id: 1 }] },
        { username: 'tester3', items: [{ id: 2 }, { id: 3 }] },
      ];
      for (const input of data) {
        findAccountByUsername.mockReset();
        findAccountByUsername.mockResolvedValue(input);
        findItemsBySeller.mockReset();
        findItemsBySeller.mockResolvedValue(input.items);
        const response = await request(app)
          .get(`/account/${input.username}`);
        expect(response.body.items).toEqual(input.items);
      }
    })
  });

  describe('Username is invalid', () => {
    test('Responds with 404 status code', async () => {
      findAccountByUsername.mockReset();
      const response = await request(app)
        .get(`/account/wrongname`);
      expect(response.statusCode).toBe(404);
    });
  });
});

describe('DELETE /account/:username', () => {
  describe('Given valid username', () => {
    describe('Given valid credentials', () => {
      test('Responds with 200 status code', async () => {
        const data = [
          { username: 'deleted1', account_id: 1 },
          { username: 'deleted2', account_id: 2 },
          { username: 'deleted3', account_id: 3 },
        ];
        for (const input of data) {
          findAccountById.mockResolvedValue(input);
          const response = await request(app)
            .delete(`/account/${input.username}`)
            .set('Authorization', `Bearer ${cred}`);
          expect(response.statusCode).toBe(200);
        }
      });

      test('Deletes user from database', async () => {
        const data = [
          { username: 'deleted1', account_id: 1 },
          { username: 'deleted2', account_id: 2 },
          { username: 'deleted3', account_id: 3 },
        ];
        for (const input of data) {
          findAccountById.mockResolvedValue(input);
          deleteAccountById.mockReset();
          await request(app)
            .delete(`/account/${input.username}`)
            .set('Authorization', `Bearer ${cred}`);
          expect(deleteAccountById.mock.calls.length).toBe(1);
          expect(deleteAccountById.mock.calls[0][0]).toBe(input.account_id);
        }
      });
    });

    describe('Given invalid credentials', () => {
      test('Responds with 403 status code', async () => {
        const data = [
          { username: 'deleted1', account_id: 1 },
          { username: 'deleted2', account_id: 2 },
          { username: 'deleted3', account_id: 3 },
        ];
        for (const input of data) {
          findAccountById.mockResolvedValue({
            username: 'badname'
          });
          const response = await request(app)
            .delete(`/account/${input.username}`)
            .set('Authorization', `Bearer ${cred}`);
          expect(response.statusCode).toBe(403);
        }
      });
    });

    describe('Given no credentials', () => {
      test('Reponds with 401 status code', async () => {
        const data = [
          { username: 'deleted1', account_id: 1 },
          { username: 'deleted2', account_id: 2 },
          { username: 'deleted3', account_id: 3 },
        ];
        for (const input of data) {
          findAccountById.mockResolvedValue(null);
          const response = await request(app)
            .delete(`/account/${input.username}`);
          expect(response.statusCode).toBe(401);
        }
      });
    });
  });

  // Invalid username cases equivalent to invalid (or no) credentials
});
