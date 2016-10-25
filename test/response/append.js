'use strict'

const test    = require('tap'),
      request = require('supertest'),
      Ellipse = require('../..'),
      servers = []

test.tearDown(() => servers.forEach(s => s.close()))

// note about these tests: "Link" and "X-*" are chosen because
// the common node.js versions white list which _incoming_
// headers can appear multiple times; there is no such white list
// for outgoing, though

test.test('should append multiple headers', test => {
    const app = createApp()

    app.use((req, res, next) => {
        res.append('Link', '<http://localhost/>')
        next()
    })

    app.use((req, res) =>
        res.append('Link', '<http://localhost:80/>').end())

    request(app.server)
        .get('/')
        .expect('Link', '<http://localhost/>, <http://localhost:80/>', () => test.end())
})

test.test('should accept array of values', test => {
    const app = createApp(),
          arr = [ 'foo=bar', 'fizz=buzz' ]

    app.use((req, res) =>
        res.append('Set-Cookie', arr).end())

    request(app.server)
        .get('/')
        .expect(res =>
            test.same(res.headers[ 'set-cookie' ], arr, 'header should be set'))
        .expect(200, () => test.end())
})

test.test('should get reset by res.set(field, val)', test => {
    const app = createApp()

    app.use((req, res, next) => {
        res.append('Link', '<http://localhost/>')
        res.append('Link', '<http://localhost:80/>')
        next()
    })

    app.use((req, res) =>
        res.set('Link', '<http://127.0.0.1/>').end())

    request(app.server)
        .get('/')
        .expect('Link', '<http://127.0.0.1/>', () => test.end())
})

test.test('should work with res.set(field, val) first', test => {
    const app = createApp()

    app.use((req, res, next) => {
        res.set('Link', '<http://localhost/>')
        next()
    })

    app.use((req, res) =>
        res.append('Link', '<http://localhost:80/>').end())

    request(app.server)
        .get('/')
        .expect('Link', '<http://localhost/>, <http://localhost:80/>', () => test.end())
})

test.test('should work with cookies', test => {
    const app      = createApp(),
          expected = [ 'foo=bar; path=/; httponly', 'bar=baz' ]

    app.use((req, res, next) => {
        res.cookie('foo', 'bar')
        next()
    })

    app.use((req, res) =>
        res.append('Set-Cookie', 'bar=baz').end())

    request(app.server)
        .get('/')
        .expect(res =>
            test.same(expected, res.headers[ 'set-cookie' ], 'header should be set'))
        .expect(200, () => test.end())
})

function createApp() {
    const app    = new Ellipse,
          server = app.listen()

    app.server = server
    servers.push(server)
    return app
}
