* `next('route')` not supported
* `res.format(...)` is not implemented
* `app.set(...)` and `app.get(...)` are not implemented
  * `app.set('json replacer')` does not affect `res.json(...)`
  * `app.set('json spaces', ...)` does not affect `res.json(...)`
* `res.json(status, body)` and `res.json(body, status)` signatures are not supported - use `res.status(...).json(...)`
* `JSONP` is not supported (`res.jsonp(...)` is not implemented)
* render engine support is not included in Ellipse core (`app.set('view engine', ...)`, `res.render(...)` and `res.locals` are not implemented) - use the `ellipse-render` package
* `res.redirect(status, ...)` signature is not supported
