'use strict'

var test    = require('tap'),
    request = require('supertest'),
    app     = require('../')()

test.plan(7)

app.param('p1', function (next, param) {
    test.equals(param, 'foo', 'param p1 should be "foo"')
    next()
})

app.param('p2', function *(next, param) {
    test.equals(param, 'bar', 'param p2 should be "bar"')
    yield *next
})

app.get('/1/:p1', function (next) {
    test.equals(this.params.p1, 'foo', 'param p1 should be "foo"')
    this.send()
})

app.get(/^\/2\/([a-z]{3})$/, function (next) {
    test.equals(this.params[ 0 ], 'bar', 'param 0 should be "bar"')
    this.send()
})

app.get('/3/:p1/:p2', function (next) {
    test.equals(this.params.p1, 'foo', 'param p1 should be "foo"')
    test.equals(this.params.p2, 'bar', 'param p2 should be "bar"')
    this.send()
})

var server = app.listen()

test.tearDown(function () {
    server.close()
})

function get(path) {
    request(server)
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
