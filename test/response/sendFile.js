/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const path       = require('path'),
      test       = require('tap'),
      onFinished = require('on-finished'),
      fixtures   = path.join(__dirname, '..', 'fixtures'),
      utils      = require('../utils'),
      end        = utils.end,
      create     = utils.create,
      request    = utils.request

test.test('res', test => {
    test.test('.sendFile(path)', test => {
        test.test('should error missing path', test => {
            const app = createApp(null)

            app.on('error', (err, ctx) => {
                test.match(err.stack, /path.*required/)
                ctx.status = 500
                ctx.send('Internal Server Error')
            })

            request(app)
                .get('/')
                .expect(500, 'Internal Server Error', end(test))
    })

    test.test('should transfer a file', test => {
        const app = createApp(path.resolve(fixtures, 'name.txt'))

        request(app)
            .get('/')
            .expect(200, 'buggy', end(test))
    })

    test.test('should transfer a file with special characters in string', test => {
        const app = createApp(path.resolve(fixtures, '% of cats.txt'))

        request(app)
            .get('/')
            .expect(200, '42%', end(test))
    })

    test.test('should include ETag', test => {
        const app = createApp(path.resolve(fixtures, 'name.txt'))

        request(app)
            .get('/')
            .expect('etag', /^(?:W\/)?"[^"]+"$/)
            .expect(200, 'buggy', end(test))
    })

    test.test('should 304 when ETag matches', test => {
        const app = createApp(path.resolve(fixtures, 'name.txt'))

        request(app)
            .get('/')
            .expect('ETag', /^(?:W\/)?"[^"]+"$/)
            .expect(200, 'buggy', function (err, res) {
                if (err) {
                    test.threw(err)
                    return
                }

                const etag = res.headers.etag

                request(app)
                    .get('/')
                    .set('If-None-Match', etag)
                    .expect(304, end(test))
            })
    })

    test.test('should 404 for directory', test => {
        const app = createApp(path.resolve(fixtures, 'blog'))

        request(app)
            .get('/')
            .expect(404, end(test))
    })

    test.test('should 404 when not found', test => {
        const app = createApp(path.resolve(fixtures, 'does-no-exist'))

        app.use((req, res) => {
            res.statusCode = 200
            res.send('no!')
        })

        request(app)
            .get('/')
            .expect(404, end(test))
    })

    test.test('should not override manual content-types', test => {
        const app = createApp()

        app.use((req, res) => {
            res.type('application/x-bogus')
            res.sendFile(path.resolve(fixtures, 'name.txt'))
        })

        request(app)
            .get('/')
            .expect('Content-Type', 'application/x-bogus')
            .end(end(test))
    })

    test.test('should not error if the client aborts', test => {
        const done = end(test),
              app  = createApp()

        app.use((_, res) => {
            setImmediate(() =>
                res.sendFile(path.resolve(fixtures, 'name.txt'), done))

            req.abort()
        })

        const req = request(app).get('/')
        req.expect(200, done)
    })

    test.test('with "dotfiles" option', test => {
        test.test('should not serve dotfiles by default', test => {
            const app = createApp(path.resolve(fixtures, '.name'))

            request(app)
                .get('/')
                .expect(404, end(test))
        });

        test.test('should accept dotfiles option', test => {
            const app = createApp(path.resolve(fixtures, '.name'), { dotfiles: 'allow' })

            request(app)
                .get('/')
                .expect(200, 'buggy', end(test))
        })

        test.end()
    })

    test.test('with "headers" option', test => {
        test.test('should accept headers option', test => {
            const headers = {
               'x-success': 'sent',
               'x-other': 'done'
            }
            const app = createApp(path.resolve(fixtures, 'name.txt'), { headers: headers })

            request(app)
                .get('/')
                .expect('x-success', 'sent')
                .expect('x-other', 'done')
                .expect(200, end(test))
        })

        test.test('should ignore headers option on 404', test => {
            const headers = { 'x-success': 'sent' },
                  app     = createApp(path.resolve(fixtures, 'does-not-exist'), { headers: headers })

            request(app)
                .get('/')
                .expect(res => {
                    if ('x-success' in res.headers)
                        throw new Error('x-success header should not present in response')
                })
                .expect(404, end(test))
        })

        test.end()
    })

    test.test('with "root" option', test => {
        test.test('should serve relative to "root"', test => {
            const app = createApp('name.txt', { root: fixtures })

            request(app)
                .get('/')
                .expect(200, 'buggy', end(test))
        })

        test.test('should disallow requesting out of "root"', test => {
            const app = createApp('foo/../../user.html', { root: fixtures })

            request(app)
                .get('/')
                .expect(403, end(test))
        })

        test.end()
    })

    test.end()
})

    test.test('.sendFile(path, fn)', test => {
        test.test('should invoke the callback when complete', test => {
            const done = end(test, 2),
                  app  = createApp(path.resolve(fixtures, 'name.txt'), done)

            request(app)
                .get('/')
                .expect(200, done)
        })

        test.test('should invoke the callback when client aborts', test => {
            const done = end(test),
                  app  = createApp()

            app.use((_, res) => {
                setImmediate(() =>
                    res.sendFile(path.resolve(fixtures, 'name.txt'), done))

                req.abort()
            })

            const req = request(app)
                .get('/')
                .end()
        })

        test.test('should invoke the callback when client already aborted', test => {
            const done = end(test),
                  app  = createApp()

            app.use((_, res) => {
                onFinished(res, () =>
                        res.sendFile(path.resolve(fixtures, 'name.txt'), done))

                req.abort()
            })

            const req = request(app)
                .get('/')
                .end()
        })

        test.test('should invoke the callback without error when HEAD', test => {
            const done = end(test, 2),
                  app  = createApp(path.resolve(fixtures, 'name.txt'), done)

            request(app)
                .head('/')
                .expect(200, done)
        })

        test.test('should invoke the callback without error when 304', test => {
            const done = end(test, 3),
                  app  = createApp(path.resolve(fixtures, 'name.txt'), done)

            request(app)
                .get('/')
                .expect('etag', /^(?:W\/)?"[^"]+"$/)
                .expect(200, 'buggy', (err, res) => {
                    if (err)
                        return test.threw(err)

                    const etag = res.headers.etag

                    request(app)
                        .get('/')
                        .set('if-none-match', etag)
                        .expect(304, done)
                })
        })

        test.test('should invoke the callback on 404', test => {
            const done = end(test),
                  app  = createApp()

            app.use((req, res) => {
                res.sendFile(path.resolve(fixtures, 'does-not-exist'), err => {
                    test.ok(err, 'error should present')
                    test.equals(err.status, 404)
                    res.send('got it')
                })
            })

            request(app)
                .get('/')
                .expect(200, 'got it', done)
        })

        test.end()
    })

    test.test('.sendFile(path, options)', test => {
        test.test('should pass options to send module', test => {
            const app = createApp(path.resolve(fixtures, 'name.txt'), { start: 0, end: 1 })

            request(app)
                .get('/')
                .expect(200, 'bu', end(test))
        })

        test.end()
    })

    test.end()
})

function createApp(path, options, fn) {
  const app = create()

  if (arguments.length)
      app.use((req, res) =>
          res.sendFile(path, options, fn))

  return app
}
