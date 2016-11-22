/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const test    = require('tap'),
      utils   = require('../support'),
      end     = utils.end,
      create  = utils.create,
      request = utils.request

test.test('.sendStatus(statusCode)', test => {
    test.test('it should send the status code and message as body', test => {
        const app = create()

        app.use((req, res) => res.sendStatus(201))

        request(app)
            .get('/')
            .expect(201, 'Created', end(test))
    })

    test.test('it should work with unknown code', test => {
        const app = create()

        app.use((req, res) => res.sendStatus(599))

        request(app)
            .get('/')
            .expect(599, '599', end(test))
    })

    test.end()
})
