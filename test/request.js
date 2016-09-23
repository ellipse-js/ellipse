'use strict'

var AE      = require('assert').AssertionError,
    test    = require('tap'),
    request = require('supertest'),
    Ellipse = require('../'),
    app     = new Ellipse

test.plan(31)

app.get('/test', function (req, res, next) {
    test.type(req, Ellipse.Request, 'request object should be a Request instance')
    test.type(req.ctx, Ellipse.Context, 'req.ctx should be a Context instance')
    test.type(req.context, Ellipse.Context, 'req.context should be a Context instance')
    test.type(req.res, Ellipse.Response, 'req.res should be a Response instance')
    test.type(req.response, Ellipse.Response, 'req.response should be a Response instance')

    test.equal(req.pathLength, 5, 'req.pathLength should not count search string')
    test.equal(req.path, '/test', 'req.path should not contain search string')
    test.type(req.accept, 'object', '`accept` should be exposed')
    test.same(req.accept.type(), [ 'application/json', '*/*' ], '`accept` header should be extracted from request headers')

    test.doesNotThrow(function () {
        req.path = '/test2'
    }, 'req.path should be changeable')
    test.equals(req.path, '/test2', 'req.path should be overridden')
    test.equals(req.url, '/test2?test=test', 'req.url should be updated')

    test.equals(req.querystring, 'test=test', 'req.querystring should be extracted from url')
    test.doesNotThrow(function () {
        req.querystring = '?foo=bar'
    }, 'req.querystring should be changeable')
    test.doesNotThrow(function () {
        req.querystring = 'foo=bar'
    }, 'req.querystring: question mark should not be required')
    test.throws(function () {
        req.querystring = true
    }, AE, 'req.querystring should be asserted')
    test.equals(req.querystring, 'foo=bar', 'req.querystring should be preserved')
    test.equals(req.url, '/test2?foo=bar', 'req.url should be updated')

    test.same(req.query, { foo: 'bar' }, 'req.query should be parsed')
    test.doesNotThrow(function () {
        req.query = { test: 'test' }
    }, 'req.query should be changeable')
    test.throws(function () {
        req.query = true
    }, AE, 'req.query should be asserted')
    test.same(req.query, { test: 'test' }, 'req.query should be preserved')
    test.equals(req.url, '/test2?test=test', 'req.url should be updated')

    test.equals(req.search, '?test=test', 'req.search should be extracted from url')
    test.doesNotThrow(function () {
        req.search = '?hello=world'
    }, 'req.serach should be changeable')
    test.doesNotThrow(function () {
        req.search = 'hello=world'
    }, 'req.serach: question mark should be optional')
    test.throws(function () {
        req.search = true
    }, 'req.search should be asserted')
    test.same(req.query, { hello: 'world' }, 'req.query should be updated')
    test.same(req.search, '?hello=world', 'req.search should be updated')
    test.same(req.querystring, 'hello=world', 'req.querystring should be updated')
    test.equals(req.url, '/test2?hello=world', 'req.url should be updated')

    res.send()
})

test.tearDown(function () {
    app.close()
})

request(app = app.listen())
    .get('/test?test=test')
    .set('accept', 'application/json, */*')
    .expect(200)
    .end(function (err) {
        if (err)
            test.threw(err)
    })
