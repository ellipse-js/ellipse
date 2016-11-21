/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const test    = require('tap'),
      utils   = require('../utils'),
      end     = utils.end,
      create  = utils.create,
      request = utils.request

test.test('.json(object)', test => {
    test.test('should not support jsonp callbacks', test => {
        const app = create()

        app.use((req, res) =>
            res.json({ foo: 'bar' }))

        request(app)
            .get('/?callback=foo')
            .expect('{"foo":"bar"}', end(test))
    })

    test.test('should not override previous Content-Types', test => {
        const app = create()

        app.get('/', (req, res) => {
            res.type('application/vnd.example+json')
            res.json({ hello: 'world' })
        })

        request(app)
            .get('/')
            .expect('Content-Type', 'application/vnd.example+json; charset=utf-8')
            .expect(200, '{"hello":"world"}', end(test))
    })

    test.end()
})

test.test('when given primitives', test => {
    test.test('should respond with json for null', test => {
        const app = create()

        app.use((req, res) => res.json(null))

        request(app)
            .get('/')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200, 'null', end(test))
    })

    test.test('should respond with json for Number', test => {
        const app = create()

        app.use((req, res) => res.json(300))

        request(app)
            .get('/')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200, '300', end(test))
    })

    test.test('should respond with json for String', test => {
        const app = create()

        app.use((req, res) => res.json('str'))

        request(app)
            .get('/')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200, '"str"', end(test))
    })

    test.end()
})

test.test('when given an array, it should respond with json', test => {
    const app = create()

    app.use((req, res) =>
        res.json([ 'foo', 'bar', 'baz' ]))

    request(app)
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, '["foo","bar","baz"]', end(test))
})

test.test('when given an object, it should respond with json', test => {
    const app = create()

    app.use((req, res) =>
        res.json({ name: 'buggy' }))

    request(app)
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, '{"name":"buggy"}', end(test))
})
