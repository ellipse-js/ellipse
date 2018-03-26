'use strict'

const test    = require('tap'),
      helpers = require('./helpers'),
      end     = helpers.end,
      create  = helpers.create,
      request = helpers.request,
      app     = create({ proxy: true }),
      onend   = end(test, 4)

test.plan(5)

app.get('/', ctx => {
    test.equals(ctx.protocol, 'http', 'protocol should default to `x-forwarded-proto` header')
    ctx.send('ok')
})

app.get('/host', ctx => {
    test.equals(ctx.host, 'localhost', 'host should default to `x-forwarded-host` header')
    ctx.send('ok')
})

app.get('/ips', ctx => {
    test.same(ctx.ips, [ 't1', 't2' ], 'req.ips should default to `x-forwarded-for` header')
    ctx.send('ok')
})

request(app)
    .get('/')
    .expect(200, onend)

request(app)
    .get('/')
    .set('x-forwarded-proto', 'http')
    .expect(200, onend)

request(app)
    .get('/host')
    .set('x-forwarded-host', 'localhost')
    .expect(200, onend)

request(app)
    .get('/ips')
    .set('x-forwarded-for', 't1, t2')
    .expect(200, onend)
