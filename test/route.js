'use strict'

const test = require('tap'),
      app  = require('..')({ xPoweredBy: false })

app.get('/', () => {})

const route = app.stack[ 0 ]

test.equals(route.router, app, 'route.router should be set')
test.equals(route.length, 1, 'route.length should represent the handler count of a route')
test.equals(route.method, 'GET', 'route.method should be set')
test.equals(route.path, '/', 'route.path should be set')
test.equals(route.all, false, 'route.all should be set')
test.equals(route.wildcard, false, 'route.wildcard should be set')

const expected = {
    method: 'GET',
    path: '/',
    handlerCount: 1
}
test.same(route.toJSON(), expected, 'route.toJSON() should represent a route')
test.same(route.toJSON(), route.inspect(), 'route.toJSON() and route.inspect() shpuld be aliases')
