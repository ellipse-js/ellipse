'use strict'

const test    = require('tap'),
      helpers = require('./helpers'),
      end     = helpers.end,
      create  = helpers.create,
      request = helpers.request,
      onend   = end(test, 2),
      app     = create()

test.plan(3)

const delegate = app
    .route('/')
    .use((ctx, next) => {
        ctx.body = 'o'
        next()
    })
    .get(handler)
    .all(handler)

test.same(delegate.toJSON(), { path: '/' }, 'json representation of delegate should be correct')
test.same(delegate.toJSON(), delegate.inspect(), '`inspect()` and `toJSON()` should return the same result')

request(app)
    .get('/')
    .expect(200, 'ok', onend)

request(app)
    .post('/')
    .expect(200, 'ok', onend)

function handler(ctx) {
    ctx.body += 'k'
    ctx.send()
}
