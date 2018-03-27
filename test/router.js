'use strict'

const test    = require('tap'),
      Ellipse = require('..'),
      app     = new Ellipse({ xPoweredBy: false }),
      sub     = new Ellipse.Router

test.plan(11)

function noop(a, b, c, d) {}

app.on('mount', () => test.pass('mount event should be emitted'))

sub.param('test', noop)

app.get('/test', noop)
app.get('/test2', noop)
app.post('/test', noop)

let expected = {
    GET: [ '/test', '/test2' ],
    POST: [ '/test' ]
}
test.same(app.routes, expected, 'routes should be added')
test.equals(app.length, 3, 'router.length should return the size of its stack')

test.equals(sub.app, undefined, 'router.app should be `undefined` until added into an app')

app.use('/test3', sub)
sub.get('/', noop)

test.equals(sub.app, app, 'router.app should be its parent after added into an app')
test.equals(sub.app, sub.application, 'router.application should be an alias to router.application')
test.equals(sub.parent, app, 'router.parent should be its parent after added into an app')

test.same(sub.routes, { GET: [ '/' ] }, 'sub-routes should be added')
expected = {
    subdomainOffset: 2,
    proxy: false,
    root: app.root,
    etag: 'weak',
    env: 'test'
}
test.same(expected, app.toJSON(), "app\'s json representation shoul differ from router\'s")
expected = {
    params: [ 'test' ],
    routes: {
        GET: [ '/' ]
    }
}
test.same(expected, sub.toJSON(), "router\'s json representation shoul differ from app\'s")
test.same(sub.toJSON(), sub.inspect(), 'router.inspect() should be an alias to router.toJSON()')
