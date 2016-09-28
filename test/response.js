'use strict'

const fs      = require('fs'),
      file    = fs.readFileSync(__filename, 'utf8'),
      request = require('supertest'),
      test    = require('tap'),
      Ellipse = require('..')

var app = new Ellipse

app.get('/', (req, res) => {
    test.type(res, Ellipse.Response, 'response object should be a Response instance')
    test.type(res.ctx, Ellipse.Context, 'req.ctx should be a Context instance')
    test.type(res.context, Ellipse.Context, 'req.context should be a Context instance')
    test.type(res.req, Ellipse.Request, 'req.req should be a Request instance')
    test.type(res.request, Ellipse.Request, 'req.request should be a Request instance')

    test.equals(res.message, '', 'res.message should default to an empty string')
    res.message = 'hello world'
    test.equals(res.statusCode, 200, 'res.statusCode should default to 200')
    res.statusCode = 400

    test.strictEquals(res.lastModified, undefined, 'res.lastModified should default to `undefined`')
    res.lastModified = new Date().toUTCString()
    test.type(res.lastModified, Date, 'res.lastModified should return a Date instance')
    const now = res.lastModified = new Date
    test.equals(res.lastModified.toUTCString(), now.toUTCString(), 'res.lastModified: previous value should be returned')

    test.strictEquals(res.etag, '', 'res.etag should default to an empty string')
    res.etag = 'test'
    test.equals(res.etag, '"test"', 'res.etag should be quoted')
    res.etag = '"test2"'
    test.equals(res.etag, '"test2"', 'res.etag should not be touched')

    res.set('x-test-1', 'test1')
    res.set({
        'x-test-2': 'test',
        'x-test-3': 'test'
    })
    // add multiple items to a single (converted to an array)
    res.append('x-test-1', [ 'test2', 'test3' ])
    // just set
    res.append('x-test-4', 'test1')
    // first real append (converted to array)
    res.append('x-test-4', 'test2')
    // add single item to that array
    res.append('x-test-4', 'test3')
    // add multiple items to that array
    res.append('x-test-4', [ 'test4', 'test5' ])
    res.type('text/plain')
    res.type(null)
    const expected = {
        status: 400,
        message: 'hello world',
        headers: {
            'x-powered-by': 'Ellipse/' + require('../package.json').version,
            'last-modified': now.toUTCString(),
            etag: '"test2"',
            'x-test-1': [ 'test1', 'test2', 'test3' ],
            'x-test-2': 'test',
            'x-test-3': 'test',
            'x-test-4': [ 'test1', 'test2', 'test3', 'test4', 'test5' ]
        }
    }
    test.same(res.toJSON(), expected, 'json representation should be correct')
    res.body = 'ok'
    expected.body = 'ok'
    test.same(res.toJSON(), expected, 'json representation should be correct')
    test.same(res.toJSON(), res.inspect(), '`toJSON()` and `inspect()` should be alises')

    res.send()
})

app.head('/', (req, res) => res.send('ok'))

app.get('/custom-length', (req, res) => {
    test.pass('custom body length')
    res.length = 2
    res.send('ok')
})

app.get('/number', (req, res) => {
    test.pass('number body')
    res.body = 42
    res.send()
})

app.get('/stream', (req, res) => {
    test.pass('stream body')
    res.body = fs.createReadStream(__filename)
    res.send()
})

app.get('/buffer', (req, res) => {
    test.pass('buffer body')
    res.body = new Buffer('hello world')
    res.send()
})

app.get('/bool', (req, res) => {
    test.pass('boolean body')
    res.body = true
    res.send()
})

app.get('/stale', (req, res) => {
    test.pass('stale response')
    res.etag = 'test'
    res.send('ok')
})

app.get('/html', (req, res) => {
    test.pass('html body')
    res.html('<h1>ok</h1>')
})

test.plan(23)
test.tearDown(() => app.close())

request(app = app.listen())
    .get('/')
    .expect('x-test-1', 'test1, test2, test3')
    .expect('x-test-2', 'test')
    .expect('x-test-3', 'test')
    .expect('x-test-4', 'test1, test2, test3, test4, test5')
    // after `res.type(null)`, it should be set back to default
    .expect('content-type', 'text/html; charset=utf-8')
    .expect(400, 'ok', onend)

request(app)
    .head('/')
    .expect(emptyResponse)
    .expect(200, '', onend)

request(app)
    .get('/custom-length')
    .expect('content-length', '2')
    .expect(200, 'ok', onend)

request(app)
    .get('/number')
    .expect('content-length', '2')
    .expect(200, '42', onend)

request(app)
    .get('/stream')
    .expect('content-type', 'application/octet-stream')
    .expect(res => {
        if ('content-length' in res.headers)
            throw new Error('content-length should not be set on stream responses')
    })
    .expect(200, file, onend)

request(app)
    .get('/buffer')
    .expect('content-length', '11')
    .expect(200, 'hello world', onend)

request(app)
    .get('/bool')
    .expect('content-length', '4')
    .expect(200, 'true', onend)

request(app)
    .get('/stale')
    .set('if-none-match', '"test"')
    .expect(emptyResponse)
    .expect(304, '', onend)

request(app)
    .get('/html')
    .expect('content-type', 'text/html; charset=utf-8')
    .expect(200, '<h1>ok</h1>', onend)

function emptyResponse(res) {
    if (
        'content-length' in res.headers ||
        'content-type' in res.headers ||
        'content-encoding' in res.headers ||
        'transfer-encoding' in res.headers
    )
        throw new Error('content related headers should not be set on HEAD responses')
}

function onend(err) {
    if (err)
        test.threw(err)
}
