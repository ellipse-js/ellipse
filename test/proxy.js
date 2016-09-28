'use strict'

const request = require('supertest'),
      test    = require('tap')

var app = require('..')({ proxy: true })

app.get('/', (req, res) => {
    test.equals(req.protocol, 'http', 'protocol should default to `x-forwarded-proto` header')
    res.send('ok')
})

app.get('/host', (req, res) => {
    test.equals(req.host, 'localhost', 'host should default to `x-forwarded-host` header')
    res.send('ok')
})

app.get('/ips', (req, res) => {
    test.same(req.ips, [ 't1', 't2' ], 'req.ips should default to `x-forwarded-for` header')
    res.send('ok')
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
