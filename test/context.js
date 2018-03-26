'use strict'

const test    = require('tap'),
      Cookies = require('cookies'),
      helpers = require('./helpers'),
      Ellipse = require('..'),
      end     = helpers.end,
      create  = helpers.create,
      request = helpers.request,
      app     = create()

test.plan(40)

app.get('/', ctx => {
    test.type(ctx, Ellipse.Context, '`ctx` should be a Context instance')
    test.equals(ctx.app, app, 'ctx.app should refer to its parent application')
    test.equals(ctx.application, app, 'ctx.application should refer to its parent application')
    test.type(ctx.req, Ellipse.Request, 'ctx.req should be a Request instance')
    test.type(ctx.request, Ellipse.Request, 'ctx.request should be a Request instance')
    test.type(ctx.res, Ellipse.Response, 'ctx.res should be a Response instance')
    test.type(ctx.response, Ellipse.Response, 'ctx.response should be a Response instance')
    test.equals(ctx.app, app, 'ctx.app should be an Application instance')
    test.equals(ctx.application, app, 'ctx.application should be an Application instance')
    test.type(ctx.cookies, Cookies, 'ctx.cookies should be a Cookies instance')

    test.same(ctx.state, {}, 'ctx.state should default to an empty object')
    test.doesNotThrow(() => {
        ctx.state = 42
    }, 'ctx.state should be set to any value')
    test.equals(ctx.state, 42, 'ctx.state should persist')

    test.equals(ctx.type, 'text/html; charset=utf-8', 'default content type should be html')
    test.doesNotThrow(() => {
        ctx.type = 'application/json'
    }, 'ctx.type should be set to any string')
    test.equals(ctx.type, 'application/json', 'content type should perisist')

    test.strictEquals(ctx.text, '', 'ctx.text should default to ctx.body')
    test.doesNotThrow(() => {
        ctx.text = 'Hello World!'
    }, 'ctx.text should be set to any string')
    test.equals(ctx.text, 'Hello World!', 'text body should perisist')
    test.equals(ctx.type, 'text/plain', 'content type should be updated when setting ctx.text')

    test.strictEquals(ctx.html, 'Hello World!', 'ctx.html default to ctx.body')
    test.doesNotThrow(() => {
        ctx.html = '<h1>Hello World!</h1>'
    }, 'ctx.html should be set to any string')
    test.equals(ctx.html, '<h1>Hello World!</h1>', 'html body should perisist')
    test.equals(ctx.type, 'text/html', 'content type should be updated when setting ctx.html')

    test.strictEquals(ctx.json, '<h1>Hello World!</h1>', 'ctx.json default to ctx.body')
    test.doesNotThrow(() => {
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
        () => {
            ctx.assert(true, 400)
        },
        'assert should not throw when a truthy value is passed to it'
    )
    try {
        ctx.assert(false, 400)
    }
    catch (ex) {
        test.equals(ex.statusCode, 400, 'http status should be set on error')
    }

    try {
        ctx.throw(404)
    }
    catch (ex) {
        test.equals(ex.statusCode, 404, 'http status should be set on error')
    }

    const json = {
        request:     ctx.req.toJSON(),
        response:    ctx.res.toJSON(),
        app:         ctx.app.toJSON(),
        originalUrl: '/'
    }

    test.same(ctx.toJSON(), json, 'context should have a correct json representation')
    test.same(ctx.toJSON(), ctx.inspect(), 'toJSON() and inspect() should have the same output')

    // TODO: aliases!

    ctx.send()
})

request(app)
    .get('/')
    .expect(200)
    .end(end(test))
