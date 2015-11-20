/**
 * Created by schwarzkopfb on 15/10/27.
 */

///////////////////

var ellipse = require('./lib/ellipse'),
    app     = new ellipse,
    app2    = ellipse({ env: 'test', proxy: true })

app.keys = [ 'tesztkulcs', 'masiktesztkulcs' ]

//ellipse.response.set = function (field, value) {
//    this.body += field + ': ' + value + '\n'
//}

app2.request.test = function () {
    console.log('app2 test')
}

app.request.test = function _____() {
    console.log('test')
}

ellipse.request.test2 = function () {
    console.log('test2')
}

ellipse.context.test = function () {
    this.req.test()
}

app.use('/app2', app2)

app2.get('/', function *() {
    this.test()
    yield this
})

app.get('/accepts', function *() {
    this.body = this.accepts()
    this.send()
})

app.get('/accepts/:type', function *() {
    this.body = this.accepts(this.param.type)
    this.send()
})

app.get('/acceptsEncodings', function *() {
    this.body = this.acceptsEncodings()
    this.send()
})

app.get('/acceptsCharsets', function *() {
    this.body = this.acceptsCharsets()
    this.send()
})

app.get('/acceptsCharsets/:set', function *() {
    this.body = this.acceptsCharsets(this.params.set)
    this.send()
})

app.get('/acceptsLanguages', function *() {
    this.body = this.acceptsLanguages()
    this.send()
})

app.get('/test', function () {
    this.test()
    this.send()
})

app.get('/cookie/:name/:value', function (req, res) {
    this.cookies.set(this.param.name, this.params.value)
    res.send('hey')
})

app.get('/cookie/:name', function (req, res) {
    res.send(this.cookies.get(this.param.name))
})

app.get('/inspect', function () {
    console.log(this)
    this.body = 'see the log'
    this.respond()
})

app.get('/code/:code', function *() {
    this.code = this.param.code
    yield this
})

app.get('/message/:msg', function *() {
    this.message = this.param.msg
    yield this
})

app.param('test', function* (next, test) {
    this.test = test
    yield next

    yield new Promise(function (resolve) {
        setTimeout(resolve, 3000)
    })

    console.log('param process after yield')
})

app.use(function *(next){
    var start = new Date;
    yield next
    var ms = new Date - start;
    console.log('%s %s - %sms', this.req.method, this.req.url, ms);
})

var fs = require('fs')

app.get('/test/:id', function *() {
    if(this.params.id !== '12')
        return this.redirect('/test/12')

    this.body    = '{ query: "' + this.queryString + '" }'
    this.code    = 401
    this.message = 'test'
    this.type    = 'application/json'

    yield this
})

app.get('/q', function *() {
    this.body = this.query
    yield this
})

app.get('/h', function () {
    this.test()
    this.req.test2()

    this.body = this.get('content-type')
    this.respond()
})

app.get('/buffer', function () {
    this.body = new Buffer(1, 2, 3, 4, 5, 6, 7, 8)
    this.respond()
})

app.get('/stream', function () {
    fs.createReadStream('./test.es6').pipe(this)
})

app.get('/stale', function () {
    this.send({ stale: this.stale })
})

app.get('/fresh', function () {
    this.send({ fresh: this.fresh })
})

app.get('/query', function (req, res) {
    console.log(req.queryString)
    console.log(req.query)
    req.queryString = 'malac=ka'
    console.log(req.queryString)
    console.log(req.query)
    this.send()
})

app.get('/stream2', function *() {
    this.set('content-type', 'text/js')
    this.body = fs.createReadStream(__filename)
    yield this
})

app.get('/html', function *() {
    this.html = '<h1>Hello!</h1>'
    yield this
})

app.get('/text', function (req, res) {
    res.send('hello!')
})

app.get('/json', function () {
    this.res.json({ hello: '!' })
})

app.get('/json2', function () {
    this.json = { hello: '!' }
    this.send()
})

app.get('/json3', function () {
    this.json = '{"test":42}'
    this.send()
})

app.get('/socket', function () {
    console.log(this.socket)
    this.send('hey')
})

app.post('/is', function () {
    this.body = this.is()
    this.send()
})

app.post('/is/:type', function () {
    this.body = this.is(this.param.type)
    this.send()
})

app.post('/upload', function *() {
    var stream = fs.createWriteStream('./test.txt')
    this.pipe(stream)
})

app.get('/file', function () {
    this.sendFile('./test.txt', { root: __dirname })
})

app.get('/error', function () {
    this.assert(0, 'must be 1', 403)
})

app.get(
    '/:test',

    function* (next) {
        console.log('first')
        yield next
        console.log('first ended')
    },

    function (req, res, next) {
        console.log('second')
        next()
    },

    function* (ctx, next) {
        console.log('third')

        ctx.body = 'hello '
        yield next

        console.log('third resumed')

        var p = new Promise(function (resolve) {
            setTimeout(resolve, 500)
        })

        yield p

        console.log('third ended')
    },

    function* (req, res, next) {
        yield next

        console.log('mid resumed')

        var p = new Promise(function (resolve) {
            setTimeout(resolve, 500)
        })

        yield p

        console.log('mid ended')
    },

    function () {
        console.log('fourth')
        this.body += 'generators'
        this.respond()
    }
)

function getUserById(id, callback) {
    var p = new Promise(function (resolve) {
        setTimeout(function () {
            if(id == 1)
                resolve({ id: id, name: 'Peti' })
            else
                resolve(null)
        }, 100)
    })

    if(callback instanceof Function)
        p.then(function (result) {
            callback(null, result)
        }).catch(callback)

    return p
}

var api = app.sub('/api')

api.param('id', function *(next, id) {
    this.user = yield getUserById(id)
    yield next
})

api.get('/user/:id', function *() {
    this.assert(this.user, 404, 'No user found with the given id.')

    this.json = {
        status: 'success',
        data: this.user
    }

    yield this
})

api.put('/user/:id', function (req, res) {
    if(this.user)
        res.json({ status: 'success', data: this.user })
    else
        res.throw(404)
})

api.get('/error', function (req, res, next) {
    next(new Error('test error'))
})

api.error(function (err, req, res) {
    var code    = err.status || 500,
        message = err.message

    if(code === 500) {
        console.error(err.stack || err)
        message = 'Internal Server Error'
    }

    res.body = { status: 'error' }

    if(message)
        res.body.message = message

    res.status(code).send()
})

//console.log(app.router.routes)

//app.on('error', function (err, ctx) {
//    console.log('app error')
//
//    ctx.status = err.status || 500
//    ctx.body   = ':\'('
//    ctx.respond()
//})

app.listen(3333)