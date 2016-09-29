[![view on npm](http://img.shields.io/npm/v/ellipse.svg?style=flat-square)](https://www.npmjs.com/package/ellipse)
[![npm module downloads per month](http://img.shields.io/npm/dm/ellipse.svg?style=flat-square)](https://www.npmjs.com/package/ellipse)
[![node version](https://img.shields.io/badge/node-%3E%3D%204-brightgreen.svg?style=flat-square)](https://nodejs.org/download)
[![build status](https://img.shields.io/travis/ellipse-js/ellipse.svg?style=flat-square)](https://travis-ci.org/ellipse-js/ellipse)
[![test coverage](https://img.shields.io/coveralls/ellipse-js/ellipse.svg?style=flat-square)](https://coveralls.io/github/ellipse-js/ellipse)
[![license](https://img.shields.io/npm/l/express.svg?style=flat-square)](/LICENSE)

# Ellipse

Unobtrusive web framework for [node](https://nodejs.org) that consolidates APIs of [Koa](http://koajs.com/) and [Express](http://expressjs.com/) whilst performs better than both.

## Features

  * Robust routing
  * Focus on high performance
  * HTTP helpers (redirection, caching, etc.)
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

app.get('/me', function(next) {
    this.json(this.user)
})

app.get('/greet/:name', function *(next) {
    this.html = `<h1>Hello ${this.params.name}!</h1>`
    this.send()
})

app.on('notFound', ctx => {
    ctx.status = 404
    ctx.send('Page not found.')
})

app.listen(3333)

```

For more information, see the [examples](/examples) folder.

## Installation

You're reading about the upcoming `v0.18` release-line of Ellipse which is `alpha` software.
If you want to try out these new features presented above, then you should use the `next` tag:

    npm install ellipse@next

Or simply install `v0.5` which is the latest version, considered as stable.
But please note that, those early versions (`<=0.5`) are deprecated and no longer supported.

    npm install ellipse

## License

[MIT license](/LICENSE).
