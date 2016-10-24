'use strict'

const request = require('supertest'),
      test    = require('tap'),
      app     = require('..')(),
      server  = app.listen()

test.plan(3)

app.get('/', (req, res, next) => {
    res.body = 'Hello World!'
    res.contentType('txt')

    res.set('X-Test', 'test')
    test.equals(res.get('X-test'), 'test', 'custom header should present')

    res.remove('x-Test')
    test.notOk(res.get('x-test'), 'custom header should not present')

    // test header(object)
    res.header({
        'x-test':   'test',
        'X-test-2': 'test2',
        'x-Test-3': 'test3'
    })
    // test remove(array)
    res.remove([ 'X-Test-2', 'X-Test-3' ])

    next()
})

request(server)
    .get('/')
    .expect('x-test', 'test')
    .expect(noHeader('x-test-2'))
    .expect(noHeader('x-test-3'))
    .expect('content-length', '12')
    .expect('etag', 'W/"c-7Qdih1MuhjZehB6Sv8UNjA"')
    .expect('content-type', 'text/plain; charset=utf-8')
    .expect('x-powered-by', 'Ellipse/' + require('../package.json').version)
    .expect(200, 'Hello World!', err => {
        if (err)
            test.threw(err)
        else {
            test.pass('response received')
            server.close()
        }
    })

function noHeader(field) {
    return res => {
        if (field in res.headers)
            throw new Error(field + ' header should be removed')
    }
}
