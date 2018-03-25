'use strict'

const test    = require('tap'),
      request = require('supertest')

var app = require('..')()

test.plan(7)

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

app.get(/^\/2\/([a-z]{3})$/, ctx => {
    test.equals(ctx.params[ 0 ], 'bar', 'param 0 should be "bar"')
    ctx.send()
})

app.get('/3/:p1/:p2', ctx => {
    test.equals(ctx.params.p1, 'foo', 'param p1 should be "foo"')
    test.equals(ctx.params.p2, 'bar', 'param p2 should be "bar"')
    ctx.send()
})

app = app.listen()

test.tearDown(() => app.close())

function get(path) {
    request(app)
        .get(path)
        .expect(200)
        .end(onend)
}

function onend(err) {
    if (err)
        test.threw(err)
}

get('/1/foo')
get('/2/bar')
get('/3/foo/bar')
