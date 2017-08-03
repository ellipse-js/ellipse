'use strict'

const test    = require('tap'),
      utils   = require('./support'),
      end     = utils.end,
      create  = utils.create,
      request = utils.request

test.test('app should respond if res.body is not empty', test => {
    const app = create()

    app.get('/', (req, res) => {
        res.body = 'ok'
        res.send()
    })

    request(app)
        .get('/')
        .expect(200, 'ok', end(test))
})

test.test('app should not respond if response is already sent', test => {
    const app = create()

    app.get('/', (req, res, next) => {
        res.status(200, "everything's okay")
           .send()
    })

    request(app)
        .get('/')
        .expect(200, end(test))
})

test.test('response should be manipulated befor it gets sent', test => {
    const app = create()

    app.get('/', (req, res, next) => res.send('hola'))

    app.on('respond', ctx => {
        ctx.status  = 418
        ctx.message = 'help me!'
    })

    request(app)
        .get('/')
        .expect(418, end(test))
})

test.test('implicit response should be manipulated by middleware', test => {
    const app = create()

    app.use(function *(next) {
        const now = new Date
        yield *next
        this.set('x-response-time', new Date - now)
        this.body = null
        this.send()
    })

    app.get('/', (req, res, next) => res.body = 'hola')

    request(app)
        .get('/')
        .expect(res => {
            if (isNaN(res.headers[ 'x-response-time' ]))
                throw new Error('x-response-time header is expected, but missing')
        })
        .expect(200, end(test))
})

test.test('app should not respond', test => {
    test.test('if app.respond is false', test => {
        const app = create({ respond: false })

        app.get('/', (req, res) => {
            let buf = ''
            req.setEncoding('utf8')
            req.on('data', chunk => buf += chunk)
            req.on('end', () => res.end(buf))
        })

        request(app)
            .get('/')
            .send('hello')
            .expect(200, 'hello', end(test))
    })

    test.test('if ctx.respond is false', test => {
        const app = create()

        app.get('/', (req, res) => {
            res.ctx.respond = false

            let buf = ''
            req.setEncoding('utf8')
            req.on('data', chunk => buf += chunk)
            req.on('end', () => res.end(buf))
        })

        request(app)
            .get('/')
            .send('hello')
            .expect(200, 'hello', end(test))
    })

    test.end()
})
