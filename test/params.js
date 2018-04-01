'use strict'

const test    = require('tap'),
      helpers = require('./helpers'),
      end     = helpers.end,
      create  = helpers.create,
      request = helpers.request,
      app     = create(),
      onend   = end(test, 4)

test.plan(11)

app.param('p3', (ctx, next, param) => {
    test.equals(param, 'foobar', 'param p3 should be "foobar"')
    next()
})

app.param([ 'p1', 'p2' ], (ctx, next, param, name) => {
    switch (name) {
        case 'p1':
            test.equals(param, 'foo', 'param p1 should be "foo"')
            break

        case 'p2':
            test.equals(param, 'bar', 'param p2 should be "bar"')
            break

        default:
            test.fail('param value and name should be provided correctly')
    }

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

app.get('/4/:p3', ctx => {
    test.equals(ctx.params.p3, 'foobar', 'param p3 should be "foobar"')
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
get('/4/foobar')
