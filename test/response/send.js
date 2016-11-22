/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const test    = require('tap'),
      methods = require('methods'),
      utils   = require('../support'),
      end     = utils.end,
      create  = utils.create,
      request = utils.request

test.test('.send() should set body to ""', test => {
    const app = create()

    app.use((req, res) => res.send())

    request(app)
        .get('/')
        .expect('Content-Length', '0')
        .expect(200, '', end(test))
})

test.test('.send(null) should set body to ""', test => {
    const app = create()

    app.use((req, res) => res.send(null))

    request(app)
        .get('/')
        .expect('Content-Length', '0')
        .expect(200, '', end(test))
})

test.test('.send(undefined) should set body to ""', test => {
    const app = create()

    app.use((req, res) => res.send(undefined))

    request(app)
        .get('/')
        .expect('Content-Length', '0')
        .expect(200, '', end(test))
})

test.test('.send(String)', test => {
    test.test('should send as html', test => {
        const app = create()

        app.use((req, res) => res.send('<p>hey</p>'))

        request(app)
            .get('/')
            .expect('Content-Type', 'text/html; charset=utf-8')
            .expect(200, '<p>hey</p>', end(test))
    })

    test.test('should set ETag', test => {
        const app = create()

        app.use((req, res) => {
            var str = Array(1000).join('-')
            res.send(str)
        })

        request(app)
            .get('/')
            .expect('ETag', 'W/"3e7-VYgCBglFKiDVAcpzPNt4Sg"')
            .expect(200, end(test))
    })

    test.test('should not override Content-Type', test => {
        const app = create()

        app.use((req, res) =>
            res.set('Content-Type', 'text/plain').send('hey'))

        request(app)
            .get('/')
            .expect('Content-Type', 'text/plain; charset=utf-8')
            .expect(200, 'hey', end(test))
    })

    test.test('should override charset in Content-Type', test => {
        const app = create()

        app.use((req, res) =>
            res.set('Content-Type', 'text/plain; charset=iso-8859-1').send('hey'))

        request(app)
            .get('/')
            .expect('Content-Type', 'text/plain; charset=utf-8')
            .expect(200, 'hey', end(test))
    })

    test.test('should keep charset in Content-Type for Buffers', test => {
        const app = create()

        app.use((req, res) =>
            res.set('Content-Type', 'text/plain; charset=iso-8859-1').send(Buffer.from('hi')))

        request(app)
            .get('/')
            .expect('Content-Type', 'text/plain; charset=iso-8859-1')
            .expect(200, 'hi', end(test))
    })

    test.end()
})

test.test('.send(Buffer)', test => {
    test.test('should send as octet-stream', test => {
        const app = create()

        app.use((req, res) =>
            res.send(Buffer.from('hello')))

        request(app)
            .get('/')
            .expect('Content-Type', 'application/octet-stream')
            .expect(200, 'hello', end(test))
    })

    test.test('should set ETag', test => {
        const app = create()

        app.use((req, res) => {
            const str = Array(1000).join('-')
            res.send(Buffer.from(str))
        })

        request(app)
            .get('/')
            .expect('ETag', 'W/"3e7-VYgCBglFKiDVAcpzPNt4Sg"')
            .expect(200, end(test))
    })

    test.test('should not override Content-Type', test => {
        const app = create()

        app.use((req, res) =>
            res.set('Content-Type', 'text/plain')
               .send(Buffer.from('hey')))

        request(app)
            .get('/')
            .expect('Content-Type', 'text/plain')
            .expect(200, 'hey', end(test))
    })

    test.end()
})

test.test('.send(Object) should send as application/json', test => {
    const app = create()

    app.use((req, res) =>
        res.send({ name: 'buggy' }))

    request(app)
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, '{"name":"buggy"}', end(test))
})

test.test('when the request method is HEAD it should ignore the body', test => {
    const app = create()

    app.use((req, res) => res.send('yay'))

    request(app)
        .head('/')
        .expect(undefined, end(test))
})

test.test('when .statusCode is 204 it should strip Content-* fields, Transfer-Encoding field, and body', test => {
    const app = create()

    app.use((req, res) =>
        res.status(204)
           .set('Transfer-Encoding', 'chunked')
           .send('foo'))

    request(app)
        .get('/')
        .expect(utils.shouldNotHaveHeader('Content-Type'))
        .expect(utils.shouldNotHaveHeader('Content-Length'))
        .expect(utils.shouldNotHaveHeader('Transfer-Encoding'))
        .expect(204, '', end(test))
})

test.test('when .statusCode is 304 it should strip Content-* fields, Transfer-Encoding field, and body', test => {
    const app = create()

    app.use((req, res) =>
        res.status(304)
           .set('Transfer-Encoding', 'chunked')
           .send('foo'))

    request(app)
        .get('/')
        .expect(utils.shouldNotHaveHeader('Content-Type'))
        .expect(utils.shouldNotHaveHeader('Content-Length'))
        .expect(utils.shouldNotHaveHeader('Transfer-Encoding'))
        .expect(304, '', end(test))
})

test.test('it should always check regardless of length', test => {
    const app  = create(),
          etag = '"asdf"'

    app.use((req, res) =>
        res.set('ETag', etag)
           .send('hey'))

    request(app)
        .get('/')
        .set('If-None-Match', etag)
        .expect(304, end(test))
})

