'use strict'

const request = require('supertest'),
      test    = require('tap'),
      Ellipse = require('..'),
      app1    = new Ellipse,
      app2    = new Ellipse,
      sub     = new Ellipse.Router

Ellipse.application.testListen = function () {
    const server = this.listen()
    test.pass('context should be extensible')
    return server
}

Ellipse.router.test = function () {
    test.pass('router should be extensible')
}

Ellipse.context.test = function () {
    test.pass('context should be extensible')
}

Ellipse.request.test = function () {
    test.pass('request should be extensible')
}

Ellipse.response.test = function () {
    test.pass('response should be extensible')
}

app1.context.test1 = function () {
    test.pass('context should be extensible per instance')
}

app1.request.test1 = function () {
    test.pass('request should be extensible per instance')
}

app1.response.test1 = function () {
    test.pass('response should be extensible per instance')
}

app2.context.test2 = function () {
    test.pass('context should be extensible per instance')
}

app2.request.test2 = function () {
    test.pass('request should be extensible per instance')
}

app2.response.test2 = function () {
    test.pass('response should be extensible per instance')
}

app1.get('/', (ctx, req, res, next) => {
    ctx.test()
    ctx.test1()
    req.test()
    req.test1()
    res.test()
    res.test1()
    test.equals(ctx.test2, undefined, 'app level extensions should not appear in other apps')
    test.equals(req.test2, undefined, 'app level extensions should not appear in other apps')
    test.equals(res.test2, undefined, 'app level extensions should not appear in other apps')

    res.send('ok')
})

app2.get('/', (ctx, req, res, next) => {
    ctx.test()
    ctx.test2()
    req.test()
    req.test2()
    res.test()
    res.test2()
    test.equals(ctx.test1, undefined, 'app level extensions should not appear in other apps')
    test.equals(req.test1, undefined, 'app level extensions should not appear in other apps')
    test.equals(res.test1, undefined, 'app level extensions should not appear in other apps')

    res.send('ok')
})

test.plan(23)

const server1 = app1.testListen(),
      server2 = app2.testListen()

test.tearDown(() => {
    server1.close()
    server2.close()
})

sub.test()

request(server1)
    .get('/')
    .expect(200, 'ok', onend)

request(server2)
    .get('/')
    .expect(200, 'ok', onend)

function onend(err) {
    if (err)
        test.threw(err)
    else
        test.pass('response received')
}
