/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const test    = require('tap'),
      helpers = require('../helpers'),
      end     = helpers.end,
      create  = helpers.create,
      request = helpers.request

// note about these tests: "Link" and "X-*" are chosen because
// the common node.js versions white list which _incoming_
// headers can appear multiple times; there is no such white list
// for outgoing, though

test.test('should append multiple headers', test => {
    const app = create()

    app.use((ctx, next) => {
        ctx.append('Link', '<http://localhost/>')
        next()
    })

    app.use(ctx =>
        ctx.append('Link', '<http://localhost:80/>').send())

    request(app)
        .get('/')
        .expect('Link', '<http://localhost/>, <http://localhost:80/>', end(test))
})

test.test('should accept array of values', test => {
    const app = create(),
          arr = [ 'foo=bar', 'fizz=buzz' ]

    app.use(ctx =>
        ctx.append('Set-Cookie', arr).send())

    request(app)
        .get('/')
        .expect(res =>
            test.same(res.headers[ 'set-cookie' ], arr, 'header should be set'))
        .expect(200, end(test))
})

test.test('should get reset by res.set(field, val)', test => {
    const app = create()

    app.use((ctx, next) => {
        ctx.append('Link', '<http://localhost/>')
        ctx.append('Link', '<http://localhost:80/>')
        next()
    })

    app.use(ctx =>
        ctx.set('Link', '<http://127.0.0.1/>').send())

    request(app)
        .get('/')
        .expect('Link', '<http://127.0.0.1/>', end(test))
})

test.test('should work with res.set(field, val) first', test => {
    const app = create()

    app.use((ctx, next) => {
        ctx.set('Link', '<http://localhost/>')
        next()
    })

    app.use(ctx =>
        ctx.append('Link', '<http://localhost:80/>').send())

    request(app)
        .get('/')
        .expect('Link', '<http://localhost/>, <http://localhost:80/>', end(test))
})

test.test('should work with cookies', test => {
    const app      = create(),
          expected = [ 'foo=bar; path=/; httponly', 'bar=baz' ]

    app.use((ctx, next) => {
        ctx.cookies.set('foo', 'bar')
        next()
    })

    app.use(ctx =>
        ctx.append('Set-Cookie', 'bar=baz').send())

    request(app)
        .get('/')
        .expect(res => test.same(expected, res.headers[ 'set-cookie' ], 'header should be set'))
        .expect(200, end(test))
})
