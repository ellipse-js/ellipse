/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const test    = require('tap'),
      helpers = require('../helpers'),
      end     = helpers.end,
      create  = helpers.create,
      request = helpers.request

test.test('.type(str)', test => {
    test.test('it should set the Content-Type based on a filename', test => {
        const app = create()

        app.use(ctx =>
            ctx.res.type('foo.js')
               .end('var name = "ellipse";'))

        request(app)
            .get('/')
            .expect('Content-Type', 'application/javascript', end(test))
    })

    test.test('it should default to application/octet-stream', test => {
        const app = create()

        app.use(ctx =>
            ctx.res.type('rawr')
               .end('var name = "ellipse";'))

        request(app)
            .get('/')
            .expect('Content-Type', 'application/octet-stream', end(test))
    })

    test.test('it should set the Content-Type with type/subtype', test => {
        const app = create()

        app.use(ctx =>
            ctx.res.type('application/vnd.amazon.ebook')
               .end('var name = "ellipse";'))

        request(app)
            .get('/')
            .expect('Content-Type', 'application/vnd.amazon.ebook', end(test))
    })

    test.end()
})
