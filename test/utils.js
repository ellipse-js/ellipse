'use strict'

const test = require('tap')

if (!module.parent)
    return test.pass('not really a test')

exports.end     = endTest
exports.merge   = merge
exports.create  = createApp
exports.request = createRequest
exports.shouldNotHaveHeader = shouldNotHaveHeader

const request = require('supertest'),
      Ellipse = require('..'),
      servers = []

test.tearDown(() => servers.forEach(s => s.close()))

function createApp(opts) {
    const app    = new Ellipse,
          server = app.listen()

    app.server = server
    servers.push(server)
    return app
}

function createRequest(app) {
    return request(app.server)
}

function merge(a, b) {
    Object.keys(b).forEach(k => a[ k ] = b[ k ])
    return a
}

function shouldNotHaveHeader(field) {
    return res => {
        if (field in res.headers)
            throw new Error(field + ' header should not present in response')
    }
}

function endTest(test) {
    return err => {
        if (err)
            test.threw(err)
        else
            test.end()
    }
}
