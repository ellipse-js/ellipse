'use strict'

const test    = require('tap'),
      request = require('supertest'),
      Ellipse = require('../..'),
      servers = []

test.tearDown(() => servers.forEach(s => s.close()))

test.test('.location(url)', test => {
    test.test('should set the header', test => {
        const app = createApp()

        app.use((req, res) =>
            res.location('http://google.com').end())

        request(app.server)
            .get('/')
            .expect('location', 'http://google.com')
            .expect(200, () => test.end())
    })

    test.test('should encode "url"', test => {
        const app = createApp()

        app.use((req, res) =>
            res.location('https://google.com?q=\u2603 §10').end())

        request(app.server)
            .get('/')
            .expect('location', 'https://google.com?q=%E2%98%83%20%C2%A710')
            .expect(200, () => test.end())
    })

    test.test('should not touch already-encoded sequences in "url"', test => {
        const app = createApp()

        app.use((req, res) =>
            res.location('https://google.com?q=%A710').end())

        request(app.server)
            .get('/')
            .expect('location', 'https://google.com?q=%A710')
            .expect(200, () => test.end())
    })

    test.test('"back" should refer to the Referrer header', test => {
        const app = createApp()

        app.use((req, res) =>
            res.location('back').end())

        request(app.server)
            .get('/')
            .set('referer', 'http://example.com')
            .expect('location', 'http://example.com')
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
