'use strict'

const fs      = require('fs'),
      request = require('supertest'),
      test    = require('tap'),
      text    = fs.readFileSync(__filename, 'utf8'),
      length  = Buffer.byteLength(text).toString()

var app = require('../')()

app.root = __dirname

app.get('/', function () {
    this.sendFile('./sendFile.js')
})

test.plan(1)

request(app = app.listen())
    .get('/')
    .expect(200)
    .expect('content-type', 'application/javascript')
    .expect('content-length', length)
    .expect(text, err => {
        if (err)
            test.threw(err)
        else {
            test.pass('file received')
            app.close()
        }
    })
