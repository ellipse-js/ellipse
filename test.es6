/**
 * Created by schwarzkopfb on 15/10/27.
 */

///////////////////

var ellipse = require('./lib/ellipse'),
    //app     = new ellipse({ log: false }),
    app     = new ellipse({ log: true }),
    app2    = ellipse({ env: 'test', proxy: true })

//app.etag = false
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

app.use(function *(next) {
    var start = new Date
    yield next
    var ms = new Date - start
    console.log('< %s %s - %sms', this.req.method, this.req.url, ms, '>')
})

app2.get('/', function *() {
    this.test()
    this.send()
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

app.get('/search', function *() {
    this.send(this.search)
})

app.get('/search/:str', function *() {
    this.search = '?' + this.params.str
    this.send({
        search:      this.search,
        queryString: this.queryString,
        query:       this.query
    })
})

app.get('/cookie/:name/:value', function (req, res) {
    this.cookies.set(this.param.name, this.params.value)
    res.send('hey')
})

app.get('/cookie/:name', function (req, res) {
    res.send(this.cookies.get(this.param.name))
})

app.get('/ctx.app', function () {
    this.send(this.app)
    console.log(this.application)
})

app.get('/router', function () {
    this.send(ellipse.Router.prototype.toJSON.call(this.router))
})

app.delete('/test', function () {
    this.body = 'you deleted test'
    this.send()
})

app.get('/inspect', function (next) {
    console.log(this)
    this.body = 'see the log'
    this.respond = true
    next()
})

app.get('/code/:code', function *() {
    this.code = this.param.code
    this.send()
})

app.get('/message/:msg', function () {
    this.message = this.params.msg
    this.status  = 404
    this.send()
})

app.param('test', function* (next, test) {
    this.test = test
    yield next

    yield new Promise(function (resolve) {
        setTimeout(resolve, 3000)
    })

    console.log('param process after yield')
})

var fs = require('fs')

app.get('/redirect', function () {
    this.redirect('/fake')
})

app.get('/last-modified', function () {
    this.lastModified = new Date
    this.send('see the response headers')
})

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
    this.respond = true
    this.next()
})

app.get('/buffer', function () {
    this.body = new Buffer(1, 2, 3, 4, 5, 6, 7, 8)
    this.respond = true
    this.next()
})

app.get('/stream', function () {
    fs.createReadStream('./test.es6').pipe(this.response)
})

app.get('/stream2', function *() {
    this.set('content-type', 'text/js')
    this.body = fs.createReadStream(__filename)
    this.send()
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

app.get('/html', function *() {
    this.html = '<h1>Hello!</h1>'
    this.send()
})

app.get('/text', function (req, res) {
    res.set('content-type', 'text/plain; charset=utf-8')
    res.body = 'hello!'
    res.send()
})

app.get('/text2', function () {
    this.text = 'hello!'
    this.send()
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
    var stream = fs.createWriteStream('./test1.txt')
    this.pipe(stream)

    this.body = 'done!'
    this.send()
})

app.post('/cancel-upload', function *() {
    var stream = fs.createWriteStream('./test3.txt')
    this.pipe(stream)
    this.unpipe(stream)
    stream.close()

    this.body = 'canceled!'
    this.send()
})

app.post('/cancel-upload-lazy', function *() {
    var stream = fs.createWriteStream('./test3.txt')
    this.pipe(stream)
    stream.close()

    this.body = 'canceled!'
    this.send()
})

app.get('/file', function () {
    this.sendFile('./test.txt')
})

app.get('/path', function () {
    this.send(this.path)
})

app.get('/path/:value', function () {
    this.path = this.params.value
    this.send(this.path)
})

app.get('/path2/:value', function () {
    this.path = this.params.value + '?hey'
    this.send(this.path)
})

app.get('/length', function () {
    this.send(this.length || 'unknown')
})

app.get('/error', function () {
    this.assert(0, 'must be 1', 403)
})

app.get('/seeeet', function *() {
    this.set({
        A: 1,
        B: 2,
        c: 3
    })
    this.set('D', 'ok')
    this.send()
})

app.get('/attachment', function () {
    var file = './test2.es6'

    this.attachment(file, { root: '.' })
    this.sendFile(file, { root: '.' })
})

app.get('/download', function () {
    this.download('./test2.es6')
})

app.get('/header/:field', function () {
    this.json = { value: this.get(this.param.field) }
    this.set('X-Test', 'alma')
    this.remove('X-Test')
    this.set('test-x', [ 'hey', 'ho' ])
    this.set({
        'alma': 'fa'
    })
    this.send()
})

app.param('p', function (next, param) {
    this.p = param
    next()
})

app.route('/delegate/:p')
   .use(function (next) {
       this.type = 'text/css'
       next()
   })
   .get(function () {
       this.body = 'get delegate ' + this.p
       this.send()
   })
   .post(
       function (next) {
           this.type = 'text/js'
           next()
       },

       function () {
           this.body = 'post delegate' + this.param.p
           this.send()
       }
   )
   .put(function () {
       this.body = 'put delegate'
       this.send()
   })
   .delete(function () {
       this.body = 'delete delegate'
       this.send()
   })
   .all(function () {
       this.body = this.method + ' is not registered for ' + this.url
       this.send()
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
        this.respond = true
        this.next()
    }
)

//app.on('missing', function (ctx) {
//    ctx.status = 404
//    ctx.send('not found :(')
//})

app.on('not found', function (ctx) {
    ctx.status = 404
    ctx.send('not found :\'(')
})

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

var api = app.mount('/api')

api.param('id', function *(next, id) {
    console.log('param: id = ', id)

    this.user = yield getUserById(id)
    yield *next
})

api.get('/user/:id', function *() {
    this.assert(this.user, 404, 'No user found with the given id.')

    this.json = {
        status: 'success',
        data: this.user
    }

    this.send()
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

    res.message = message
    res.status(code).send()
})

//console.log(app.router.routes)

//app.on('error', function (err, ctx) {
//    console.log('app error')
//
//    ctx.status = err.status || 500
//    ctx.body   = ':\'('
//    ctx.send()
//})

app.listen(3333)