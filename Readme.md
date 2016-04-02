[![view on npm](http://img.shields.io/npm/v/ellipse.svg?style=flat-square)](https://www.npmjs.com/package/ellipse)
[![npm module downloads per month](http://img.shields.io/npm/dm/ellipse.svg?style=flat-square)](https://www.npmjs.com/package/ellipse)

# Ellipse

Unobtrusive web framework for [node.js](https://nodejs.org) that consolidates APIs of [Koa](http://koajs.com/) and [Express](http://expressjs.com/) yet performs better than both whilst maintains a relatively small footprint. 

## Features

  * Robust routing
  * Focus on high performance
  * HTTP helpers (redirection, caching, etc)
  * Content negotiation
  * Support for ES6 Generators
  * HTTP `Context`s

## Usage

```js

var Ellipse = require('ellipse'),
    app     = new Ellipse

app.get('/', function (req, res) {
    res.body = 'Hello Ellipse!'
    res.send()
})

app.get('/greet/:name', function (req, res) {
    res.send('<h1>Hello ' + req.params.name + '!</h1>')
})

app.on('not found', function(ctx, req, res) {
    res.status(404)
       .send('Page not found.')
})

app.listen(3333)

```

or

```js

const Ellipse = require('ellipse'),
      app     = new Ellipse({ respond: true })
      
app.get('/', function *(next) {
    this.body = 'Hello Ellipse!'
    yield *next
})

app.get('/greet/:name', function *(next) {
    this.html = `<h1>Hello ${this.params.name}!</h1>`
    yield *next
})

app.on('not found', function(ctx) {
    ctx.status = 404
    ctx.send('Page not found.')
})

app.listen(3333)

```

or

```js

const Ellipse = require('ellipse'),
      app     = new Ellipse

app.use(function (req, res, next) {
    req.sessionId = this.cookies.get('session')
    next()
})

app.use(function *(next) {
    this.user = yield *findUserBySessionId(this.request.sessionId)
    yield *next
})

app.use(function (next) {
    this.assert(this.user, 403)
    next()
})

app.get('/', function *() {
    this.body = this.user
    this.send()
})

app.listen(3333)

```

For more information, see [examples](https://github.com/schwarzkopfb/ellipse/blob/development/examples). 

## Installation

You're reading about the upcoming `v0.14` release-line of Ellipse which is in `alpha` state right now.

If you want to try out these new features introduced above, then you should use the `next` tag:

    npm install ellipse@next
    
Or simply install `v0.5` which is the latest release, considered as stable:
  
    npm install ellipse

## License

[MIT license](https://github.com/schwarzkopfb/ellipse/blob/master/LICENSE).