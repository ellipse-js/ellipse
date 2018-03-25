'use strict'

const request = require('supertest'),
      test    = require('tap')

let app = require('..')()

const delegate = app
    .route('/')
    .use((ctx, next) => {
        ctx.body = 'o'
        next()
    })
    .get(handler)
    .all(handler)

test.plan(4)
test.tearDown(() => app.close())

test.same(delegate.toJSON(), { path: '/' }, 'json representation of delegate should be correct')
test.same(delegate.toJSON(), delegate.inspect(), '`inspect()` and `toJSON()` should return the same result')

app = app.listen()

request(app)
    .get('/')
    .expect(200, 'ok', onend)

request(app)
    .post('/')
    .expect(200, 'ok', onend)

function handler() {
    this.body += 'k'
    this.send()
}

function onend(err) {
    if (err)
        test.threw(err)
    else
        test.pass('expected result received')
}
