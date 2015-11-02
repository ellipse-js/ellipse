/**
 * Created by schwarzkopfb on 15/10/27.
 */

///////////////////

var app = require('./lib/ellipse')()

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
        this.redirect('/test/12')

    this.body    = '{ query: "' + this.queryString + '" }'
    this.code    = 401
    this.message = 'test'
    this.type    = 'application/json'

    this.respond()
})

app.get('/stream-test', function () {
    //var ctx = this

    fs.createReadStream('./test.es6').pipe(this)//.emit('error', Error('fake'))
})

app.get('/stream-test2', function () {
    this.body = fs.createReadStream('./test.es6')

    this.respond()
})

app.get('/upload', function *() {
    var req = this.req

    //setTimeout(function () {
    //    req.emit('error', 'fake error')
    //}, 1000)

    this.next()

    //req.on('error', this.next)
})

app.post('/upload', function *(next) {
    var req    = this.req,
        stream = fs.createWriteStream('./test.txt')

    //setTimeout(function () {
    //    req.emit('error', 'fake error')
    //}, 1000)

    this.pipe(stream)
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

    function* (next) {
        console.log('third')

        this.body = 'hello '
        yield next

        console.log('third resumed')

        var p = new Promise(function (resolve) {
            setTimeout(resolve, 500)
        })

        yield p

        console.log('third ended')
    },

    function* (next) {
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

function getUserById(id) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            if(id == 1)
                resolve({ id: id, name: 'Peti' })
            else
                resolve(null)
        }, 100)
    })
}

app.get('/user/:id', function *() {
    var user = yield getUserById(this.req.params.id)

    if(user)
        this.res.json({ status: 'success', data: user })
    else
        this.throw(404, { status: 'error', message: 'No user found with the given id.' })
})

app.get('/user/:id', function (req, res, next) {
    getUserById(this.req.params.id, function (err, user) {
        if(err)
            next(err)
        else if(user)
            res.json({ status: 'success', data: user })
        else
            res.throw(404, { status: 'error', message: 'No user found with the given id.' })
    })
})

app.listen(3333)