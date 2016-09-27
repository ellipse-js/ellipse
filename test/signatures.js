'use strict'

const request  = require('supertest'),
      test     = require('tap'),
      Ellipse  = require('../'),
      Request  = Ellipse.Request,
      Response = Ellipse.Response,
      Context  = Ellipse.Context,
      isGen    = require('../lib/utils/isGenerator')

var app = new Ellipse()

// classic middleware

app.get('/cm/0', function () {
    test.type(this, Context, '`this` should be a Context instance')
    this.send()
})

app.get('/cm/1', function (next) {
    test.type(this, Context, '`this` should be a Context instance')
    test.type(next, 'function', '`next()` should be a method')
    this.send()
})

app.get('/cm/2', function (req, res) {
    test.type(this, Context, '`this` should be a Context instance')
    test.type(req, Request, '`req` should be a Request instance')
    test.type(res, Response, '`res` should be a Response instance')
    this.send()
})

app.get('/cm/3', function (req, res, next) {
    test.type(this, Context, '`this` should be a Context instance')
    test.type(req, Request, '`req` should be a Request instance')
    test.type(res, Response, '`res` should be a Response instance')
    test.type(next, 'function', '`next()` should be a method')
    this.send()
})

app.get('/cm/4', function (ctx, req, res, next) {
    test.type(this, Context, '`this` should be a Context instance')
    test.type(ctx, Context, '`ctx` should be a Context instance')
    test.type(req, Request, '`req` should be a Request instance')
    test.type(res, Response, '`res` should be a Response instance')
    test.type(next, 'function', '`next()` should be a method')
    this.send()
})

// generator middleware

app.get('/gm/0', function *() {
    test.type(this, Context, '`this` should be a Context instance')
    this.send()
})

app.get('/gm/1', function *(next) {
    test.type(this, Context, '`this` should be a Context instance')
    test.ok(isGen(next), '`next` should be a generator')
    this.send()
})

app.get('/gm/2', function *(ctx, next) {
    test.type(this, Context, '`this` should be a Context instance')
    test.type(ctx, Context, '`ctx` should be a Context instance')
    test.ok(isGen(next), '`next` should be a generator')
    this.send()
})

app.get('/gm/3', function *(req, res, next) {
    test.type(this, Context, '`this` should be a Context instance')
    test.type(req, Request, '`req` should be a Request instance')
    test.type(res, Response, '`res` should be a Response instance')
    test.ok(isGen(next), '`next` should be a generator')
    this.send()
})

app.get('/gm/4', function *(ctx, req, res, next) {
    test.type(this, Context, '`this` should be a Context instance')
    test.type(ctx, Context, '`ctx` should be a Context instance')
    test.type(req, Request, '`req` should be a Request instance')
    test.type(res, Response, '`res` should be a Response instance')
    test.ok(isGen(next), '`next` should be a generator')
    this.send()
})

// classic param processor

app.param('c0', function () {
    test.type(this, Context, '`this` should be a Context instance')
    this.next()
})

app.param('c1', function (value) {
    test.type(this, Context, '`this` should be a Context instance')
    test.equals(value, 't', '`value` should be passed')
    this.next()
})

app.param('c2', function (next, value) {
    test.type(this, Context, '`this` should be a Context instance')
    test.type(next, 'function', '`next()` should be a method')
    test.equals(value, 't', '`value` should be passed')
    this.next()
})

app.param('c3', function (ctx, next, value) {
    test.type(this, Context, '`this` should be a Context instance')
    test.type(ctx, Context, '`ctx` should be a Context instance')
    test.type(next, 'function', '`next()` should be a method')
    test.equals(value, 't', '`value` should be passed')
    this.next()
})

app.param('c4', function (req, res, next, value) {
    test.type(this, Context, '`this` should be a Context instance')
    test.type(req, Request, '`req` should be a Request instance')
    test.type(res, Response, '`res` should be a Response instance')
    test.type(next, 'function', '`next()` should be a method')
    test.equals(value, 't', '`value` should be passed')
    this.next()
})

app.param('c5', function (ctx, req, res, next, value) {
    test.type(this, Context, '`this` should be a Context instance')
    test.type(ctx, Context, '`ctx` should be a Context instance')
    test.type(req, Request, '`req` should be a Request instance')
    test.type(res, Response, '`res` should be a Response instance')
    test.type(next, 'function', '`next()` should be a method')
    test.equals(value, 't', '`value` should be passed')
    this.next()
})

app.get('/cp/:c0/:c1/:c2/:c3/:c4/:c5/', function () {
    this.send()
})

// generator param processor

app.param('g0', function *() {
    test.type(this, Context, '`this` should be a Context instance')
    yield *this.next
})

app.param('g1', function *(value) {
    test.type(this, Context, '`this` should be a Context instance')
    test.equals(value, 't', '`value` should be passed')
    yield *this.next
})

app.param('g2', function *(next, value) {
    test.type(this, Context, '`this` should be a Context instance')
    test.ok(isGen(next), '`next` should be a generator')
    test.equals(value, 't', '`value` should be passed')
    yield *next
})

app.param('g3', function *(ctx, next, value) {
    test.type(this, Context, '`this` should be a Context instance')
    test.type(ctx, Context, '`ctx` should be a Context instance')
    test.ok(isGen(next), '`next` should be a generator')
    test.equals(value, 't', '`value` should be passed')
    yield *next
})

app.param('g4', function *(req, res, next, value) {
    test.type(this, Context, '`this` should be a Context instance')
    test.type(req, Request, '`req` should be a Request instance')
    test.type(res, Response, '`res` should be a Response instance')
    test.ok(isGen(next), '`next` should be a generator')
    test.equals(value, 't', '`value` should be passed')
    yield *next
})

app.param('g5', function *(ctx, req, res, next, value) {
    test.type(this, Context, '`this` should be a Context instance')
    test.type(ctx, Context, '`ctx` should be a Context instance')
    test.type(req, Request, '`req` should be a Request instance')
    test.type(res, Response, '`res` should be a Response instance')
    test.ok(isGen(next), '`next` should be a generator')
    test.equals(value, 't', '`value` should be passed')
    yield *next
})

app.get('/gp/:g0/:g1/:g2/:g3/:g4/:g5/', function () {
    this.send()
})

// requests

app = app.listen()

test.plan(84)
test.tearDown(() => app.close())

get('/cm/0')
get('/cm/1')
get('/cm/2')
get('/cm/3')
get('/cm/4')
get('/gm/0')
get('/gm/1')
get('/gm/2')
get('/gm/3')
get('/gm/4')
get('/cp/t/t/t/t/t/t')
get('/gp/t/t/t/t/t/t')

function get(path) {
    request(app)
        .get(path)
        .expect(200, err => {
            if (err)
                test.threw(err)
            else
                test.pass('GET ' + path + ' succeeded')
        })
}
