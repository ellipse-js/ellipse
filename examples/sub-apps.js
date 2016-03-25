/**
 * Created by schwarzkopfb on 15/9/14.
 */

'use strict'

var ellipse = require('../lib/ellipse'),
    website = ellipse(),
    blog    = ellipse(),
    api     = ellipse(),
    // we use this as a parent of our sub-apps
    // children will do logging for themselves
    app     = ellipse({ log: false })

// website

website.get('/', function (req, res) {
    res.body = 'Hello there!'
    res.body += [
        '\n',
        'try:',
        '/blog',
        '/blog/post/1',
        '/api/me',
        '/4oh4'
    ].join('\n')

    res.send()
})

// blog

blog.get('/', function (req, res) {
    res.send('It\'s our blog!')
})

blog.get('/post/:id', function (req, res) {
    res.send('Blog post #' + req.params.id)
})

blog.error(function (err, req, res) {
    res.send('Blog error!')
})

// api

api.get('/me', function (req, res) {
    res.json({
        name: 'John Doe',
        age: 22
    })
})

// add sub-apps

/*
    try:
    /blog
    /blog/post/1
    /api/me
    /4oh4
 */
app.use(website)
   .use('/api', api)
   .use('/blog', blog)

// 404

app.all(function () {
    this.status = 404
    this.send('Page not found!')
})

// 500

app.error(function (err, req, res) {
    console.log(err)

    res.send('App error!')
})

// start listening

app.listen(3333)
