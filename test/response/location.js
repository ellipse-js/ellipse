/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const test    = require('tap'),
      helpers = require('../helpers'),
      end     = helpers.end,
      create  = helpers.create,
      request = helpers.request

test.test('.location(url)', test => {
    test.test('should set the header', test => {
        const app = create()

        app.use(ctx => ctx.res.location('http://google.com').end())

        request(app)
            .get('/')
            .expect('location', 'http://google.com')
            .expect(200, end(test))
    })

    test.test('should encode "url"', test => {
        const app = create()

        app.use(ctx => ctx.res.location('https://google.com?q=\u2603 §10').end())

        request(app)
            .get('/')
            .expect('location', 'https://google.com?q=%E2%98%83%20%C2%A710')
            .expect(200, end(test))
    })

    test.test('should not touch already-encoded sequences in "url"', test => {
        const app = create()

        app.use(ctx => ctx.res.location('https://google.com?q=%A710').end())

        request(app)
            .get('/')
            .expect('location', 'https://google.com?q=%A710')
            .expect(200, end(test))
    })

    test.test('"back" should refer to the Referrer header', test => {
        const app = create()

        app.use(ctx => ctx.res.location('back').end())

        request(app)
            .get('/')
            .set('referer', 'http://example.com')
            .expect('location', 'http://example.com')
            .expect(200, end(test))
    })

    test.end()
})
