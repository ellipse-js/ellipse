'use strict'

const test    = require('tap'),
      helpers = require('./helpers'),
      end     = helpers.end,
      create  = helpers.create,
      request = helpers.request

test.test('request method should be overwritten', test => {
    const app = create()

    test.plan(3)

    app.get('/', (ctx, next) => {
        ctx.req.method = 'POST'
        next()

        test.pass('GET handler should be called')
    })

    app.put('/', () =>
        test.fail('PUT handler should not be called'))

    app.post('/', (ctx, next) => {
        ctx.req.method = 'PATCH'
        next()

        test.pass('POST handler should be called')
    })

    app.patch('/', ctx => {
        ctx.send('swag')
        test.pass('PATCH handler should be called')
    })

    request(app)
        .get('/')
        .expect(200, 'swag', end(test))
})
