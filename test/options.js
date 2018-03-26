'use strict'

const test    = require('tap'),
      Ellipse = require('..'),
      helpers = require('./helpers'),
      end     = helpers.end,
      create  = helpers.create,
      request = helpers.request,
      onend   = end(test, 8),
      app     = create(),
      sub1    = Ellipse.Router(),
      sub2    = Ellipse.Router()

test.plan(1)

app.get('/', handler)
app.route('/1')
   .post(handler)
   .get(handler)
app.get('/2', handler)
app.put('/2', handler)
app.patch('/2', handler)
app.head('/2', handler)
app.route('/3')
   .post(handler)
   .delete(handler)

app.use('/4', sub1)
sub1.put('/', handler)

app.use(sub2)
sub2.patch('/5', handler)

sub2.mount('/6').get('/', handler)

doTest('/', 'GET,HEAD')
doTest('/1', 'POST,GET,HEAD')
doTest('/2', 'GET,PUT,PATCH,HEAD')
doTest('/3', 'POST,DELETE')
doTest('/4', 'PUT')
doTest('/5', 'PATCH')
doTest('/6', 'GET,HEAD')
doTest('/7', null, 404)

function doTest(path, body, status) {
    const req = request(app).options(path)

    if (body) {
        req.expect('allow', body)
        req.expect(body)
    }

    req.expect(status || 200, onend)
}

function handler() {
    test.fail('handler should not be executed')
}
