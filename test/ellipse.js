/**
 * Created by schwarzkopfb on 16/3/25.
 */

'use strict'

var http     = require('http'),
    assert   = require('assert'),
    Ellipse  = require('../'),
    version  = require('../package.json').version,
    Router   = Ellipse.Router,
    Context  = Ellipse.Context,
    Request  = Ellipse.Request,
    Response = Ellipse.Response

assert(Ellipse instanceof Function, 'module should expose app constructor')
assert.equal(Ellipse.version, version, 'Ellipse.version should match the version in package.json')
assert(Router instanceof Function, 'Ellipse.Router should be a function')
assert(Context instanceof Function, 'Ellipse.Context should be a function')
assert(Request instanceof Function, 'Ellipse.Request should be a function')
assert(Response instanceof Function, 'Ellipse.Response should be a function')
assert(new Ellipse instanceof Router, 'Ellipse should inherit from Router')
assert(new Ellipse instanceof Ellipse, 'Ellipse should be a constructor')
assert(Ellipse() instanceof Ellipse, 'Ellipse() should behave like a constructor')
assert(new Router instanceof Router, 'Ellipse.Router should be a constructor')
assert(Router() instanceof Router, 'Ellipse.Router() should behave like a constructor')
assert(new Context({}, {}) instanceof Context, 'Ellipse.Context should be a constructor')
assert.equal(Ellipse.Application, Ellipse, 'Ellipse.Application should be a reference to Ellipse itself')
assert.equal(Request, http.IncomingMessage, 'Ellipse.Request should equal to http.IncomingMessage')
assert.equal(Response, http.ServerResponse, 'Ellipse.Response should equal http.ServerResponse')
assert.equal(Ellipse.application, Ellipse.prototype)
assert.equal(Ellipse.router, Router.prototype)
assert.equal(Ellipse.context, Context.prototype)
assert.equal(Ellipse.request, http.IncomingMessage.prototype)
assert.equal(Ellipse.response, http.ServerResponse.prototype)

var globTest = {},
    appTest  = {},
    app2Test = {}

Ellipse.application.test_ =
Ellipse.router.test =
Ellipse.context.test =
Ellipse.request.test =
Ellipse.response.test = globTest

var app  = new Ellipse,
    app2 = new Ellipse

app.router.test =
app.context.test =
app.request.test =
app.response.test = appTest

app2.router.test =
app2.context.test =
app2.request.test =
app2.response.test = app2Test

assert.equal(Ellipse.application.test_, globTest, 'Ellipse.application.test_ should not be affected')
assert.equal(Ellipse.router.test, globTest, 'Ellipse.router.test should not be affected by app.router.test')
assert.equal(Ellipse.context.test, globTest, 'Ellipse.context.test should not be affected by app.context.test')
assert.equal(Ellipse.request.test, globTest, 'Ellipse.request.test should not be affected by app.request.test')
assert.equal(Ellipse.response.test, globTest, 'Ellipse.response.test should not be affected by app.response.test')
assert.equal(app.router.test, appTest, 'app.router.test should not be affected by app2.router.test')
assert.equal(app.context.test, appTest, 'app.context.test should not be affected by app2.context.test')
assert.equal(app.request.test, appTest, 'app.request.test should not be affected by app2.request.test')
assert.equal(app.response.test, appTest, 'app.response.test should not be affected by app2.response.test')
assert.equal(app2.router.test, app2Test, 'app2.router.test should not be affected by app.router.test')
assert.equal(app2.context.test, app2Test, 'app2.context.test should not be affected by app.context.test')
assert.equal(app2.request.test, app2Test, 'app2.request.test should not be affected by app.request.test')
assert.equal(app2.response.test, app2Test, 'app2.response.test should not be affected by app.response.test')

var server = app.listen(),
    closed = 0

assert(server instanceof http.Server, 'app.listen() should return an http.Server instance')

server.on('close', function() {
    closed++
})

app.get('/', function () {
    assert.equal(app.test_, globTest, 'Ellipse.application.test should appear on app instances')
    assert.equal(app2.test_, globTest, 'Ellipse.application.test should appear on app instances')
    assert.equal(this.router.test, appTest, 'app.router.test should appear on router instances')
    assert.equal(this.test, appTest, 'app.context.test should appear on ctx instances')
    assert.equal(this.req.test, appTest, 'app.request.test should appear on req instances')
    assert.equal(this.res.test, appTest, 'app.response.test should appear on res instances')

    this.send()
    server.close()
})

app.on('error', function () {
    assert(0, 'app should not emit an `error` event')
})

process.on('exit', function () {
    assert.equal(closed, 1, 'server should emit `close` exactly once')
})

http.get('http://localhost:' + server.address().port)
