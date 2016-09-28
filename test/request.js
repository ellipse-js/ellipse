'use strict'

// for https testing
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

const fs      = require('fs'),
      os      = require('os'),
      dns     = require('dns'),
      AE      = require('assert').AssertionError,
      join    = require('path').join,
      https   = require('https'),
      test    = require('tap'),
      request = require('supertest'),
      Ellipse = require('..')

var app1 = new Ellipse,
    app2 = new Ellipse

test.plan(65)

app1.post('/test', (req, res, next) => {
    test.type(req, Ellipse.Request, 'request object should be a Request instance')
    test.type(req.ctx, Ellipse.Context, 'req.ctx should be a Context instance')
    test.type(req.context, Ellipse.Context, 'req.context should be a Context instance')
    test.type(req.res, Ellipse.Response, 'req.res should be a Response instance')
    test.type(req.response, Ellipse.Response, 'req.response should be a Response instance')

    var body = ''
    req.setEncoding('utf8')
    req.on('data', data => body += data)
    req.on('end', () => test.equals(body, 'test', 'request body should be received'))

    test.equals(req.type, 'text/plain', 'content type should be detected')
    test.equals(req.length, 4, 'content length should be detected')
    req.length = 42
    test.equals(req.length, 42, 'content length should have a setter')
    test.equals(req.get('x-test'), 'test', 'headers should be accessible via `req.get()`')
    test.equals(req.get('absent'), '', 'getting an absent header should return an empty string')

    test.equal(req.pathLength, 5, 'req.pathLength should not count search string')
    test.equal(req.path, '/test', 'req.path should not contain search string')
    test.type(req.accept, 'object', '`accept` should be exposed')
    test.same(req.accept.type(), [ 'application/json', '*/*' ], '`accept` header should be extracted from request headers')

    test.doesNotThrow(() => {
        req.path = '/test2'
    }, 'req.path should be changeable')
    test.equals(req.path, '/test2', 'req.path should be overridden')
    test.equals(req.url, '/test2?test=test', 'req.url should be updated')

    test.equals(req.querystring, 'test=test', 'req.querystring should be extracted from url')
    test.doesNotThrow(() => {
        req.querystring = '?foo=bar'
    }, 'req.querystring should be changeable')
    test.doesNotThrow(() => {
        req.querystring = 'foo=bar'
    }, 'req.querystring: question mark should not be required')
    test.throws(() => {
        req.querystring = true
    }, AE, 'req.querystring should be asserted')
    test.equals(req.querystring, 'foo=bar', 'req.querystring should be preserved')
    test.equals(req.url, '/test2?foo=bar', 'req.url should be updated')

    test.same(req.query, { foo: 'bar' }, 'req.query should be parsed')
    test.doesNotThrow(() => {
        req.query = { test: 'test' }
    }, 'req.query should be changeable')
    test.throws(() => {
        req.query = true
    }, AE, 'req.query should be asserted')
    test.same(req.query, { test: 'test' }, 'req.query should be preserved')
    test.equals(req.url, '/test2?test=test', 'req.url should be updated')

    test.equals(req.search, '?test=test', 'req.search should be extracted from url')
    test.doesNotThrow(() => {
        req.search = '?hello=world'
    }, 'req.serach should be changeable')
    test.doesNotThrow(() => {
        req.search = 'hello=world'
    }, 'req.serach: question mark should be optional')
    test.throws(() => {
        req.search = true
    }, 'req.search should be asserted')
    test.same(req.query, { hello: 'world' }, 'req.query should be updated')
    test.same(req.search, '?hello=world', 'req.search should be updated')
    test.same(req.querystring, 'hello=world', 'req.querystring should be updated')
    test.equals(req.url, '/test2?hello=world', 'req.url should be updated')
    test.equals(req.protocol, 'http', 'http protocol should be detected')
    test.match(req.ip, /127\.0\.0\.1/, 'req.ip should be localhost')
    test.same(req.ips, [], 'req.ips should be an empty array when `app.proxy` is false')

    const hostname   = '127.0.0.1',
          host       = hostname + ':' + app1.address().port,
          subdomains = req.subdomains

    test.equals(req.host, host, 'req.host should be recognised')
    test.equals(req.hostname, hostname, 'req.hostname should be recognised')
    test.equals(req.origin, 'http://' + host, 'req.origin should be recognised')
    test.equals(req.href, 'http://' + host + '/test?test=test', 'req.href should be recognised')
    test.same(subdomains, [ '0', '127' ], 'req.subdomains should be recognised')
    test.strictEquals(req.subdomains, subdomains, 'req.subdomains should be cached')

    test.equals(req.is(), 'text/plain', 'request type should be recognised')
    test.equals(req.is('text'), 'text', 'request type should be recognised')
    test.equals(req.is([ 'json', 'text' ]), 'text', 'req.is() should accept an array as well')
    test.notEquals(req.is('json'), 'json', 'request type should be recognised')
    test.equals(req.accepts('json'), 'json', '`accept` header should be recognised')
    test.equals(req.acceptsCharsets('utf8'), 'utf8', '`accept-charset` header should be recognised')
    test.equals(req.acceptsEncodings('gzip'), 'gzip', '`accept-encoding` header should be recognised')
    test.equals(req.acceptsLanguages('en'), 'en', '`accept-language` header should be recognised')

    res.json({ test: 'test' })
})

