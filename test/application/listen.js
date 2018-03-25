/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const test    = require('tap'),
      Ellipse = require('../..')

test.test('app.listen() should wrap with an HTTP server', test => {
    const app = new Ellipse

    app.delete('/buggy', ctx =>
        ctx.res.end('deleted buggy!'))

    const server = app.listen(() => server.close(() => test.end()))
})
