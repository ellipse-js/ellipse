/* These tests are ported from Express.
 * https://github.com/expressjs/express
 */

'use strict'

const http    = require('http'),
      test    = require('tap'),
      utils   = require('../utils'),
      end     = utils.end,
      create  = utils.create,
      request = utils.request

test.test('.redirect(url)', test => {
    test.test('should default to a 302 redirect', test => {
        const app = create()

        app.use((req, res) =>
            res.redirect('http://google.com'))

        request(app)
            .get('/')
            .expect('location', 'http://google.com')
            .expect(302, end(test))
    })

    test.test('should encode "url"', test => {
        const app = create()

        app.use((req, res) =>
            res.redirect('https://google.com?q=\u2603 §10'))

        request(app)
            .get('/')
            .expect('Location', 'https://google.com?q=%E2%98%83%20%C2%A710')
            .expect(302, end(test))
    })

    test.test('should not touch already-encoded sequences in "url"', test => {
        const app = create()

        app.use((req, res) =>
            res.redirect('https://google.com?q=%A710'))

        request(app)
            .get('/')
            .expect('Location', 'https://google.com?q=%A710')
            .expect(302, end(test))
    })

    test.end()
})

test.test('when the request method is HEAD it should ignore the body', test => {
    const app = create()
    // console.log(app.server.address())

    app.use((req, res) =>
        res.redirect('http://google.com'))

    app.on('error', err => console.log(err.stack))

    request(app)
        .head('/')
        .expect('Location', 'http://google.com')
        .expect(302, end(test))
})

test.test('when accepting', test => {
    test.test('html it should respond with html', test => {
        const app = create()

        app.use((req, res) =>
            res.redirect('http://google.com'))

        request(app)
            .get('/')
            .set('Accept', 'text/html')
            .expect('Content-Type', /html/)
            .expect('Location', 'http://google.com')
            .expect(302, '<p>' + http.STATUS_CODES[ 302 ] + '. Redirecting to <a href="http://google.com">http://google.com</a>.</p>', end(test))
    })

    test.test('should escape the url', test => {
        const app = create()

        app.use((req, res) =>
            res.redirect('<la\'me>'))

        request(app)
            .get('/')
            .set('Host', 'http://example.com')
            .set('Accept', 'text/html')
            .expect('Content-Type', /html/)
            .expect('Location', '%3Cla\'me%3E')
            .expect(302, '<p>' + http.STATUS_CODES[ 302 ] + '. Redirecting to <a href="&lt;la&#39;me&gt;">&lt;la&#39;me&gt;</a>.</p>', end(test))
    })

    test.test('should include the redirect type', test => {
        const app = create()

        app.use((req, res) =>
            res.redirect(301, 'http://google.com'))

        request(app)
            .get('/')
            .set('Accept', 'text/html')
            .expect('Content-Type', /html/)
            .expect('Location', 'http://google.com')
            .expect(301, '<p>Moved Permanently. Redirecting to <a href="http://google.com">http://google.com</a>.</p>', end(test))
    })

    test.end()
})

test.test('when accepting text', test => {
    test.test('should respond with text', test => {
        const app = create()

        app.use((req, res) =>
            res.redirect('http://google.com'))

        request(app)
            .get('/')
            .set('Accept', 'text/plain')
            .expect('Content-Type', /plain/)
            .expect('Location', 'http://google.com')
            .expect(302, http.STATUS_CODES[ 302 ] + '. Redirecting to http://google.com.', end(test))
    })

    test.test('should encode the url', test => {
        const app = create()

        app.use((req, res) =>
            res.redirect('http://example.com/?param=<script>alert("hax");</script>'))

        request(app)
            .get('/')
            .set('Host', 'http://example.com')
            .set('Accept', 'text/plain')
            .expect('Content-Type', /plain/)
            .expect('Location', 'http://example.com/?param=%3Cscript%3Ealert(%22hax%22);%3C/script%3E')
            .expect(302, http.STATUS_CODES[ 302 ] + '. Redirecting to http://example.com/?param=<script>alert("hax");</script>.', end(test))
    })

    test.test('should include the redirect type', test => {
        const app = create()

        app.use((req, res) =>
            res.redirect(301, 'http://google.com'))

        request(app)
            .get('/')
            .set('Accept', 'text/plain')
            .expect('Content-Type', /plain/)
            .expect('Location', 'http://google.com')
            .expect(301, 'Moved Permanently. Redirecting to http://google.com.', end(test))
    })

    test.end()
})

// todo: why?
// test.test('when accepting neither text or html it should respond with an empty body', test => {
//     const app = create()
//
//     app.use((req, res) =>
//         res.redirect('http://google.com'))
//
//     request(app)
//         .get('/')
//         .set('Accept', 'application/octet-stream')
//         .expect('location', 'http://google.com')
//         .expect('content-length', '0')
//         .expect(utils.shouldNotHaveHeader('Content-Type'))
//         .expect(302, '', end(test))
// })
