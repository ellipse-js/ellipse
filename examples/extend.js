/**
 * Created by schwarzkopfb on 15/9/15.
 */

'use strict'

var ellipse = require('../'),
    app     = ellipse()

// extend app prototype

ellipse.application.figureOutPortAndListen = function (callback) {
    var port = +process.argv[ 2 ] || +process.env.PORT || 3333

    // note that `this` refers to an `Ellipse` instance instead of `ctx`
    this.listen(port, callback)
}

// extend router prototype

// totally useless, just for demonstration
ellipse.router.wait = function (seconds) {
    // note that `this` refers to a `Router` instance instead of `ctx`
    this.all(function (req, res, next) {
        setTimeout(next, seconds * 1000)
    })
}

// it'll be overridden by `app.success`
ellipse.response.success = function () {
    this.send('success!')
}

// extend response prototype with some helper utils that are useful for REST APIs

app.response.error = function (code, message) {
    // note that `this` refers to `res` instead of `ctx`
    this.status(code, message).json({
        status: 'error',
        message: message
    })
}

app.response.success = function (result) {
    var resp = {
        status: 'success'
    }

    if(arguments.length)
        resp.data = result

    // note that `this` refers to `res` instead of `ctx`
    this.json(resp)
}

// object containing example data

var db = {
    users: {
        '1': {
            id: 1,
            name: 'John Doe'
        }
    }
}

app.param('id', function (req, res, next, id) {
    req.user = db.users[ id ]
    next()
})

app.get('/', function *() {
    this.body = [
        'try:',
        '/api/user/1',
        '/api/user/2'
    ].join('\n')

    this.send()
})

// extensions of `router` will also appear on `app`,
// because app inherits from router
app.wait(.5)

/*
    try:
    /api/user/1
    /api/user/2
 */
app.get('/api/user/:id', function (req, res) {
    if(req.user)
        res.success(req.user)
    else
        res.error(404, 'No user found with the given id.')
})

// start listening
app.figureOutPortAndListen(function () {
    console.log('server is ready to accept connections on port 3333')
})

// `app2`'s purpose is to demonstrate that `app.response.success`
// doesn't affect `ellipse.response.success`
var app2 = ellipse()

app2.all(function () {
    // this should send 'success!'
    this.res.success()
})

app2.listen(3334)
