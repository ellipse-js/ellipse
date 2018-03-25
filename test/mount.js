'use strict'

const test    = require('tap'),
      request = require('supertest')

var app = require('..')()

test.plan(2)

app.use('/1/*', ctx => {
    test.equal(ctx.url, 'foo', 'route should be mounted')
    ctx.body = 'ok'
    ctx.send()
})

app.mount('/2').get('/:test', ctx => {
    test.equal(ctx.url, '/bar', 'route should be mounted')
    ctx.body = 'ok'
    ctx.send()
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
