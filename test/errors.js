'use strict'

const isStackTrace = /Error.*\n(\tat\s.*:[0-9]*:[0-9]*\n)*/i;

const test    = require('tap'),
      request = require('supertest'),
      Ellipse = require('..'),
      err     = new Error('test error'),
      sub1a   = new Ellipse.Router,
      sub2a   = sub1a.mount('/sub'),
      sub1b   = Ellipse.Router(),
      sub2b   = sub1b.mount('/bubble')

var app1 = new Ellipse,
    app2 = new Ellipse,
    app3 = new Ellipse,
    app4 = new Ellipse({ env: 'development' })

test.plan(7)

app1.param('p1', (next, val) => next(err))
app1.param('p2', (next, val) => { throw err })
app1.get('/1/a', next => next(err))
app1.get('/1/b', next => { throw err })
app1.get('/2', function *(next) { throw err })
app1.get('/3/1/:p1', noop)
app1.get('/3/2/:p2', noop)
app1.on('error', onerror)

app2.get('/', next => next(err))

app2.get('/bad', function *(next) {
    this.throw(400, 'sooo bad')
})

app2.get('/next-signature', next => next(403, "You don't have permission to see this"))

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

app2.use('/sub', sub1a)
sub2a.get('/', next => next(err))

app3.use(sub1b)
sub2b.get('/', next => next('test'))
sub1b.on('error', (err, ctx) => {
    test.pass('err should bubble up to the first parent router which has an error handler')
    ctx.status = 200
    ctx.send("mare's nest")
})
app3.on('error', err => test.threw(err))

app4.get('/', next => next(err))
app4.on('error', () => {
    // test that case when a user-defined `error` event handler itself has an error
    throw err
})

process.stderr.write = data => {
    test.ok(isStackTrace.test(data), 'stack trace should be written to stdout when app.env is development')
}

app1 = app1.listen()
app2 = app2.listen()
app3 = app3.listen()
app4 = app4.listen()

test.tearDown(() => {
    app1.close()
    app2.close()
    app3.close()
    app4.close()
})

get(app1, '/1/a')
get(app1, '/1/b')
get(app1, '/2')
get(app1, '/3/1/t')
get(app1, '/3/2/t')
get(app2, '/', 500, /^Internal Server Error/)
get(app2, '/bad', 400, 'sooo bad')
get(app2, '/next-signature', 403, "You don't have permission to see this")
get(app2, '/custom-http-error1', 500)
get(app2, '/custom-http-error2', 409)
get(app2, '/sub/sub', 500)
get(app3, '/bubble', 200, "mare's nest")
get(app4, '/', 500, isStackTrace)

function noop() {}

function get(app, path, status, body) {
    const req = request(app)
        .get(path)
        .expect(status || 200)

    if (body)
        req.expect(body)

    req.end(onend)
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
