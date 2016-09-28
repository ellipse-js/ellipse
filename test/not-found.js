'use strict'

const request = require('supertest'),
      test    = require('tap')

var app1    = require('..')(),
    app2    = require('..')(),
    app3    = require('..')()

app1.on('notFound', function (ctx) {
    ctx.status = 404
    ctx.body = 'notFound event fired'
    ctx.send()
})

app2.all(function () {
    this.status = 404
    this.body = 'catch-all middleware reached'
    this.send()
})

app1 = app1.listen(3333)
app2 = app2.listen(3334)
app3 = app3.listen(3335)

test.plan(3)
test.tearDown(() => {
    app1.close()
    app2.close()
    app3.close()
})

request(app1)
    .get('/')
    .expect(404)
    .expect('notFound event fired', onend)

request(app2)
    .get('/')
    .expect(404)
    .expect('catch-all middleware reached', onend)

request(app3)
    .get('/')
    .expect(404)
    .expect('Cannot GET /', onend)

function onend(err) {
    if (err)
        test.threw(err)
    else
        test.pass('test succeeded')
}
