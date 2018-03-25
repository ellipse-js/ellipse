/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const test    = require('tap'),
      helpers = require('../helpers'),
      end     = helpers.end,
      create  = helpers.create,
      request = helpers.request

test.test('.status(code) should set the response .statusCode', test => {
    const app = create()

    app.use(ctx =>
        ctx.res.status(201)
           .end('Created'))

    request(app)
        .get('/')
        .expect('Created')
        .expect(201, end(test))
})
