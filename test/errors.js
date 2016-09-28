'use strict'

const test    = require('tap'),
      request = require('supertest'),
      err     = new Error('test error')

var app1 = require('..')(),
    app2 = require('..')()

app2.env = 'test'

test.plan(3)

app1.get('/1/a', next => next(err))

app1.get('/1/b', next => {
    throw err
})

app1.get('/2', function *(next) {
    throw err
})

app1.on('error', onerror)

app2.get('/', next => next(err))

app2.get('/bad', function *(next) {
    this.throw(400, 'sooo bad')
})

app2.get('/custom-http-error1', function *(next) {
    const err = new Error('fake')
    err.message = 'fake error'
    throw err
})

app2.get('/custom-http-error2', function *(next) {
    const err = new Error('fake')
    err.statusCode = 409
    err.message = 'fake error'
    err.expose = true
    throw err
})


app1 = app1.listen()
app2 = app2.listen()

test.tearDown(() => {
    app1.close()
    app2.close()
})

get('/1/a')
get('/1/b')
get('/2')

request(app2)
    .get('/')
    .expect(500)
    .expect(/^Internal Server Error/, onend)

request(app2)
    .get('/bad')
    .expect(400)
    .expect('sooo bad')

request(app2)
    .get('/custom-http-error1')
    .expect(500, onend)

request(app2)
    .get('/custom-http-error2')
    .expect(409, onend)

function get(path) {
    request(app1)
        .get(path)
        .expect(200, onend)
}

function onend(err) {
    if (err)
        test.threw(err)
}

function onerror(er, ctx) {
    test.equals(er, err, 'original error should be caught')

    ctx.status = 200
    ctx.body   = 'not really an error'
    ctx.send()
}

// todo: add a test for that case when an `error` event handler throws
// note: that should be caught on emit: `try { emitter.emit('error', err) } catch (ex) { /* error in error handler */ }`
