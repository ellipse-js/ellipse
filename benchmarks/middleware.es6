/**
 * Created by schwarzkopfb on 15/11/15.
 */

var ellipse = require('..'),
    app     = ellipse()

// number of middleware

var n = parseInt(process.env.MW || '1', 10)
console.log(`  ${n} middleware`)

//while (c--)
//    app.use(next => next())

var mw = []
while (n--)
    mw.push(function *(ctx, req, res, next) {
        if (!ctx.state.i)
            ctx.state.i = 0

        ctx.state.i++
        ctx.body += ctx.state.i + ' '

        yield *next
    })

var body = new Buffer('Hello World')

app.use(compose(mw))

app.use(function *(ctx) {
    //ctx.body = body
    ctx.send()
})

app.listen(3333)


//////////


function compose(middleware) {
    return function *(ctx, req, res, done) {
        var next = noop()

        var i = middleware.length;

        while (i--)
            next = middleware[i].call(ctx, ctx, req, res, next)

        yield *next
        done()
    }
}

function *noop() {}
