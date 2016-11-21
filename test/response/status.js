/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const test    = require('tap'),
      utils   = require('../utils'),
      end     = utils.end,
      create  = utils.create,
      request = utils.request

test.test('.status(code) should set the response .statusCode', test => {
    const app = create()

    app.use((req, res) =>
        res.status(201)
           .end('Created'))

    request(app)
        .get('/')
        .expect('Created')
        .expect(201, end(test))
})
