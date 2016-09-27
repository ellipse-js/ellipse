'use strict'

const test    = require('tap'),
      request = require('supertest')

var app = require('../')()

test.plan(2)

app.use('/1/*', (req, res, next) => {
    test.equal(req.url, 'foo', 'route should be mounted')
    res.body = 'ok'
    next()
})

app.mount('/2').get('/:test', function *(next) {
    test.equal(this.url, '/bar', 'route should be mounted')
    this.body = 'ok'
    yield *next
})

request(app = app.listen())
    .get('/1/foo')
    .expect(200)
    .end(onend)

request(app)
    .get('/2/bar')
    .expect(200)
    .end(onend)

function onend(err) {
    if (err)
        test.threw(err)
}

test.tearDown(() => app.close())
