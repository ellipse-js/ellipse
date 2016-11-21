/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const test    = require('tap'),
      utils   = require('../utils'),
      end     = utils.end,
      create  = utils.create,
      request = utils.request

test.test('.clearCookie(name) should set a cookie passed expiry', test => {
    const app      = create(),
          expected = 'sid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly'

    app.use((req, res) =>
        res.clearCookie('sid').end())

    request(app)
        .get('/')
        .expect('set-cookie', expected)
        .expect(200, end(test))
})

test.test('.clearCookie(name, options) should set the given params', test => {
    const app      = create(),
          expected = 'sid=; path=/admin; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly'

    app.use((req, res) =>
        res.clearCookie('sid', { path: '/admin' }).end())

    request(app)
        .get('/')
        .expect('set-cookie', expected)
        .expect(200, end(test))
})
