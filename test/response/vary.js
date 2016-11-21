/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const test     = require('tap'),
      utils    = require('../utils'),
      end      = utils.end,
      create   = utils.create,
      request  = utils.request,
      noHeader = utils.shouldNotHaveHeader

test.test('with no arguments should not set Vary', test => {
    const app = create()

    app.use((req, res) =>
        res.vary().end())

    app.on('error', (err, ctx) => ctx.send('ok'))

    request(app)
        .get('/')
        .expect(noHeader('vary'))
        .expect(200, end(test))
})

test.test('with an empty array should not set Vary', test => {
    const app = create()

    app.use((req, res) => res.vary([]).end())

    request(app)
        .get('/')
        .expect(noHeader('vary'))
        .expect(200, end(test))
})

test.test('with an array should set the values', test => {
    const app = create()

    app.use((req, res) =>
        res.vary(['Accept', 'Accept-Language', 'Accept-Encoding']).end())

    request(app)
        .get('/')
        .expect('vary', 'Accept, Accept-Language, Accept-Encoding')
        .expect(200, end(test))
})

test.test('with a string should set the value', test => {
    const app = create()

    app.use((req, res) => res.vary('Accept').end())

    request(app)
        .get('/')
        .expect('vary', 'Accept')
        .expect(200, end(test))
})

test.test('when the value is present should not add it again', test => {
    const app = create()

    app.use((req, res) =>
        res
            .vary('Accept')
            .vary('Accept-Encoding')
            .vary('Accept-Encoding')
            .vary('Accept-Encoding')
            .vary('Accept')
            .end())

    request(app)
        .get('/')
        .expect('vary', 'Accept, Accept-Encoding')
        .expect(200, end(test))
})
