'use strict'

var http    = require('http'),
    test    = require('tap'),
    request = require('supertest'),
    app     = require('../')()

app.get('/', function (next) {
    this.body = 'Hello World!'
    next()
})

request(app = app.listen())
    .get('/')
    .expect(200)
    .expect('content-length', '12')
    .expect('etag', 'W/"c-7Qdih1MuhjZehB6Sv8UNjA"')
    .expect('content-type', 'text/html; charset=utf-8')
    .expect('x-powered-by', 'Ellipse/' + require('../package.json').version)
    .end(function (err) {
        if (err)
            test.threw(err)
        else {
            test.pass('response received')
            app.close()
        }
    })
