'use strict'

const request = require('supertest'),
      test    = require('tap'),
      Ellipse = require('../..'),
      servers = []

test.tearDown(() => servers.forEach(s => s.close()))

test.test('with no arguments should not set Vary', test => {
    const app = createApp()

    app.use((req, res) =>
        res.vary().end())

    request(app.server)
        .get('/')
        .expect(noHeader('vary'))
        .expect(200, () => test.end())
})

test.test('with an empty array should not set Vary', test => {
    const app = createApp()

    app.use((req, res) => res.vary([]).end())

    request(app.server)
        .get('/')
        .expect(noHeader('vary'))
        .expect(200, () => test.end())
})

test.test('with an array should set the values', test => {
    const app = createApp()

    app.use((req, res) =>
        res.vary(['Accept', 'Accept-Language', 'Accept-Encoding']).end())

    request(app.server)
        .get('/')
        .expect('vary', 'Accept, Accept-Language, Accept-Encoding')
        .expect(200, () => test.end())
})

test.test('with a string should set the value', test => {
    const app = createApp()

    app.use((req, res) => res.vary('Accept').end())

    request(app.server)
        .get('/')
        .expect('vary', 'Accept')
        .expect(200, () => test.end())
})

test.test('when the value is present should not add it again', test => {
    const app = createApp()

    app.use((req, res) =>
        res
            .vary('Accept')
            .vary('Accept-Encoding')
            .vary('Accept-Encoding')
            .vary('Accept-Encoding')
            .vary('Accept')
            .end())

    request(app.server)
        .get('/')
        .expect('vary', 'Accept, Accept-Encoding')
        .expect(200, () => test.end())
})

function noHeader(field) {
    return res => {
        if (field in res.headers)
            throw new Error(field + ' should not present')
    }
}

function createApp() {
    const app    = new Ellipse,
          server = app.listen()

    app.server = server
    servers.push(server)
    return app
}
