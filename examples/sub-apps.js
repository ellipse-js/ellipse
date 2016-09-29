'use strict'

const ellipse = require('..'),
      website = ellipse(),
      blog    = ellipse(),
      api     = ellipse(),
      app     = ellipse()

// website

website.get('/', (req, res) => {
    res.type('text/plain')
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

blog.get('/', (req, res) => {
    res.send('It\'s our blog!')
})

blog.get('/post/:id', (req, res) => {
    res.send('Blog post #' + req.params.id)
})

blog.on('error', (err, ctx) =>
    ctx.send('Blog error!'))

// api

api.get('/me', (req, res) =>
    res.json({
        name: 'John Doe',
        age: 22
    }))

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

app.on('error', (err, ctx) =>
    ctx.send('App error!'))

// start listening

app.listen(3333)
