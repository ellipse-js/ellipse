'use strict'

const test    = require('tap'),
      request = require('supertest'),
      Ellipse = require('../'),
      res     = []

var app = new Ellipse({ upstream: true })

function done(n) {
    return function () {
        res.push(n)
    }
}

app.use(function (next) {
    res.push(1)
    next().then(done(26))
})

app.use(function (next) {
    res.push(2)
    next().then(done(25))
})

app.use(function *(next) {
    res.push(3)
    yield *next
    res.push(24)
})

app.use(function *(next) {
    res.push(4)
    yield *next
    res.push(23)
})

app.param('test', function (next, value) {
    res.push(5)
    next().then(done(22))
})

app.get('/:test',
    function (next) {
        res.push(6)
        next().then(done(21))
    },
    function (next) {
        res.push(7)
        next().then(done(20))
    },
    function *(next) {
        res.push(8)
        yield *next
        res.push(19)
    },
    function *(next) {
        res.push(9)
        yield *next
        res.push(18)
    },
    function (next) {
        res.push(10)
        next().then(done(17))
    },
    function *(next) {
        res.push(11)
        this.body = 'ok'
        yield *next
        res.push(16)
    }
)

const sub = new Ellipse.Router
app.use(sub)

sub.use(function (next) {
    res.push(12)
    next().then(done(15))
})

sub.use(function *(next) {
    this.body = 'ok'
    res.push(13)
    yield *next
    res.push(14)
})

test.plan(1)

request(app = app.listen())
    .get('/test')
    .expect(200)
    .end(function (err) {
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
            test.same(res, expected, 'control should flow as expected')
            app.close()
        }
    })
