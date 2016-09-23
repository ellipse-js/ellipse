'use strict'

var test    = require('tap'),
    request = require('supertest'),
    app     = require('../')(),
    err     = new Error('test error')

test.plan(3)

app.get('/1/a', function (next) {
    next(err)
})

app.get('/1/b', function (next) {
    throw err
})

app.get('/2', function *(next) {
    throw err
})

app.on('error', function (er, ctx) {
    test.equals(er, err, 'original error should be caught')

    ctx.status = 200
    ctx.body   = 'not really an error'
    ctx.send()
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

get('/1/a')
get('/1/b')
get('/2')
