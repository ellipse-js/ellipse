/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const test    = require('tap'),
      helpers = require('../helpers'),
      end     = helpers.end,
      create  = helpers.create,
      request = helpers.request

test.test('.links(obj)', test => {
    test.test('should set Link header field', test => {
        const app = create()

        app.use(ctx =>
            ctx.res.links({
                next: 'http://api.example.com/users?page=2',
                last: 'http://api.example.com/users?page=5'
            }).end())

        request(app)
            .get('/')
            .expect('Link', '<http://api.example.com/users?page=2>; rel="next", <http://api.example.com/users?page=5>; rel="last"')
            .expect(200, end(test))
    })

    test.test('should set Link header field for multiple calls', test => {
        const app = create()

        app.use(ctx => {
            const res = ctx.res

            res.links({
                next: 'http://api.example.com/users?page=2',
                last: 'http://api.example.com/users?page=5'
            })

            res.links({
                prev: 'http://api.example.com/users?page=1'
            })

            res.end()
        })

        request(app)
            .get('/')
            .expect('Link', '<http://api.example.com/users?page=2>; rel="next", <http://api.example.com/users?page=5>; rel="last", <http://api.example.com/users?page=1>; rel="prev"')
            .expect(200, end(test))
    })

    test.end()
})

test.test('.link(link, rel)', test => {
    test.test('should set Link header field', test => {
        const app = create()

        app.use(ctx =>
            ctx.res.link('next', 'http://api.example.com/users?page=2').end())

        request(app)
            .get('/')
            .expect('Link', '<http://api.example.com/users?page=2>; rel="next"')
            .expect(200, end(test))
    })

    test.test('should set Link header field for multiple calls', test => {
        const app = create()

        app.use(ctx => {
            const res = ctx.res

            res.link('next', 'http://api.example.com/users?page=2')
            res.link('last', 'http://api.example.com/users?page=5')
            res.link('prev', 'http://api.example.com/users?page=1')
            res.end()
        })

        request(app)
            .get('/')
            .expect('Link', '<http://api.example.com/users?page=2>; rel="next", <http://api.example.com/users?page=5>; rel="last", <http://api.example.com/users?page=1>; rel="prev"')
            .expect(200, end(test))
    })

    test.end()
})