app1.get('/default', (req, res) => {
    test.strictEquals(req.type, '', 'req.type should default to `undefined`')
    test.strictEquals(req.length, undefined, 'req.length should default to `undefined`')
    res.send('ok')
})

app1.get('/fresh/1', (req, res) => {
    res.status(304)
    test.notOk(req.fresh, 'req.fresh should be falsy if status code is 304')
    test.not(req.stale, 'req.stale should be truthy if status code is 304')
    res.send('ok')
})

app1.get('/fresh/2', (req, res) => {
    res.status(404)
    test.notOk(req.fresh, 'req.fresh should be falsy if status code is 404')
    test.not(req.stale, 'req.stale should be truthy if status code is 404')
    res.send('ok')
})

app1.get('/xhr', (req, res) => {
    test.ok(req.xhr, 'XHR requests should be detected')
    res.send('ok')
})

app1.get('/serialize', (req, res) => {
    const expected = {
        method: 'GET',
        url: '/serialize',
        headers: req.headers
    }
    test.same(req.toJSON(), expected, 'req json representation should be correct')
    test.same(req.toJSON(), req.inspect(), '`inspect()` should be an alias for `toJSON()`')
    res.send('ok')
})

app2.get('/test', (req, res) => {
    test.equals(req.protocol, 'https', 'https prtocol should be detected')
    test.ok(req.secure, 'request should be considered as secure')
    res.send('ok')
})

test.tearDown(() => {
    app1.close()
    app2.close()
})

request(app1 = app1.listen())
    .post('/test?test=test')
    .set('accept', 'application/json, */*')
    .set('accept-charset', 'utf8')
    .set('accept-encoding', 'gzip')
    .set('accept-language', 'en')
    .set('content-type', 'text/plain')
    .set('content-length', 4)
    .set('x-test', 'test')
    .send('test')
    .expect(200)
    .expect({ test: 'test' }, onend)

request(app1)
    .get('/default')
    .expect(200, onend)

request(app1)
    .get('/xhr')
    .set('x-requested-with', 'XMLHttpRequest')
    .expect(200, onend)

request(app1)
    .get('/serialize')
    .expect(200, onend)

request(app1)
    .get('/fresh/1')
    .expect(304, onend)

request(app1)
    .get('/fresh/2')
    .expect(404, onend)

app2 = https.createServer({
    key:  fs.readFileSync(join(__dirname, 'test.key')),
    cert: fs.readFileSync(join(__dirname, 'test.crt')),
    passphrase: 'test'
}, app2.callback())

request(app2 = app2.listen())
    .get('/test')
    .expect(200)
    .expect('ok', onend)

function onend(err) {
    if (err)
        test.threw(err)
}
