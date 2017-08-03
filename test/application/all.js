/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const test    = require('tap'),
      utils   = require('../support'),
      end     = utils.end,
      create  = utils.create,
      request = utils.request

test.test('it should add a router per method', test => {
    const app = create()

    app.all('/buggy', (req, res) => {
        res.end(req.method)
    })

    request(app)
        .put('/buggy')
        .expect('PUT', err => {
            if (err) {
                test.threw(err)
                return
            }

            request(app)
                .get('/buggy')
                .expect('GET', end(test))
        })
})

test.test('it should run the callback for a method just once', test => {
    const app = create()
    let   n   = 0

    app.all('/*', (req, res, next) => {
        if (n++)
            return test.fail('DELETE called several times')

        res.send()
    })

    request(app)
        .delete('/buggy')
        .expect(200, end(test))
})
