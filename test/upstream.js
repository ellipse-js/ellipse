'use strict'

const test    = require('tap'),
      request = require('supertest'),
      Ellipse = require('..'),
      result  = []

var app = new Ellipse({ upstream: true })

function done(n) {
    return () => result.push(n)
}

app.use(next => {
    result.push(1)
    next().then(done(26))
})

app.use(next => {
    result.push(2)
    next().then(done(25))
})

app.use(function *(next) {
    result.push(3)
    yield *next
    result.push(24)
})

app.use(function *(next) {
    result.push(4)
    yield *next
    result.push(23)
})

app.param('test', (next, value) => {
    result.push(5)
    next().then(done(22))
})

app.get('/:test',
    next => {
        result.push(6)
        next().then(done(21))
    },
    next => {
        result.push(7)
        next().then(done(20))
    },
    function *(next) {
        result.push(8)
        yield *next
        result.push(19)
    },
    function *(next) {
        result.push(9)
        yield *next
        result.push(18)
    },
    next => {
        result.push(10)
        next().then(done(17))
    },
    function *(next) {
        result.push(11)
        this.body = 'ok'
        yield *next
        result.push(16)
    }
)

const sub = new Ellipse.Router
app.use(sub)

sub.use(next => {
    result.push(12)
    next().then(done(15))
})

sub.use(function *(next) {
    this.body = 'ok'
    result.push(13)
    yield *next
    result.push(14)
})

test.plan(1)

request(app = app.listen())
    .get('/test')
    .expect(200, err => {
        if (err)
            throw err
        else {
            const expected = [
                1,  2,  3,  4,
                5,  6,  7,  8,
                9,  10, 11, 12,
                13, 14, 15, 16,
                17, 18, 19, 20,
                21, 22, 23, 24,
                25, 26
            ]
            test.same(result, expected, 'control should flow as expected')
            app.close()
        }
    })
