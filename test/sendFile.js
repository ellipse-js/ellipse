'use strict'

// todo: test errors and multiple signatures

const fs      = require('fs'),
      http    = require('http'),
      request = require('supertest'),
      test    = require('tap'),
      text    = fs.readFileSync(__filename, 'utf8'),
      length  = Buffer.byteLength(text).toString()

var app = require('..')()

app.get('/1', (req, res) => {
    res.sendFile(__filename)
})

app.get('/2', (req, res) => {
    const calls = []
    res.on('finish', () => calls.push(1))
    res.sendFile(__filename, err => {
        calls.push(2)
        test.same(calls, [ 1, 2 ], 'response should be sent first (callback)')
    })
})

app.get('/3', function *(next) {
    const calls = []
    this.res.on('finish', () => calls.push(1))
    yield this.sendFile(__filename)
    calls.push(2)
    test.same(calls, [ 1, 2 ], 'response should be sent first (promise)')
})

app.get('/headers', (req, res) => {
    res.sendFile(__filename, {
        headers: {
            'x-test-1': 1,
            'x-test-2': 'test'
        }
    })
})

const error = app.mount('/error')

error.get('/basic', (req, res) => {
    res.sendFile('/non/existing').catch(err => {
        test.type(err, Error, 'an error should be passed back (catch)')
        test.equals(err.code, 'ENOENT', 'error should be ENOENT (catch)')
    })
})

error.get('/callback', (req, res) => {
    res.sendFile('/non/existing', err => {
        test.type(err, Error, 'an error should be passed back (callback)')
        test.equals(err.code, 'ENOENT', 'error should be ENOENT (callback)')
        res.status(404).send('error')
    })
})

error.get('/yield', function *(next) {
    try {
        yield this.sendFile('/non/existing')
    }
    catch (ex) {
        test.type(ex, Error, 'an error should be passed back (promise)')
        test.equals(ex.code, 'ENOENT', 'error should be ENOENT (promise)')
        this.status = 404
        this.send('error')
    }
})

error.get('/directory', (req, res) => {
    res.sendFile(__dirname, err => {
        test.type(err, Error, 'an error should be passed back (directory)')
        test.equals(err.code, 'EISDIR', 'error should be EISDIR (directory)')
        res.status(404)
        res.send('error')
    })
})

error.get('/abort', (req, res) => {
    res.sendFile(__filename, err => {
        test.type(err, Error, 'an error should be passed back (abort)')
        test.equals(err.code, 'ECONNABORTED', 'error should be ENOENT (abort)')
    })
    res.end()
})

test.plan(21)
app = app.listen()
test.tearDown(() => app.close())

get('/1')
get('/2')
get('/3')
get('/headers', [ 'x-test-1', 'x-test-2' ])
getError('/error/basic')
getError('/error/callback')
getError('/error/yield')
getError('/error/directory')
getErrorAbort('/error/abort')

function get(path, headers) {
    const req = request(app)
        .get(path)
        .expect(200)
        .expect('content-type', 'application/javascript')
        .expect('content-length', length)

    if (headers)
        headers.forEach(h => {
            req.expect(res => {
                if (!(h in res.headers))
                    throw new Error(h + ' header expected, but missing')
            })
        })

    req.expect(text, err => {
            if (err)
                test.threw(err)
            else
                test.pass('file received')
        })
}

function getError(path) {
    request(app)
        .get(path)
        .expect(404, err => {
            if (err)
                test.threw(err)
            else
                test.pass('error response received')
        })
}

function getErrorAbort(path) {
    request(app)
        .get(path)
        // 200, beacause the server doesn't have a chance to
        // change headers which are already sent
        .expect(200, err => {
            if (err)
                test.threw(err)
            else
                test.pass('abort response received')
        })
}
