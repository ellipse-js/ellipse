'use strict'

const test    = require('tap'),
      helpers = require('./helpers'),
      end     = helpers.end,
      create  = helpers.create,
      request = helpers.request,
      app1    = create(),
      app2    = create(),
      onend   = end(test, 2)

test.plan(1)

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

request(app1)
    .get('/')
    .expect(404)
    .expect('notFound event fired', onend)

request(app2)
    .get('/')
    .expect(404)
    .expect('catch-all middleware reached', onend)
