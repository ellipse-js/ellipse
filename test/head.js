'use strict'

const request = require('supertest'),
      test    = require('tap')

var app = require('..')()

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
        .expect(emptyResponse)
        .expect(200, '', err => {
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

function emptyResponse(res) {
    if (
        'content-length' in res.headers ||
        'content-type' in res.headers ||
        'content-encoding' in res.headers ||
        'transfer-encoding' in res.headers
    )
        throw new Error('content related headers should not be set on HEAD responses')
}
