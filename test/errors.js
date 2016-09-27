'use strict'

const test    = require('tap'),
      request = require('supertest'),
      err     = new Error('test error')

var app = require('../')()

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

app = app.listen()

test.tearDown(function () {
    app.close()
})

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

get('/1/a')
get('/1/b')
get('/2')

// todo: add a test for that case when an `error` event handler throws
// note: that should be caught on emit: `try { emitter.emit('error', err) } catch (ex) { /* error in error handler */ }`
