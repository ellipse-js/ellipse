'use strict'

const test    = require('tap'),
      helpers = require('../helpers'),
      end     = helpers.end,
      create  = helpers.create,
      request = helpers.request

test.test('.jsonp() should throw', test => {
    const app = create().use(ctx => {
        test.throws(() => {
            ctx.res.jsonp()
        })

        ctx.res.send('ok')
    })

    request(app)
        .get('/')
        .expect(200, 'ok', end(test))
})
