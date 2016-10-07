// todo: test response manipulations in `respond` event handler

'use strict'

const request = require('supertest'),
      test    = require('tap'),
      Ellipse = require('..')

var app1 = new Ellipse,
    app2 = new Ellipse({ respond: false }),
    app3 = new Ellipse

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

app3.get('/', (req, res, next) => {
    res.status(200, "everything's okay")
       .send()
})

app3.on('respond', ctx => {
    ctx.status  = 418
    ctx.message = 'help me!'
})

test.plan(4)
test.tearDown(() => {
    app1.close()
    app2.close()
    app3.close()
})

app1 = app1.listen()
app2 = app2.listen()
app3 = app3.listen()

request(app1)
    .get('/')
    .expect(200, 'ok', onend)

request(app1)
    .get('/per-request')
    .expect(404, onend)

request(app2)
    .get('/')
    .expect(404, onend)

request(app3)
    .get('/')
    .expect(418, onend)

function onend(err) {
    if (err)
        test.threw(err)
    else
        test.pass('expected result received')
}
