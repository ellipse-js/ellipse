'use strict'

const request = require('supertest'),
      test    = require('tap')

var app1    = require('..')(),
    app2    = require('..')()

app1.on('notFound', function (ctx) {
    ctx.status = 404
    ctx.body = 'notFound event fired'
    ctx.send()
})

app2.all(ctx => {
    ctx.status = 404
    ctx.body = 'catch-all middleware reached'
    ctx.send()
})

app1 = app1.listen()
app2 = app2.listen()

test.plan(2)
test.tearDown(() => {
    app1.close()
    app2.close()
})

request(app1)
    .get('/')
    .expect(404)
    .expect('notFound event fired', onend)

request(app2)
    .get('/')
    .expect(404)
    .expect('catch-all middleware reached', onend)

function onend(err) {
    if (err)
        test.threw(err)
    else
        test.pass('test succeeded')
}
