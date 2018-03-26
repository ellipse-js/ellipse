'use strict'

const test    = require('tap'),
      helpers = require('./helpers'),
      end     = helpers.end,
      create  = helpers.create,
      request = helpers.request,
      app     = create(),
      onend   = end(test, 2)

test.plan(1)

app.get('/', (req, res) => {
    test.fail('GET handler should not be executed')
    res.send()
})
app.head('/', handler)
app.get('/fallback', handler)

head('/')
head('/fallback')

function head(path) {
    request(app)
        .head(path)
        .expect('content-length', '4')
        .expect('content-type', 'text/html; charset=utf-8')
        .expect(200, undefined, onend)
}

function handler(ctx) {
    ctx.body = 'test'
    ctx.send()
}
