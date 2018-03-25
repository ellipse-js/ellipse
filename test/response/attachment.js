/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const test    = require('tap'),
      helpers = require('../helpers'),
      end     = helpers.end,
      create  = helpers.create,
      request = helpers.request

test.test('should Content-Disposition to attachment', test => {
    const app = create()

    app.use(ctx =>
        ctx.attachment().send('foo'))

    request(app)
        .get('/')
        .expect('Content-Disposition', 'attachment', end(test))
})

test.test('.attachment(filename)', test => {
    test.test('should add the filename param', test => {
        const app = create()

        app.use(ctx =>
            ctx.attachment('/path/to/image.png').send('foo'))

        request(app)
            .get('/')
            .expect('Content-Disposition', 'attachment; filename="image.png"', end(test))
    })

    test.test('should set the Content-Type', test => {
        const app = create()

        app.use(ctx => {
            ctx.attachment('/path/to/image.png')
            ctx.send(Buffer.alloc(4))
        })

        request(app)
            .get('/')
            .expect('Content-Type', 'image/png', end(test))
    })

    test.end()
})

test.test('.attachment(utf8filename)', test => {
    test.test('should add the filename and filename* params', test => {
        const app = create()

        app.use(ctx => {
            ctx.attachment('/locales/日本語.txt')
            ctx.send('japanese')
        })

        request(app)
            .get('/')
            .expect('Content-Disposition', 'attachment; filename="???.txt"; filename*=UTF-8\'\'%E6%97%A5%E6%9C%AC%E8%AA%9E.txt')
            .expect(200, end(test))
    })

    test.test('should set the Content-Type', test => {
        const app = create()

        app.use(ctx => {
            ctx.attachment('/locales/日本語.txt')
            ctx.send('japanese')
        })

        request(app)
            .get('/')
            .expect('Content-Type', 'text/plain; charset=utf-8', end(test))
    })

    test.end()
})
