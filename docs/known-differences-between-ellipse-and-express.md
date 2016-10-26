* `next('route')` not supported
* `res.format()` is not implemented
* `app.set()` and `app.get()` are not implemented
  * `app.set('json replacer')` does not affect `res.json()`
  * `app.set('json spaces', n)` does not affect `res.json()`
* `res.json(status, body)` and `res.json(body, status)` are not supported
