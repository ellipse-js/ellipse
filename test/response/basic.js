'use strict'

const fs       = require('fs'),
      Readable = require('stream').Readable,
      test     = require('tap'),
      helpers  = require('../helpers'),
      end      = helpers.end,
      create   = helpers.create,
      request  = helpers.request,
      Ellipse  = require('../..')

test.plan(3)

test.test('in production mode', test => {
    test.plan(42)

    const app   = create({ env: 'production' }),
          onend = end(test, 24),
          file  = fs.readFileSync(__filename, 'utf8'),
          size  = Buffer.byteLength(file).toString()

    function ondownloadend(err) {
        if (err)
            test.threw(err)
        else
            test.pass('download callback fired')
    }

    function emptyResponse(res) {
        if (
            'content-length' in res.headers ||
            'content-type' in res.headers ||
            'content-encoding' in res.headers ||
            'transfer-encoding' in res.headers
        )
            throw new Error('content related headers should not be set responses')
    }

    app.get('/', ctx => {
        const res = ctx.res

        test.type(res, Ellipse.Response, 'response object should be a Response instance')
        test.type(res.ctx, Ellipse.Context, 'req.ctx should be a Context instance')
        test.type(res.context, Ellipse.Context, 'req.context should be a Context instance')
        test.type(res.req, Ellipse.Request, 'req.req should be a Request instance')
        test.type(res.request, Ellipse.Request, 'req.request should be a Request instance')
        test.equals(res.app, app, 'req.app should be an Application instance')
        test.equals(res.application, app, 'req.application should be an Application instance')

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

    app.head('/', ctx => ctx.send('ok'))

    app.get('/custom-length', ctx => {
        test.pass('custom body length')
        ctx.length = 2
        ctx.send('ok')
    })

    app.get('/remove-length', ctx => {
        ctx.length = 2
        ctx.length = null
        test.equals(ctx.get('content-length'), '', 'content-length header should be removed')
        ctx.send('ok')
    })

    app.get('/number', ctx => {
        test.pass('number body')
        ctx.body = 42
        ctx.send()
    })

    app.get('/stream', ctx => {
        test.pass('stream body')
        ctx.body = fs.createReadStream(__filename)
        ctx.send()
    })

    app.get('/buffer', ctx => {
        test.pass('buffer body')
        ctx.body = Buffer.from('hello world')
        ctx.send()
    })

    app.get('/bool', ctx => {
        test.pass('boolean body')
        ctx.body = true
        ctx.send()
    })

    app.get('/stale', ctx => {
        test.pass('stale response')
        ctx.etag = 'test'
        ctx.send('ok')
    })

    app.get('/html', ctx => {
        test.pass('html body')
        ctx.res.html('<h1>ok</h1>')
    })

    app.get('/json1', ctx => {
        test.pass('json body')
        ctx.res.json({ hello: 'world' })
    })

    app.get('/json2', ctx => {
        test.pass('json body as string')
        ctx.res.json('{  "hello" :"world"}')
    })

    app.get('/redirect', ctx => {
        const url = ctx.query.url,
            alt = ctx.query.alt

        test.pass('redirect: ' + url + ' - ' + alt)
        ctx.redirect(url, alt)
    })

    app.get('/attachment', ctx => {
        const path = ctx.query.path
        test.pass('attachment: ' + path)
        ctx.attachment(path)
        ctx.send()
    })

    app.get('/download', ctx => {
        test.pass('download')
        ctx.download(__filename)
    })

    app.get('/download-callback', ctx => {
        ctx.download('basic.js', ondownloadend)
    })

    app.get('/download-options-callback', ctx => {
        ctx.download('basic', { extensions: 'js' }, ondownloadend)
    })

    app.get('/set-cookie', ctx => {
        test.pass('set cookie')
        ctx.cookies.set('test', 'test')
        ctx.send('ok')
    })

    app.get('/clear-cookie', ctx => {
        test.pass('clear cookie')
        ctx.res.clearCookie('test')
        ctx.send('ok')
    })

    request(app)
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
        .expect('content-length', '2')
        .expect(200, undefined, onend)

    request(app)
        .get('/custom-length')
        .expect('content-length', '2')
        .expect(200, 'ok', onend)

    request(app)
        .get('/remove-length')
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
        .expect(200, Buffer.from(file), onend)

    request(app)
        .get('/buffer')
        .expect('content-length', '11')
        .expect(200, Buffer.from('hello world'), onend)

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

    request(app)
        .get('/json1')
        .expect('content-type', 'application/json; charset=utf-8')
        .expect(200, '{"hello":"world"}', onend)

    request(app)
        .get('/json2')
        .expect('content-type', 'application/json; charset=utf-8')
        .expect(200, '"{  \\"hello\\" :\\"world\\"}"', onend)

    request(app)
        .get('/redirect?url=/')
        .set('accept', 'text/plain')
        .expect('content-type', 'text/plain; charset=utf-8')
        .expect('location', '/')
        .expect(302, 'Found. Redirecting to /.', onend)

    request(app)
        .get('/redirect?url=/test')
        .set('accept', 'text/html')
        .expect('content-type', 'text/html; charset=utf-8')
        .expect('location', '/test')
        .expect(302, '<p>Found. Redirecting to <a href="/test">/test</a>.</p>', onend)

    request(app)
        .get('/redirect?url=back')
        .set('accept', 'text/plain')
        .expect('content-type', 'text/plain; charset=utf-8')
        .expect('location', '/')
        .expect(302, 'Found. Redirecting to /.', onend)

    request(app)
        .get('/redirect?url=back&alt=/test')
        .set('accept', 'text/plain')
        .expect('content-type', 'text/plain; charset=utf-8')
        .expect('location', '/test')
        .expect(302, 'Found. Redirecting to /test.', onend)

    request(app)
        .get('/redirect?url=back')
        .set('accept', 'text/plain')
        .set('referrer', '/test')
        .expect('content-type', 'text/plain; charset=utf-8')
        .expect('location', '/test')
        .expect(302, 'Found. Redirecting to /test.', onend)

    request(app)
        .get('/attachment')
        .expect('content-disposition', 'attachment')
        .expect(200, '', onend)

    request(app)
        .get('/attachment?path=' + __filename)
        .expect('content-disposition', 'attachment; filename="basic.js"')
        .expect(200, '', onend)

    request(app)
        .get('/download')
        .expect('content-type', 'application/javascript; charset=UTF-8')
        .expect('content-length', size)
        .expect('content-disposition', 'attachment; filename="basic.js"')
        .expect(200, file, onend)

    request(app)
        .get('/download-callback')
        .expect('content-type', 'application/javascript; charset=UTF-8')
        .expect('content-length', size)
        .expect('content-disposition', 'attachment; filename="basic.js"')
        .expect(200, file, onend)

    request(app)
        .get('/download-options-callback')
        .expect('content-type', 'application/javascript; charset=UTF-8')
        .expect('content-length', size)
        .expect('content-disposition', 'attachment; filename="basic"')
        .expect(200, file, onend)

    request(app)
        .get('/set-cookie')
        .expect('set-cookie', 'test=test; path=/; httponly')
        .expect(200, 'ok', onend)

    request(app)
        .get('/clear-cookie')
        .expect('set-cookie', 'test=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly')
        .expect(200, 'ok', onend)
})

test.test('stream error', test => {
    test.plan(1)

    const app = create()

    app.get('/stream-error', ctx => {
        ctx.body = new Readable({
            read() {
                this.emit('error', new Error('test'))
            }
        })
        ctx.send()
    })

    request(app)
        .get('/stream-error')
        .expect(500, end(test))
})

test.test('in development mode', test => {
    test.plan(2)

    const app = create({ env: 'development' })

    app.get('/json', ctx => {
        test.pass('json response in development mode')
        ctx.res.json({ hello: 'world' })
    })

    request(app)
        .get('/json')
        .expect('content-type', 'application/json; charset=utf-8')
        .expect(200, '{\n    "hello": "world"\n}', end(test))
})
