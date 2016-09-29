'use strict'

const Ellipse = require('..'),
      app1    = new Ellipse,
      app2    = new Ellipse,
      app3    = new Ellipse

/*
    `app1` will use the default error handler shipped with Ellipse

    try:
    //localhost:3333/
 */
app1.get('/', next =>
    // statusCode and statusMessage can be set here
    // with extra arguments passed to `next(err, [status], [message])`
    next(new Error('fake'), 501, 'Too late...'))

// start app1
app1.listen(3333)

/*
    `app2` has a custom error handler and a router attached to '/error*'.
    errors will be caught from both `app2` and its sub-router

    try:
    //localhost:3334/
    //localhost:3334/error
 */
app2.get('/', () => {
    throw new Error('fake')
})

// create a sub-router in `app2` under the '/error*' route
var router = app2.mount('/error')

router.get('/', next => {
    // errors from sub-routers will bubble up to the parent router's error handler
    next(new Error('fake'))
})

// you can catch unhandled errors from middleware with `app.error(handler)`
app2.on('error', (err, ctx) => {
    // receive errors from `app2` and `router` here
    ctx.status = 500
    ctx.send('Ouch!')
})

// start app2
app2.listen(3334)

// app3

/*
    `app3` has a custom error handler and a router attached to '/error*'.
    an error handler is also set for the sub-router, so errors generated in
    the router will be handled separately from those which are coming from `app3`

    try:
    //localhost:3335/
    //localhost:3335/error
 */
app3.get('/', next => {
    next(new Error('fake'), 502)
})

// create a sub-router in `app3` under the '/error*' route
router = app3.mount('/error')

// throw an error when any request hits this router
router.all(() => {
    throw new Error('fake')
})

router.on('error', (err, ctx) => {
    // receive errors only from `router` here
    ctx.status = 500
    ctx.send('Something went wrong under the /error* route.')
})

// you can also use the `error` event directly to catch unhandled errors
app3.on('error', (err, ctx) => {
    // receive errors only from `app3` here
    ctx.status = 500
    ctx.send('Something went wrong.')
})

// start app3
app3.listen(3335)
