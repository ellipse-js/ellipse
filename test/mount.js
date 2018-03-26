'use strict'

const test    = require('tap'),
      helpers = require('./helpers'),
      end     = helpers.end,
      create  = helpers.create,
      request = helpers.request,
      app     = create(),
      onend   = end(test, 2)

test.plan(3)

app.use('/1/*', ctx => {
    test.equal(ctx.url, 'foo', 'route should be mounted')
    ctx.body = 'ok'
    ctx.send()
})

app.mount('/2').get('/:test', ctx => {
    test.equal(ctx.url, '/bar', 'route should be mounted')
    ctx.body = 'ok'
    ctx.send()
})

request(app)
    .get('/1/foo')
    .expect(200)
    .end(onend)

request(app)
    .get('/2/bar')
    .expect(200)
    .end(onend)
