'use strict'

const test      = require('tap'),
      request   = require('supertest'),
      Ellipse   = require('..'),
      result    = [],
      errResult = []

var app  = new Ellipse,
    app2 = new Ellipse

function done(n) {
    return () => result.push(n)
}

// errors //

app.get('/error',
    function *(next) {
        yield *next
        throw new Error('test')
    },
    (req, res) => res.send('ok')
)

app.get('/error2',
    (req, res, next) => {
        errResult.push(1)
        return next().catch(err => {
            errResult.push(4)
            res.status(500).send()
        })
    },
    (req, res, next) => {
        errResult.push(2)
        return next()
    },
    function () {
        errResult.push(3)
        throw new Error('test')
    }
)

app.param('test1', (next, param) => {
    throw new Error('test')
})

app.param('test2', (next, param) =>
    next(new Error('test')))

app.get('/error3/1/:test1', () => {})
app.get('/error3/2/:test2', () => {})

app.on('error', (err, ctx) => {
    test.pass('upstream error caught')
    ctx.status = 500
    ctx.send()
})

// control flow //

app.use(next => {
    result.push(1)
    return next().then(done(26))
})

app.use(next => {
    result.push(2)
    return next().then(done(25))
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
    return next().then(done(22))
})

app.get('/:test',
    next => {
        result.push(6)
        return next().then(done(21))
    },
    next => {
        result.push(7)
        return next().then(done(20))
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
        return next().then(done(17))
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
    return next().then(done(15))
})

sub.use(function *(next) {
    this.body = 'ok'
    result.push(13)
    yield *next
    result.push(14)
})

// manipulating response upstream

app2.use((req, res, next) => {
    const time = new Date
    return next().then(() => {
        res.set('x-response-time', new Date - time)
    })
})

app2.get('/', (req, res, next) => {
    res.body = 'yeah!'
    return next()
})

test.plan(9)
test.tearDown(() => {
    app.close()
    app2.close()
})

request(app = app.listen())
    .get('/test')
    .expect(200, err => {
        if (err)
            test.threw(err)
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
        }
    })

request(app)
    .get('/error')
    .expect(200, 'ok', err => {
        if (err)
            test.threw(err)
        else
            test.pass('response received')
    })

request(app)
    .get('/error2')
    .expect(500, err => {
        if (err)
            test.threw(err)
        else
            test.same(errResult, [ 1, 2, 3, 4 ], 'control should flow as expected (in case of error)')
    })

request(app)
    .get('/error3/1/t')
    .expect(500, err => {
        if (err)
            test.threw(err)
        else
            test.pass('error caught in param processor (threw)')
    })

request(app)
    .get('/error3/2/t')
    .expect(500, err => {
        if (err)
            test.threw(err)
        else
            test.pass('error caught in param processor (next)')
    })

request(app2 = app2.listen())
    .get('/')
    .expect(res => {
        if (!('x-powered-by' in res.headers) && !isNaN(res.headers[ 'x-powered-by' ]))
            throw new Error('x-powered-by header is expected, but missing')
    })
    .expect(200, 'yeah!', err => {
        if (err)
            test.threw(err)
        else
            test.pass('response should be manipulated upstream')
    })
