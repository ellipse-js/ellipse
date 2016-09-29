'use strict'

const request = require('supertest'),
      test    = require('tap'),
      Ellipse = require('..')

var app1 = new Ellipse,
    app2 = new Ellipse({ respond: false })

app1.get('/', (req, res, next) => {
    res.body = 'ok'
    next()
})

app1.get('/per-request', function (req, res, next) {
    this.respond = false
    res.body = 'ok'
    next()
})

app2.get('/', (req, res, next) => {
    res.body = 'ok'
    next()
})

test.plan(3)
test.tearDown(() => {
    app1.close()
    app2.close()
})

app1 = app1.listen()
app2 = app2.listen()

request(app1)
    .get('/')
    .expect(200, 'ok', onend)

request(app1)
    .get('/per-request')
    .expect(404, onend)

request(app2)
    .get('/')
    .expect(404, onend)

function onend(err) {
    if (err)
        test.threw(err)
    else
        test.pass('expected result received')
}
