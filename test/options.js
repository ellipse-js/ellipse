'use strict'

const request = require('supertest'),
      test    = require('tap'),
      Ellipse = require('..')

var app = new Ellipse

app.get('/', handler)
app.route('/1')
   .post(handler)
   .get(handler)
app.get('/2', handler)
app.put('/2', handler)
app.patch('/2', handler)
app.head('/2', handler)
app.route('/3')
   .get(handler)
   .post(handler)
   .delete(handler)
app.all('/4', handler)

test.plan(6)
test.tearDown(() => app.close())

app = app.listen()
doTest('/', 'GET')
doTest('/1', 'POST,GET')
doTest('/2', 'GET,PUT,PATCH,HEAD')
doTest('/3', 'GET,POST,DELETE')
doTest('/4', '*')
doTest('/5', '')

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
