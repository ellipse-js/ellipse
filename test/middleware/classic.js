/* These tests are ported from Express.
* https://github.com/expressjs/express
*/

'use strict'

const test    = require('tap'),
      helpers = require('../helpers'),
      create  = helpers.create,
      request = helpers.request


test.test('next() should behave like Connect', test => {
    const app   = create({ respond: false }),
          calls = []

    app.use((ctx, next) => {
        calls.push('one')
        next()
    })

    app.use((ctx, next) => {
        calls.push('two')
        next()
    })

    app.use(ctx => {
        const req = ctx.req,
              res = ctx.res

        calls.push('three')

        let buf = ''
        res.setHeader('Content-Type', 'application/json')
        req.setEncoding('utf8')
        req.on('data', chunk => buf += chunk)
        req.on('end', () => res.end(buf))
    })

    request(app)
        .get('/')
        .set('Content-Type', 'application/json')
        .send('{"foo":"bar"}')
        .expect('Content-Type', 'application/json')
        .expect(200, '{"foo":"bar"}', err => {
            if (err)
                test.threw(err)
            else {
                test.same(calls, [ 'one', 'two', 'three' ], 'middleware should be called sequentially')
                test.end()
            }
        })
})