test.test('it should respond with 304 Not Modified when fresh', test => {
    const app  = create(),
          etag = '"asdf"'

    app.use((req, res) => {
        const str = Array(1000).join('-')
        res.set('ETag', etag)
        res.send(str)
    })

    request(app)
        .get('/')
        .set('If-None-Match', etag)
        .expect(304, end(test))
})

test.test('it should not perform freshness check unless 2xx or 304', test => {
    const app  = create(),
          etag = '"asdf"'

    app.use((req, res) =>
        res.status(500)
           .set('ETag', etag)
           .send('hey'))

    request(app)
        .get('/')
        .set('If-None-Match', etag)
        .expect('hey')
        .expect(500, end(test))
})

test.test('it should not support jsonp callbacks', test => {
    const app = create()

    app.use((req, res) =>  res.send({ foo: 'bar' }))

    request(app)
        .get('/?callback=foo')
        .expect('{"foo":"bar"}', end(test))
})

test.test('"etag" setting', test => {
    test.test('when enabled', test => {
        test.test('it should send ETag', test => {
            const app = create({ etag: true })

            app.use((req, res) => res.send('kajdslfkasdf'))

            request(app)
                .get('/')
                .expect('ETag', 'W/"c-ZUfd0NJ26qwjlKF4r8qb2g"')
                .expect(200, end(test))
        });

        test.test('it should send ETag in response to any http verb except CONNECT', test => {
            test.plan(methods.length - 1)

            methods.forEach(method => {
                if (method === 'connect')
                    return

                test.test(`it should send ETag in response to ${method.toUpperCase()} request`, test => {
                    const app = create({ etag: true })

                    app[ method ]('/', (req, res) => res.send('kajdslfkasdf'))

                    request(app)
                        [ method ]('/')
                        .expect('ETag', 'W/"c-ZUfd0NJ26qwjlKF4r8qb2g"')
                        .expect(200, end(test))
                })
            })
        })

        test.test('it should send ETag for empty string response', test => {
            const app = create({ etag: true })

            app.use((req, res) => res.send(''))

            request(app)
                .get('/')
                .expect('ETag', 'W/"0-1B2M2Y8AsgTpgAmY7PhCfg"')
                .expect(200, end(test))
        })

        test.test('it should send ETag for long response', test => {
            const app = create({ etag: true })

            app.use((req, res) => {
                const str = Array(1000).join('-')
                res.send(str)
            })

            request(app)
                .get('/')
                .expect('ETag', 'W/"3e7-VYgCBglFKiDVAcpzPNt4Sg"')
                .expect(200, end(test))
        });

        test.test('it should not override ETag when manually set', test => {
            const app = create({ etag: true })

            app.use((req, res) =>
                res.set('etag', '"asdf"')
                   .send(200))

            request(app)
                .get('/')
                .expect('ETag', '"asdf"')
                .expect(200, end(test))
        })

        test.test('it should not send ETag for res.send()', test => {
            const app = create({ etag: true })

            app.use((req, res) => res.send())

            request(app)
                .get('/')
                .expect(utils.shouldNotHaveHeader('ETag'))
                .expect(200, end(test))
        })

        test.end()
    })

    test.test('when disabled', test => {
        test.test('it should not send ETag', test => {
            const app = create({ etag: false })

            app.use((req, res) => {
                const str = Array(1000).join('-')
                res.send(str)
            })

            request(app)
                .get('/')
                .expect(utils.shouldNotHaveHeader('ETag'))
                .expect(200, end(test))
        })

        test.test('it should send ETag when manually set', test => {
            const app = create({ etag: false })

            app.use((req, res) =>
                res.set('etag', '"asdf"')
                   .send(200))

            request(app)
                .get('/')
                .expect('ETag', '"asdf"')
                .expect(200, end(test))
        })

        test.end()
    })

    test.test('when "strong" it should send strong ETag', test => {
        const app = create({ etag: 'strong' })

        app.use((req, res) => res.send('hello, world!'))

        request(app)
            .get('/')
            .expect('ETag', '"d-Otu60XkfuuPskIiUxJY4cA"')
            .expect(200, end(test))
    })

    test.test('when "weak" it should send weak ETag', test => {
        const app = create({ etag: 'weak' })

        app.use((req, res) => res.send('hello, world!'))

        request(app)
            .get('/')
            .expect('ETag', 'W/"d-Otu60XkfuuPskIiUxJY4cA"')
            .expect(200, end(test))
    })

    test.test('when it is a function', test => {
        test.test('it should send custom ETag', test => {
            const app = create({ etag })

            function etag(body, encoding) {
                const chunk = !Buffer.isBuffer(body)
                    ? Buffer.from(body, encoding)
                    : body

                test.equals(chunk.toString(), 'hello, world!')

                return '"custom"'
            }

            app.use((req, res) => res.send('hello, world!'))

            request(app)
                .get('/')
                .expect('ETag', '"custom"')
                .expect(200, end(test))
        })

        test.test('it should not send falsy ETag', test => {
            const app = create({ etag: () => {} })

            app.use((req, res) => res.send('hello, world!'))

            request(app)
                .get('/')
                .expect(utils.shouldNotHaveHeader('ETag'))
                .expect(200, end(test))
        })

        test.end()
    })

    test.end()
})
