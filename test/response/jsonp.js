'use strict'

const test    = require('tap'),
      utils   = require('../support'),
      end     = utils.end,
      create  = utils.create,
      request = utils.request

test.test('.jsonp() should throw', test => {
    const app = create().use((req, res) => {
        test.throws(() => {
            res.jsonp()
        })

        res.send('ok')
    })

    request(app)
        .get('/')
        .expect(200, 'ok', end(test))
})
