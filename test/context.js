'use strict'

var test    = require('tap'),
    request = require('supertest'),
    Cookies = require('cookies'),
    Ellipse = require('../'),
    app     = new Ellipse

app.get('/', function (next) {
    var ctx = this

    test.type(ctx, Ellipse.Context, '`this` should be a Context instance')
    test.type(ctx.req, Ellipse.Request, 'ctx.req should be a Request instance')
    test.type(ctx.request, Ellipse.Request, 'ctx.request should be a Request instance')
    test.type(ctx.res, Ellipse.Response, 'ctx.res should be a Response instance')
    test.type(ctx.response, Ellipse.Response, 'ctx.response should be a Response instance')
    test.type(ctx.cookies, Cookies, 'ctx.cookies should be a Cookies instance')

    test.same(ctx.state, {}, 'ctx.state should default to an empty object')
    test.doesNotThrow(function () {
        ctx.state = 42
    }, 'ctx.state should be set to any value')
    test.equals(ctx.state, 42, 'ctx.state should persist')

    test.equals(ctx.type, 'text/html', 'default content type should be html')
    test.doesNotThrow(function () {
        ctx.type = 'application/json'
    }, 'ctx.type should be set to any string')
    test.equals(ctx.type, 'application/json', 'content type should perisist')

    test.strictEquals(ctx.text, '', 'ctx.text should default to ctx.body')
    test.doesNotThrow(function () {
        ctx.text = 'Hello World!'
    }, 'ctx.text should be set to any string')
    test.equals(ctx.text, 'Hello World!', 'text body should perisist')
    test.equals(ctx.type, 'text/plain', 'content type should be updated when setting ctx.text')

    test.strictEquals(ctx.html, 'Hello World!', 'ctx.html default to ctx.body')
    test.doesNotThrow(function () {
        ctx.html = '<h1>Hello World!</h1>'
    }, 'ctx.html should be set to any string')
    test.equals(ctx.html, '<h1>Hello World!</h1>', 'html body should perisist')
    test.equals(ctx.type, 'text/html', 'content type should be updated when setting ctx.html')

    test.strictEquals(ctx.json, '<h1>Hello World!</h1>', 'ctx.json default to ctx.body')
    test.doesNotThrow(function () {
        ctx.json = { Hello: 'World!' }
    }, 'ctx.json should be set to any object')
    test.same(ctx.json, { Hello: 'World!' }, 'json body should perisist')
    test.equals(ctx.type, 'application/json', 'content type should be updated when setting ctx.json')

    ctx.body = null
    test.strictEquals(ctx.text, '', 'ctx.text should default to an empty string if body is `null`')
    test.equals(ctx.type, 'text/plain', 'content type should be updated on access')

    ctx.body = null
    test.strictEquals(ctx.html, '', 'ctx.html should default to an empty string if body is `null`')
    test.equals(ctx.type, 'text/html', 'content type should be updated on access')

    ctx.body = null
    test.same(ctx.json, {}, 'ctx.json should default to an empty object if body is `null`')
    test.equals(ctx.type, 'application/json', 'content type should be updated on access')

    test.doesNotThrow(
        function () {
            ctx.assert(true, 400)
        },
        'assert should not throw when a truthy value is passed to it'
    )
    try {
        this.assert(false, 400)
    }
    catch (ex) {
        test.equals(ex.statusCode, 400, 'http status should be set on error')
    }

    try {
        this.throw(404)
    }
    catch (ex) {
        test.equals(ex.statusCode, 404, 'http status should be set on error')
    }

    var json = {
        request:     this._req.toJSON(),
        response:    this._res.toJSON(),
        app:         this.app.toJSON(),
        originalUrl: '/'
    }

    test.same(ctx.toJSON(), json, 'context should have a correct json representation')
    test.same(ctx.toJSON(), ctx.inspect(), 'toJSON() and inspect() should have the same output')

    // TODO: aliases!

    this.send()
})

request(app = app.listen())
    .get('/')
    .expect(200)
    .end(function (err) {
        if (err)
            test.threw(err)
        else
            app.close()
    })
