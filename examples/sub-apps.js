/**
 * Created by schwarzkopfb on 15/9/14.
 */

var ellipse = require('../lib/ellipse'),
    website = ellipse(),
    blog    = ellipse(),
    api     = ellipse(),
    app     = ellipse()

// website

website.get('/', function (req, res) {
    res.send('Hello there!')
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

// 500

app.error(function (err, req, res) {
    console.log(err)

    res.send('App error!')
})

// app

app.use(website)
   .use('/blog', blog)
   .use('/api', api)
   .listen(3333)
