/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const test    = require('tap'),
      helpers = require('../helpers'),
      end     = helpers.end,
      create  = helpers.create,
      request = helpers.request

test.test('.sendStatus(statusCode)', test => {
    test.test('it should send the status code and message as body', test => {
        const app = create()

        app.use(ctx => ctx.res.sendStatus(201))

        request(app)
            .get('/')
            .expect(201, 'Created', end(test))
    })

    test.test('it should work with unknown code', test => {
        const app = create()

        app.use(ctx => ctx.res.sendStatus(599))

        request(app)
            .get('/')
            .expect(599, '599', end(test))
    })

    test.end()
})
