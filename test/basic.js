'use strict'

const test    = require('tap'),
      helpers = require('./helpers'),
      end     = helpers.end,
      create  = helpers.create,
      request = helpers.request,
      app     = create()

test.plan(3)

app.get('/', ctx => {
    const res = ctx.res

    res.body = 'Hello World!'
    res.contentType('txt')

    res.set('X-Test', 'test')
    test.equals(res.get('X-test'), 'test', 'custom header should present')

    res.remove('x-Test')
    test.notOk(res.get('x-test'), 'custom header should not present')

    // test header(object)
    res.header({
        'x-test':   'test',
        'X-test-2': 'test2',
        'x-Test-3': 'test3'
    })
    // test remove(array)
    res.remove([ 'X-Test-2', 'X-Test-3' ])

    res.send()
})

request(app)
    .get('/')
    .expect('x-test', 'test')
    .expect(noHeader('x-test-2'))
    .expect(noHeader('x-test-3'))
    .expect('content-length', '12')
    .expect('etag', 'W/"c-Lve95gjOVATpfV8EL5X4nxwjKHE"')
    .expect('content-type', 'text/plain; charset=utf-8')
    .expect('x-powered-by', 'Ellipse/' + require('../package.json').version)
    .expect(200, 'Hello World!', end(test))

function noHeader(field) {
    return res => {
        if (field in res.headers)
            throw new Error(field + ' header should be removed')
    }
}
