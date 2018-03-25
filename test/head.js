'use strict'

const request = require('supertest'),
      test    = require('tap')

let app = require('..')()

app.get('/', (req, res) => {
    test.fail('GET handler should not be executed')
    res.send()
})
app.head('/', handler)
app.get('/fallback', handler)

test.plan(2)
test.tearDown(() => app.close())

app = app.listen()
head('/')
head('/fallback')

function head(path) {
    request(app)
        .head(path)
        .expect('content-length', '4')
        .expect('content-type', 'text/html; charset=utf-8')
        .expect(200, undefined, err => {
            if (err)
                test.threw(err)
            else
                test.pass('expected result received')
        })
}

function handler() {
    this.body = 'test'
    this.send()
}
