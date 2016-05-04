[![view on npm](http://img.shields.io/npm/v/ellipse.svg?style=flat-square)](https://www.npmjs.com/package/ellipse)
[![npm module downloads per month](http://img.shields.io/npm/dm/ellipse.svg?style=flat-square)](https://www.npmjs.com/package/ellipse)

# Ellipse

Unobtrusive web framework for [node.js](https://nodejs.org) that consolidates APIs of [Koa](http://koajs.com/) and [Express](http://expressjs.com/) yet performs better than both, whilst maintains a relatively small footprint. 

## Features

  * Robust routing
  * Focus on high performance
  * HTTP helpers (redirection, caching, etc)
  * Content negotiation
  * Support for ES6 Generators
  * HTTP Contexts

## Usage

```js

const Ellipse = require('ellipse'),
      app     = new Ellipse

app.use(function(req, res, next) {
    req.sessionId = this.cookies.get('session')
    next()
})

app.use(function *(next) {
    this.user = yield *findUserBySessionId(this.request.sessionId)
    yield *next
})

app.get('/', (req, res) => {
    res.send('Hello Ellipse!')
})

app.all('/me', function(next) {
    this.assert(this.user, 403)
    next()
})

app.get('/me', function *(next) {
    this.body = this.user
    yield *next
})

app.get('/greet/:name', function *(next) {
    this.html = `<h1>Hello ${this.params.name}!</h1>`
    yield *next
})

app.on('not found', ctx => {
    ctx.status = 404
    ctx.send('Page not found.')
})

app.listen(3333, () =>
    console.log('Server is ready to accept incoming connections on port 3333'))

```

For more information, see [examples](https://github.com/schwarzkopfb/ellipse/blob/development/examples). 

## Installation

You're reading about the upcoming `v0.15` release-line of Ellipse which is `alpha` software.

If you want to try out these new features presented above, then you should use the `next` tag:

    npm install ellipse@next
    
Or simply install `v0.5` which is the latest version, considered as stable:
  
    npm install ellipse

## License

[MIT license](https://github.com/schwarzkopfb/ellipse/blob/master/LICENSE).