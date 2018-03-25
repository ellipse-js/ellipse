/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const test    = require('tap'),
      helpers = require('../helpers'),
      end     = helpers.end,
      create  = helpers.create,
      request = helpers.request

test.test('HEAD should default to GET', test => {
    const app = create()

    app.get('/buggy', ctx => {
        // send() detects HEAD
        ctx.send('buggy')
    })

    request(app)
        .head('/buggy')
        .expect(200, undefined, end(test))
})

test.test('HEAD requests should output the same headers as GET requests', test => {
    const app = create()

    app.get('/buggy', ctx => {
        // send() detects HEAD
        ctx.send('buggy')
    })

    request(app)
        .head('/buggy')
        .expect(200, (err, res) => {
            if (err) {
                test.threw(err)
                return
            }

            const headers = res.headers

            request(app)
                .get('/buggy')
                .expect(200, (err, res) => {
                    if (err) {
                        test.threw(err)
                        return
                    }

                    delete headers.date
                    delete res.headers.date

                    test.strictSame(res.headers, headers)
                    test.end()
                })
        })
})

test.test('app.head() should override', test => {
    const app = create()
    let called

    app.head('/buggy', ctx => {
        called = true
        ctx.res.end('')
    })

    app.get('/buggy', ctx => {
        test.fail('should not call GET')
        ctx.send('buggy')
    })

    request(app)
        .head('/buggy')
        .expect(200, err => {
            if (err) {
                test.threw(err)
                return
            }

            test.ok(called, 'HEAD should be called')
            test.end()
        })
})
