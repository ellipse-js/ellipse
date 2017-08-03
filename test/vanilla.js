'use strict'

const http    = require('http'),
      test    = require('tap'),
      request = require('supertest'),
      Ellipse = require('..'),
      app1    = new Ellipse,
      app2    = new Ellipse.Router,
      server1 = http.createServer(app1.callback()).listen(),
      server2 = http.createServer(app2.callback()).listen()

app1.get('/test1', handle)
app1.use('/test2', app2)

app2.get('/', handle)
app2.get('/test3', handle)

test.plan(3)
test.tearDown(() => {
    server1.close()
    server2.close()
})

get(server1, '/test1')
get(server1, '/test2')
get(server2, '/test3')

function get(server, path) {
    request(server)
        .get(path)
        .expect(200, 'ok', onend)
}

function handle(req, res, next) {
    res.body = 'ok'
    res.send()
}

function onend(err) {
    if (err)
        test.threw(err)
    else
        test.pass('response received')
}
