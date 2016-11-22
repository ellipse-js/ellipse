/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const test    = require('tap'),
      utils   = require('./support'),
      end     = utils.end,
      create  = utils.create,
      request = utils.request

test.test('throw after .end() should fail gracefully', test => {
    const app  = create(),
          done = end(test, 2)

    app.get('/', (req, res) => {
        res.end('yay')
        throw new Error('boom')
    })

    app.on('error', err => {
        test.match(err.stack, /boom/, 'error event should be emitted once')
        done()
    })

    request(app)
        .get('/')
        .expect(200, 'yay', done)
})
