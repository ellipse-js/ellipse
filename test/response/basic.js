'use strict'

const fs       = require('fs'),
      Readable = require('stream').Readable,
      file     = fs.readFileSync(__filename, 'utf8'),
      size     = Buffer.byteLength(file).toString(),
      request  = require('supertest'),
      test     = require('tap'),
      Ellipse  = require('../..'),
      app1     = new Ellipse({ env: 'production' }),
      app2     = new Ellipse,
      devApp   = new Ellipse({ env: 'development' })

app1.get('/', (req, res) => {
    test.type(res, Ellipse.Response, 'response object should be a Response instance')
    test.type(res.ctx, Ellipse.Context, 'req.ctx should be a Context instance')
    test.type(res.context, Ellipse.Context, 'req.context should be a Context instance')
    test.type(res.req, Ellipse.Request, 'req.req should be a Request instance')
    test.type(res.request, Ellipse.Request, 'req.request should be a Request instance')
    test.equals(res.app, app1, 'req.app should be an Application instance')
    test.equals(res.application, app1, 'req.applicatino should be an Application instance')

    test.equals(res.message, '', 'res.message should default to an empty string')
    res.message = 'hello world'
    test.equals(res.statusCode, 200, 'res.statusCode should default to 200')
    res.status(400)

    test.strictEquals(res.lastModified, undefined, 'res.lastModified should default to `undefined`')
    res.lastModified = new Date().toUTCString()
    test.type(res.lastModified, Date, 'res.lastModified should return a Date instance')
    const now = res.lastModified = new Date
    test.equals(res.lastModified.toUTCString(), now.toUTCString(), 'res.lastModified: previous value should be returned')

    test.strictEquals(res.etag, undefined, 'res.etag should default to undefined')
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
    res.set('x-test-5', 'test')
    res.remove('x-test-5')
    res.type('text/plain')
    res.type(null)

    const expected = {
        status: 400,
        message: 'hello world',
        headers: {
            'x-powered-by': 'Ellipse/' + require('../../package.json').version,
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

    test.throws(() => {
        res.status = 400
    }, /overwrite/, 'user should be warned when tries to use a method as a setter')

    res.send()
})

app1.head('/', (req, res) => res.send('ok'))

app1.get('/custom-length', (req, res) => {
    test.pass('custom body length')
    res.length = 2
    res.send('ok')
})

app1.get('/number', (req, res) => {
    test.pass('number body')
    res.body = 42
    res.send()
})

app1.get('/stream', (req, res) => {
    test.pass('stream body')
    res.body = fs.createReadStream(__filename)
    res.send()
})

app2.get('/stream-error', (req, res) => {
    res.body = stream()
})

app1.get('/buffer', (req, res) => {
    test.pass('buffer body')
    res.body = new Buffer('hello world')
    res.send()
})

app1.get('/bool', (req, res) => {
    test.pass('boolean body')
    res.body = true
    res.send()
})

app1.get('/stale', (req, res) => {
    test.pass('stale response')
    res.etag = 'test'
    res.send('ok')
})

app1.get('/html', (req, res) => {
    test.pass('html body')
    res.html('<h1>ok</h1>')
})

app1.get('/json1', (req, res) => {
    test.pass('json body')
    res.json({ hello: 'world' })
})

app1.get('/json2', (req, res) => {
    test.pass('json body as string')
    res.json('{  "hello" :"world"}')
})

devApp.get('/json', (req, res) => {
    test.pass('json response in development mode')
    res.json({ hello: 'world' })
})

app1.get('/redirect', (req, res) => {
    const url = req.query.url,
          alt = req.query.alt

    test.pass('redirect: ' + url + ' - ' + alt)
    res.redirect(url, alt)
})

app1.get('/attachment', (req, res) => {
    const path = req.query.path
    test.pass('attachment: ' + path)
    res.attachment(path)
    res.send()
})

app1.get('/download', (req, res) => {
    test.pass('download')
    res.download(__filename)
})

app1.get('/download-callback', (req, res) => {
    res.download('basic.js', ondownloadend)
})

app1.get('/download-options-callback', (req, res) => {
    res.download('basic', { extensions: 'js' }, ondownloadend)
})

app1.get('/set-cookie', (req, res) => {
    test.pass('set cookie')
    res.cookie('test', 'test')
    res.send('ok')
})

app1.get('/clear-cookie', (req, res) => {
    test.pass('clear cookie')
    res.clearCookie('test')
    res.send('ok')
})

function ondownloadend(err) {
    if (err)
        test.threw(err)
    else
        test.pass('download callback fired')
}

test.plan(41)
test.tearDown(() => {
    server1.close()
    server2.close()
    devServer.close()
})

const server1   = app1.listen(),
      server2   = app2.listen(),
      devServer = devApp.listen()

request(server1)
    .get('/')
    .expect('x-test-1', 'test1, test2, test3')
    .expect('x-test-2', 'test')
    .expect('x-test-3', 'test')
    .expect('x-test-4', 'test1, test2, test3, test4, test5')
    // after `res.type(null)`, it should be set back to default
    .expect('content-type', 'text/html; charset=utf-8')
    .expect(400, 'ok', onend)

request(server1)
    .head('/')
    .expect(emptyResponse)
    .expect(200, undefined, onend)

request(server1)
    .get('/custom-length')
    .expect('content-length', '2')
    .expect(200, 'ok', onend)

request(server1)
    .get('/number')
    .expect('content-length', '2')
    .expect(200, '42', onend)

request(server1)
    .get('/stream')
    .expect('content-type', 'application/octet-stream')
    .expect(res => {
        if ('content-length' in res.headers)
            throw new Error('content-length should not be set on stream responses')
    })
    .expect(200, file, onend)

request(server2)
    .get('/stream-error')
    .expect(500, onend)

request(server1)
    .get('/buffer')
    .expect('content-length', '11')
    .expect(200, 'hello world', onend)

request(server1)
    .get('/bool')
    .expect('content-length', '4')
    .expect(200, 'true', onend)

request(server1)
    .get('/stale')
    .set('if-none-match', '"test"')
    .expect(emptyResponse)
    .expect(304, '', onend)

request(server1)
    .get('/html')
    .expect('content-type', 'text/html; charset=utf-8')
    .expect(200, '<h1>ok</h1>', onend)

request(server1)
    .get('/json1')
    .expect('content-type', 'application/json; charset=utf-8')
    .expect(200, '{"hello":"world"}', onend)

request(server1)
    .get('/json2')
    .expect('content-type', 'application/json; charset=utf-8')
    .expect(200, '"{  \\"hello\\" :\\"world\\"}"', onend)

request(devServer)
    .get('/json')
    .expect('content-type', 'application/json; charset=utf-8')
    .expect(200, '{\n    "hello": "world"\n}', onend)

request(server1)
    .get('/redirect?url=/')
    .set('accept', 'text/plain')
    .expect('content-type', 'text/plain; charset=utf-8')
    .expect('location', '/')
    .expect(302, 'Found. Redirecting to /.', onend)

request(server1)
    .get('/redirect?url=/test')
    .set('accept', 'text/html')
    .expect('content-type', 'text/html; charset=utf-8')
    .expect('location', '/test')
    .expect(302, '<p>Found. Redirecting to <a href="/test">/test</a>.</p>', onend)

request(server1)
    .get('/redirect?url=back')
    .set('accept', 'text/plain')
    .expect('content-type', 'text/plain; charset=utf-8')
    .expect('location', '/')
    .expect(302, 'Found. Redirecting to /.', onend)

request(server1)
    .get('/redirect?url=back&alt=/test')
    .set('accept', 'text/plain')
    .expect('content-type', 'text/plain; charset=utf-8')
    .expect('location', '/test')
    .expect(302, 'Found. Redirecting to /test.', onend)

request(server1)
    .get('/redirect?url=back')
    .set('accept', 'text/plain')
    .set('referrer', '/test')
    .expect('content-type', 'text/plain; charset=utf-8')
    .expect('location', '/test')
    .expect(302, 'Found. Redirecting to /test.', onend)

request(server1)
    .get('/attachment')
    .expect('content-disposition', 'attachment')
    .expect(200, '', onend)

request(server1)
    .get('/attachment?path=' + __filename)
    .expect('content-disposition', 'attachment; filename="basic.js"')
    .expect(200, '', onend)

request(server1)
    .get('/download')
    .expect('content-type', 'application/javascript; charset=utf-8')
    .expect('content-length', size)
    .expect('content-disposition', 'attachment; filename="basic.js"')
    .expect(200, file, onend)

request(server1)
    .get('/download-callback')
    .expect('content-type', 'application/javascript; charset=utf-8')
    .expect('content-length', size)
    .expect('content-disposition', 'attachment; filename="basic.js"')
    .expect(200, file, onend)

request(server1)
    .get('/download-options-callback')
    .expect('content-type', 'application/javascript')
    .expect('content-length', size)
    .expect('content-disposition', 'attachment; filename="basic"')
    .expect(200, file, onend)

request(server1)
    .get('/set-cookie')
    .expect('set-cookie', 'test=test; path=/; httponly')
    .expect(200, 'ok', onend)

request(server1)
    .get('/clear-cookie')
    .expect('set-cookie', 'test=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly')
    .expect(200, 'ok', onend)

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

function stream() {
    return new Readable({ read: onread })
}

function onread() {
    this.emit('error', new Error('test'))
}
