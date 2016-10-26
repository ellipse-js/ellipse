'use strict'

const test    = require('tap'),
      utils   = require('../utils'),
      end     = utils.end,
      create  = utils.create,
      request = utils.request

test.test('.get(field) should get the response header field', test => {
    const app = create()

    app.use((req, res) => {
        res.set('x-Test-1', 'test1')
        res.header('X-test-2', 'test2')
        res.setHeader({
            'x-TEST-3': 'test3'
        })
        res.send(res.get('X-TEST-1') + res.get('x-TeSt-2') + res.get('x-test-3'))
    })

    request(app)
        .get('/')
        .expect('x-test-1', 'test1')
        .expect('x-test-2', 'test2')
        .expect('x-test-3', 'test3')
        .expect(200, 'test1test2test3', end(test))
})
