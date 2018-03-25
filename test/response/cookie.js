/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const test    = require('tap'),
      helpers = require('../helpers'),
      end     = helpers.end,
      merge   = helpers.merge,
      create  = helpers.create,
      request = helpers.request

test.test('.cookie(name, object) should generate a JSON cookie', test => {
    const app      = create(),
          expected = 'user=j:{"name":"buggy"}; path=/; httponly'

    app.use(ctx =>
        ctx.res.cookie('user', { name: 'buggy' }).end())

    request(app)
        .get('/')
        .expect('set-cookie', expected)
        .expect(200, end(test))
})


test.test('.cookie(name, string) should set a cookie', test => {
    const app = create()

    app.use(ctx =>
        ctx.res.cookie('name', 'buggy').end())

    request(app)
        .get('/')
        .expect('set-cookie', 'name=buggy; path=/; httponly')
        .expect(200, end(test))
})

test.test('.cookie(name, string) should allow multiple calls', test => {
    const app      = create(),
          expected = 'name=buggy; path=/; httponly,age=1; path=/; httponly,gender=?; path=/; httponly'

    app.use(ctx => {
        const res = ctx.res

        res.cookie('name', 'buggy')
        res.cookie('age', 1)
        res.cookie('gender', '?')
        res.end()
    })

    request(app)
        .get('/')
        .expect('set-cookie', expected)
        .expect(200, end(test))
})

test.test('.cookie(name, string, options) should set params', test => {
    const app = create()

    app.use(ctx => {
        ctx.res.cookie('name', 'buggy', { httpOnly: false })
        ctx.res.end()
    })

    request(app)
        .get('/')
        .expect('set-cookie', 'name=buggy; path=/')
        .expect(200, end(test))
})

test.test('maxAge', test => {
    test.test('should set relative expires', test => {
        const app      = create(),
              expected = new Date(Date.now() + 5000).toUTCString()

        app.use(ctx =>
            ctx.res.cookie('name', 'buggy', { maxAge: 5000 }).end())

        request(app)
            .get('/')
            .expect(res =>
                test.ok(res.headers[ 'set-cookie' ][ 0 ].indexOf(expected) > -1))
            .expect(200, end(test))
    })

    test.test('should not mutate the options object', test => {
        const app         = create(),
              options     = { maxAge: 1000 },
              optionsCopy = merge({}, options)

        app.use(ctx =>
            ctx.res.cookie('name', 'tobi', options).end())

        request(app)
            .get('/')
            .end(() => {
                test.same(options, optionsCopy)
                test.end()
            })
    })

    test.end()
})
