'use strict'

const test    = require('tap'),
      utils   = require('../support'),
      end     = utils.end,
      create  = utils.create,
      request = utils.request


test.test('yield *next should behave like Koa@1', test => {
    const app   = create(),
          calls = [],
          expected = [
              'one', 'two', 'three',
              'four', 'five'
          ]

    app.use(function *(next) {
        calls.push('one')
        yield *next
        calls.push('five')
    })

    app.use(function *(next) {
        calls.push('two')
        yield *next
        calls.push('four')
    })

    app.use((req, res) => {
        calls.push('three')

        let buf = '';
        res.setHeader('Content-Type', 'application/json')
        req.setEncoding('utf8')
        req.on('data', chunk => buf += chunk)
        req.on('end', () => res.end(buf))
    })

    request(app)
        .get('/')
        .set('Content-Type', 'application/json')
        .send('{"foo":"bar"}')
        .expect('Content-Type', 'application/json')
        .expect(200, '{"foo":"bar"}', err => {
            if (err)
                test.threw(err)
            else {
                test.same(calls, expected, 'control should flow downstream and then back upstream')
                test.end()
            }
        })
})
