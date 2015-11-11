var ellipse = require('.'),
    app     = ellipse()

app.use(function *(next) {
    console.log('mw1 start')
    yield next
    console.log('mw1 end')
})

app.use(function (next) {
    next()
})

app.use(function *(next) {
    console.log('mw2 start')
    yield next
    console.log('mw2 end')
})

var body = new Buffer('Hello World')

app.get('/', function *(ctx, next) {
    ctx.body = body
    yield ctx
})

app.put('/', function *() {
    this.body = body
    yield this
})

app.listen(3333)