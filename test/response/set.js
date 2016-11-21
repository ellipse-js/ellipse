/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const test    = require('tap'),
      utils   = require('../utils'),
      end     = utils.end,
      create  = utils.create,
      request = utils.request

test.test('.set(field, value)', test => {
    test.test('it should set the response header field', test => {
        const app = create()

        app.use((req, res) =>
            res.set('Content-Type', 'text/x-foo; charset=utf-8')
               .end())

        request(app)
            .get('/')
            .expect('Content-Type', 'text/x-foo; charset=utf-8')
            .end(end(test))
    })

    test.test('it should coerce to a string', test => {
        const app = create()

        app.use((req, res) =>
            res.set('X-Number', 123)
               .end(typeof res.get('X-Number')))

        request(app)
            .get('/')
            .expect('X-Number', '123')
            .expect(200, 'string', end(test))
    })

    test.end()
})

test.test('.set(field, values)', test => {
    test.test('it should set multiple response header fields', test => {
        const app = create()

        app.use((req, res) =>
            res.set('Set-Cookie', ["type=ninja", "language=javascript"])
               .send(res.get('Set-Cookie')))

        request(app)
            .get('/')
            .expect('["type=ninja","language=javascript"]', end(test))
    })

    test.test('it should coerce to an array of strings', test => {
        const app = create()

        app.use((req, res) =>
            res.set('X-Numbers', [123, 456])
               .end(JSON.stringify(res.get('X-Numbers'))))

        request(app)
            .get('/')
            .expect('X-Numbers', '123, 456')
            .expect(200, '["123","456"]', end(test))
    })

    test.test('it should not set a charset of one is already set', test => {
        const app = create()

        app.use((req, res) =>
            res.set('Content-Type', 'text/html; charset=lol')
               .end())

        request(app)
            .get('/')
            .expect('Content-Type', 'text/html; charset=lol')
            .expect(200, end(test))
    })

    test.end()
})

test.test('.set(object)', test => {
    test.test('it should set multiple fields', test => {
        const app = create()

        app.use((req, res) =>
            res.set({
                   'X-Foo': 'bar',
                   'X-Bar': 'baz'
               })
               .end())

        request(app)
            .get('/')
            .expect('X-Foo', 'bar')
            .expect('X-Bar', 'baz')
            .end(end(test))
    })

    test.test('it should coerce to a string', test => {
        const app = create()

        app.use((req, res) =>
            res.set({ 'X-Number': 123 })
               .end(typeof res.get('X-Number')))

        request(app)
            .get('/')
            .expect('X-Number', '123')
            .expect(200, 'string', end(test))
    })

    test.end()
})
