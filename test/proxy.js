'use strict'

const request = require('supertest'),
      test    = require('tap')

var app = require('..')({ proxy: true })

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

test.plan(4)
test.tearDown(() => app.close())

request(app = app.listen())
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

function onend(err) {
    if (err)
        test.threw(err)
}
