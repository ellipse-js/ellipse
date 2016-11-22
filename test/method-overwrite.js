'use strict'

const test    = require('tap'),
      support = require('./support'),
      end     = support.end,
      create  = support.create,
      request = support.request

test.test('request method should be overwritten', test => {
    const app = create()

    test.plan(3)

    app.get('/', (req, res, next) => {
        req.method = 'POST'
        next()

        test.pass('GET handler should be called')
    })

    app.put('/', () =>
        test.fail('PUT handler should not be called'))

    app.post('/', (req, res, next) => {
        req.method = 'PATCH'
        next()

        test.pass('POST handler should be called')
    })

    app.patch('/', (req, res) => {
        res.send('swag')
        test.pass('PATCH handler should be called')
    })

    request(app)
        .get('/')
        .expect(200, 'swag', end(test))
})
