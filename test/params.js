'use strict'

const test    = require('tap'),
      helpers = require('./helpers'),
      end     = helpers.end,
      create  = helpers.create,
      request = helpers.request,
      app     = create(),
      onend   = end(test, 3)

test.plan(9)

app.param('p1', (ctx, next, param) => {
    test.equals(param, 'foo', 'param p1 should be "foo"')
    next()
})

app.param('p2', (ctx, next, param) => {
    test.equals(param, 'bar', 'param p2 should be "bar"')
    next()
})

app.get('/1/:p1', ctx => {
    test.equals(ctx.params.p1, 'foo', 'param p1 should be "foo"')
    ctx.send()
})

app.get(/^\/2\/([a-z])([a-z]{2})$/, ctx => {
    test.equals(ctx.params[ 0 ], 'b', 'param 0 should be "b"')
    test.equals(ctx.params[ 1 ], 'ar', 'param 1 should be "ar"')
    ctx.send()
})

app.get('/3/:p1/:p2', ctx => {
    test.equals(ctx.params.p1, 'foo', 'param p1 should be "foo"')
    test.equals(ctx.params.p2, 'bar', 'param p2 should be "bar"')
    ctx.send()
})

function get(path) {
    request(app)
        .get(path)
        .expect(200)
        .end(onend)
}

get('/1/foo')
get('/2/bar')
get('/3/foo/bar')
