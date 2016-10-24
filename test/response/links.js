'use strict'

const test    = require('tap'),
      request = require('supertest'),
      Ellipse = require('../..'),
      servers = []

test.tearDown(() => servers.forEach(s => s.close()))

test.test('.links(obj)', test => {
    test.test('should set Link header field', test => {
        const app = createApp()

        app.use((req, res) =>
            res.links({
                next: 'http://api.example.com/users?page=2',
                last: 'http://api.example.com/users?page=5'
            }).end())

        request(app.server)
            .get('/')
            .expect('Link', '<http://api.example.com/users?page=2>; rel="next", <http://api.example.com/users?page=5>; rel="last"')
            .expect(200, () => test.end())
    })

    test.test('should set Link header field for multiple calls', test => {
        const app = createApp()

        app.use((req, res) => {
            res.links({
                next: 'http://api.example.com/users?page=2',
                last: 'http://api.example.com/users?page=5'
            })

            res.links({
                prev: 'http://api.example.com/users?page=1'
            })

            res.end()
        })

        request(app.server)
            .get('/')
            .expect('Link', '<http://api.example.com/users?page=2>; rel="next", <http://api.example.com/users?page=5>; rel="last", <http://api.example.com/users?page=1>; rel="prev"')
            .expect(200, () => test.end())
    })

    test.end()
})

test.test('.link(link, rel)', test => {
    test.test('should set Link header field', test => {
        const app = createApp()

        app.use((req, res) =>
            res.link('next', 'http://api.example.com/users?page=2').end())

        request(app.server)
            .get('/')
            .expect('Link', '<http://api.example.com/users?page=2>; rel="next"')
            .expect(200, () => test.end())
    })

    test.test('should set Link header field for multiple calls', test => {
        const app = createApp()

        app.use((req, res) => {
            res.link('next', 'http://api.example.com/users?page=2')
            res.link('last', 'http://api.example.com/users?page=5')
            res.link('prev', 'http://api.example.com/users?page=1')
            res.end()
        })

        request(app.server)
            .get('/')
            .expect('Link', '<http://api.example.com/users?page=2>; rel="next", <http://api.example.com/users?page=5>; rel="last", <http://api.example.com/users?page=1>; rel="prev"')
            .expect(200, () => test.end())
    })

    test.end()
})

function createApp() {
    const app    = new Ellipse,
        server = app.listen()

    app.server = server
    servers.push(server)
    return app
}
