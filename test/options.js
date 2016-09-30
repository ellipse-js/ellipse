'use strict'

const request = require('supertest'),
      test    = require('tap'),
      Ellipse = require('..')

var app  = new Ellipse,
    sub1 = Ellipse.Router(),
    sub2 = Ellipse.Router()

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

test.plan(8)
test.tearDown(() => app.close())

app = app.listen()
doTest('/', 'GET,HEAD')
doTest('/1', 'POST,GET,HEAD')
doTest('/2', 'GET,PUT,PATCH,HEAD')
doTest('/3', 'POST,DELETE')
doTest('/4', 'PUT')
doTest('/5', 'PATCH')
doTest('/6', 'GET,HEAD')
doTest('/7', '')

function doTest(path, body) {
    const req = request(app).options(path)

    if (body)
        req.expect('allow', body)

    req.expect(200, body, onend)
}

function handler() {
    test.fail('handler should not be executed')
}

function onend(err) {
    if (err)
        test.threw(err)
    else
        test.pass('expected method list returned')
}
