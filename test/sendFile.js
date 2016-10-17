'use strict'

// todo: test errors and multiple signatures

const fs      = require('fs'),
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

const error = app.mount('/error')

error.get('/1', (req, res) => {
    res.sendFile('/non/existing').catch(err => {
        test.type(err, Error, 'an error should be passed back (catch)')
        test.equals(err.code, 'ENOENT', 'error should be ENOENT (catch)')
    })
})

error.get('/2', (req, res) => {
    res.sendFile('/non/existing', err => {
        test.type(err, Error, 'an error should be passed back (callback)')
        test.equals(err.code, 'ENOENT', 'error should be ENOENT (callback)')
        res.status(404).send('error')
    })
})

error.get('/3', function *(next) {
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

test.plan(14)

app = app.listen()

test.tearDown(() => app.close())

get('/1')
get('/2')
get('/3')
getError('/error/1')
getError('/error/2')
getError('/error/3')

function get(path) {
    request(app)
        .get(path)
        .expect(200)
        .expect('content-type', 'application/javascript')
        .expect('content-length', length)
        .expect(text, err => {
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
