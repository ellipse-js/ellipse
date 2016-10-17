[![view on npm](http://img.shields.io/npm/v/ellipse.svg?style=flat-square)](https://www.npmjs.com/package/ellipse)
[![npm module downloads per month](http://img.shields.io/npm/dm/ellipse.svg?style=flat-square)](https://www.npmjs.com/package/ellipse)
[![node version](https://img.shields.io/badge/node-%3E%3D%204-brightgreen.svg?style=flat-square)](https://nodejs.org/download)
[![build status](https://img.shields.io/travis/ellipse-js/ellipse.svg?style=flat-square)](https://travis-ci.org/ellipse-js/ellipse)
[![test coverage](https://img.shields.io/coveralls/ellipse-js/ellipse.svg?style=flat-square)](https://coveralls.io/github/ellipse-js/ellipse)
[![license](https://img.shields.io/npm/l/express.svg?style=flat-square)](/LICENSE)

# Ellipse

Unobtrusive web framework that consolidates APIs of [Koa](http://koajs.com/) and [Express](http://expressjs.com/).

## Features

  * Robust routing
  * Focus on high performance
  * HTTP helpers (redirection, caching, etc.)
  * Content negotiation
  * Centralised error handling
  * Support for generator and async middleware
  * Use of contexts

## Usage

```js

const Ellipse = require('ellipse'),
      app     = new Ellipse

app.use(function(req, res, next) {
    req.sessionId = this.cookies.get('session')
    next()
})

app.use(async (req, res, next) => {
    req.user = await findUserBySessionId(req.sessionId)
    next()
})

app.get('/', (req, res) => {
    res.send('Hello Ellipse!')
})

app.get('/me', (req, res) => {
    res.json(req.user)
})

app.get('/greet/:name', function *(next) {
    this.html = `<h1>Hello ${this.params.name}!</h1>`
    yield doSomething()
    this.send()
})

app.on('notFound', ctx => {
    ctx.status = 404
    ctx.send('Page not found.')
})

app.listen(3333)

```

For more information, take a look at the [examples](/examples) folder.

Note: `this` refers to a context object - except in arrow functions. Context is similar but not quite identical to [Koa's](http://koajs.com/#context).

Please consider that `async` is not yet supported natively by Node, so you need to [transpile](http://babeljs.io) it until this feature arrives. [This](/examples/async) shows how to do that.

## Installation

You're reading about the upcoming `v0.18` release-line of Ellipse which is `alpha` software.
If you want to try out these new features presented above, then you should use the `next` tag:

    npm install ellipse@next

Or simply install `v0.5` which is the latest version, considered as stable.
But please notice that, those early versions (`<=0.5`) are deprecated and no longer supported.

    npm install ellipse

## Tests and benchmarks

Clone the repo, `npm install` and then `npm test` or `npm run benchmarks`.

## License

[MIT license](/LICENSE).
