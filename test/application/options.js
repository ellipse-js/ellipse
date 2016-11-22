/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const test    = require('tap'),
      Ellipse = require('../..'),
      utils   = require('../support'),
      end     = utils.end,
      create  = utils.create,
      request = utils.request

test.test('OPTIONS', test => {
    test.test('it should default to the routes defined', test => {
        const app = create()

        app.delete('/', noop)
        app.get('/users', noop)
        app.put('/users', noop)

        request(app)
            .options('/users')
            .expect('Allow', 'GET,PUT,HEAD')
            .expect(200, 'GET,PUT,HEAD', end(test))
    })

    test.test('it should only include each method once', test => {
        const app = create()

        app.delete('/', noop)
        app.get('/users', noop)
        app.put('/users', noop)
        app.get('/users', noop)

        request(app)
            .options('/users')
            .expect('Allow', 'GET,PUT,HEAD')
            .expect(200, 'GET,PUT,HEAD', end(test))
    })

    test.test('it should not be affected by app.all()', test => {
        const app = create()

        app.get('/', noop)
        app.get('/users', noop)
        app.put('/users', noop)
        app.all('/users', (req, res, next) => {
            res.setHeader('x-hit', '1')
            next()
        })

        request(app)
            .options('/users')
            .expect(utils.shouldNotHaveHeader('x-hit')) // differs from Express
            .expect('Allow', 'GET,PUT,HEAD')
            .expect(200, 'GET,PUT,HEAD', end(test))
    })

    test.test('it should not respond if the path is not defined', test => {
        const app = create()

        app.get('/users', noop)

        request(app)
            .options('/other')
            .expect(404, end(test))
    })

    test.test('it should forward requests down the middleware chain', test => {
        const app = create(),
              router = app.mount('/users')

        router.get('/', noop)
        app.get('/other', noop)

        request(app)
            .options('/users')
            .expect('Allow', 'GET,HEAD')
            .expect(200, 'GET,HEAD', end(test))
    })

    // one test isn't included here from Express

    test.end()
})

test.test('app.options() should override the default behavior', test => {
    const app = create()

    app.options('/users', (req, res) =>
        res.set('Allow', 'GET')
           .send('GET'))

    app.get('/users', noop)
    app.put('/users', noop)

    request(app)
        .options('/users')
        .expect('GET')
        .expect('Allow', 'GET', end(test))
})

function noop() {}
