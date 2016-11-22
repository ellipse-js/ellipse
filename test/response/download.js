/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const path                = require('path'),
      test                = require('tap'),
      fixtures            = path.resolve(__dirname, '..', 'fixtures'),
      html                = path.resolve(fixtures, 'user.html'),
      utils               = require('../support'),
      end                 = utils.end,
      create              = utils.create,
      request             = utils.request,
      shouldNotHaveHeader = utils.shouldNotHaveHeader

test.test('.download(path) should transfer as an attachment', test => {
      const app = create()

      app.use((req, res) => res.download(html))

      request(app)
          .get('/')
          .expect('Content-Type', 'text/html; charset=UTF-8')
          .expect('Content-Disposition', 'attachment; filename="user.html"')
          .expect(200, end(test))
})

test.test('.download(path, filename) should provide an alternate filename', test => {
    const app = create()

    app.use((req, res) =>
        res.download(html, 'document'))

    request(app)
        .get('/')
        .expect('Content-Type', 'text/html; charset=UTF-8')
        .expect('Content-Disposition', 'attachment; filename="document"')
        .expect(200, end(test))
})

test.test('.download(path, fn) should invoke the callback', test => {
    const app  = create(),
          done = end(test, 2)

    app.use((req, res) =>
        res.download(html, done))

    request(app)
        .get('/')
        .expect('Content-Type', 'text/html; charset=UTF-8')
        .expect('Content-Disposition', 'attachment; filename="user.html"')
        .expect(200, done)
})

test.test('.download(path, filename, fn) should invoke the callback', test => {
    const app  = create(),
          done = end(test, 2)

    app.use((req, res) =>
        res.download(html, 'document', done))

    request(app)
        .get('/')
        .expect('Content-Type', 'text/html; charset=UTF-8')
        .expect('Content-Disposition', 'attachment; filename="document"')
        .expect(200, done)
})

test.test('.download(path, options) should pass options to .sendFile()', test => {
    const app = create()

    app.use((req, res) =>
        res.download(html, { headers: { 'x-test': 'test' } }))

    request(app)
        .get('/')
        .expect('Content-Type', 'text/html; charset=UTF-8')
        .expect('Content-Disposition', 'attachment; filename="user.html"')
        .expect('X-Test', 'test')
        .expect(200, end(test))
})

test.test('.download(path, options) should respect options.fileName', test => {
    const app     = create(),
          options = { fileName: 'document', headers: { 'x-test': 'test' } }

    app.use((req, res) =>
        res.download(__filename, options))

    request(app)
        .get('/')
        .expect('Content-Type', 'application/javascript')
        .expect('Content-Disposition', 'attachment; filename="document"')
        .expect('X-Test', 'test')
        .expect(200, end(test))
})

test.test('.download(path, options, fn) should invoke the callback', test => {
    const app     = create(),
          done    = end(test, 2),
          options = { fileName: 'document', headers: { 'x-test': 'test' } }

    app.use((req, res) =>
        res.download(__filename, options, done))

    request(app)
        .get('/')
        .expect('Content-Type', 'application/javascript')
        .expect('Content-Disposition', 'attachment; filename="document"')
        .expect('X-Test', 'test')
        .expect(200, done)
})

test.test('invalid argument should be asserted', test => {
    const app = create().use((req, res) => {
        test.throws(() => {
            res.download(__filename, true)
        }, TypeError, 'invalid argument should be asserted')

        test.throws(() => {
            res.download(__filename, true, () => {})
        }, TypeError, 'invalid argument should be asserted')

        res.send('ok')
    })

    request(app)
        .get('/')
        .expect(200, 'ok', end(test))
})

test.test('on failure', test => {
    test.test('should invoke the callback', test => {
        const app = create()

        app.use((req, res, next) =>
            res.download('/non/existing/file', err => {
                if (!err)
                    next(new Error('expected error'))
                else
                    res.send(`got ${err.status} ${err.code}`)
            }))

        request(app)
            .get('/')
            .expect(200, 'got 404 ENOENT', end(test))
    })

    test.test('should remove Content-Disposition', test => {
        const app = create()
        let calls = 0

        app.use((req, res, next) =>
            res.download('/non/existing/file', err => {
                if (!err)
                    next(new Error('expected error'))
                else
                    res.end('failed')
            }))

        request(app)
            .get('/')
            .expect(utils.shouldNotHaveHeader('Content-Disposition'))
            .expect(200, 'failed', end(test))
    })

    test.end()
})
