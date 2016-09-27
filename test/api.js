'use strict'

const test    = require('tap'),
      Ellipse = require('..')

test.type(Ellipse, 'function', 'main export should be a constructor')
test.equals(Ellipse.version, require('../package.json').version, 'package version should be exposed')

test.test('constructors', test => {
    test.type(Ellipse.Router, 'function', '`Router` constructor should be exposed')
    test.type(Ellipse.Request, 'function', '`Request` constructor should be exposed')
    test.type(Ellipse.Response, 'function', '`Response` constructor should be exposed')
    test.type(Ellipse.Context, 'function', '`Context` constructor should be exposed')
    test.equals(Ellipse.Application, Ellipse, '`Ellipse` should be re-exposed as `Application`')

    test.end()
})

test.test('prototypes', test => {
    test.type(Ellipse.router, 'object', '`Router` prototype should be exposed')
    test.type(Ellipse.request, 'object', '`Request` prototype should be exposed')
    test.type(Ellipse.response, 'object', '`Response` prototype should be exposed')
    test.type(Ellipse.context, 'object', '`Context` prototype should be exposed')
    test.type(Ellipse.application, 'object', '`Application` prototype should be exposed')

    test.end()
})

test.test('serialization', test => {
    const expected = {
        version: require('../package.json').version,
        Router: Ellipse.Router,
        router: '<Router prototype>',
        Context: Ellipse.Context,
        context: '<Context prototype>',
        Request: Ellipse.Request,
        request: '<Request prototype>',
        Response: Ellipse.Response,
        response: '<Response prototype>'
    }

    test.same(Ellipse.toJSON(), expected, 'json representation of main export should be correct')
    test.same(Ellipse.toJSON(), Ellipse.inspect(), '`toJSON()` and `inspect()` should be aliases')

    test.end()
})
