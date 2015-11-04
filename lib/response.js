/**
 * Created by schwarzkopfb on 15/9/12.
 */

var http        = require('http'),
    Stream      = require('stream'),
    send        = require('send'),
    escapeHtml  = require('escape-html'),
    onFinished  = require('on-finished'),
    Context     = require('./context'),
    slice       = Array.prototype.slice,
    proto       = http.ServerResponse.prototype,
    statusCodes = http.STATUS_CODES

// property descriptor base of prototype

var descriptor = {
    body: {
        get: function () {
            return this._body || ''
        },

        set: function (value) {
            this._body = value
        }
    }
}

// helper function to define methods with bound `this` on prototype

function defineMethod(name, fn, chainable, overwritable) {
    var member = descriptor[ name ] = {}

    member[ 'get' ] = function () {
        var res = this

        return function () {
            var value = fn.apply(res, arguments)
            return chainable ? this : value
        }
    }

    if(overwritable) {
        member.configurable = true

        member[ 'set' ] = function (fn) {
            var res = this

            if (res instanceof Context)
                res = this.res

            res[ name ] = fn
        }
    }
}

// define methods

defineMethod('set', function (field, value) {
    if(!this.headers)
        this.headers = {}

    this.headers[ capitalizeHeaderField(field) ] = value
}, true, true)

defineMethod('send', function send(body) {
    body = body || this.body

    var status  = this.statusCode || 200,
        message = this.message || this.statusMessage || statusCodes[ status ],
        headers = this.headers || {},
        type    = 'text/plain',
        length  = this.length,
        kind    = bodyType(body)

    if(kind === 'object') {
        type = 'application/json'
        body = jsonToString(body, this.app.env)
        kind = 'string'
    }
    else if(kind === 'stream' || kind === 'buffer')
        type = 'application/octet-stream'

    if(!length)
        switch(kind) {
            case 'buffer':
                length = body.length
                break

            case 'string':
                length = Buffer.byteLength(body)
                break

            default:
                if(kind !== 'stream')
                    length = 0
        }

    var contentType = headers[ 'Content-Type' ] || type

    if(kind === 'string' && !~contentType.indexOf('charset'))
        contentType += '; charset=utf8'

    if(!headers[ 'Content-Length' ] && length !== undefined)
        headers[ 'Content-Length' ] = length

    headers[ 'Content-Type' ] = contentType

    // freshness
    if (this.req.fresh)
        this.statusCode = status = 304

    // strip irrelevant headers
    if (status === 204 || status === 304) {
        delete headers[ 'Content-Type' ]
        delete headers[ 'Content-Length' ]
        delete headers[ 'Transfer-Encoding' ]
        body = ''
    }

    this.writeHead(status, message, headers)

    if(this.req.method !== 'HEAD') {
        if(kind === 'stream')
            body.pipe(this)
        else
            this.end(body)
    }
    else
        this.end()
}, true, true) // is it ok if users can overwrite it?

defineMethod('status', function status(code, message) {
    this.statusCode    = code
    this.statusMessage = message || statusCodes[ code ]
}, true, true)

defineMethod('get', function get(field) {
    if(!this.headers)
        this.headers = {}

    return this.headers[ capitalizeHeaderField(field) ]
}, false, true)

defineMethod('remove', function remove(field) {
    delete this.headers[ capitalizeHeaderField(field) ]
}, true) // maybe let user overwrite it?

defineMethod('json', function (body) {
    if(!this.get('content-type'))
        this.set('content-type', 'application/json')

    this.send(jsonToString(body, this.app.env))
}, true) // maybe let user overwrite it?

defineMethod('html', function html(body) {
    if(!this.get('content-type'))
        this.set('content-type', 'text/html')

    this.send(body)
}, true, true)

defineMethod('redirect', function redirect(url) {
    var req     = this.req,
        message = statusCodes[ 302 ],
        body

    switch (req.headers[ 'accept' ]) {
        case 'text/plain':
        case 'text/*':
            this.set('content-type', 'text/plain')

            body = message + '. Redirecting to ' + encodeURI(url)
            break

        case 'text/html':
        case '*/*':
            this.set('content-type', 'text/html')

            var u = escapeHtml(url)
            body  = '<p>' + message + '. Redirecting to <a href="' + u + '">' + u + '</a></p>'
            break

        default:
            body = ''
            break
    }

    this.status(302)
        .set('location', url)
        .send(body)
}, true, true)

defineMethod('throw', function (code, message) {
    var err = new Error()

    slice.call(arguments).forEach(function (arg) {
        if(arg instanceof Error) {
            if(err.status)
                arg.status = err.status

            if(err.message)
                arg.message = err.message

            err = arg
        }
        else if(typeof arg === 'string')
            err.message = arg
        else if(typeof arg === 'number')
            err.status = arg
    })

    throw err
}) // chaining makes no sense here

defineMethod('assert', function assert(value, code, message) {
    if(value) return
    var args = slice.call(arguments, 1)
    this.throw.apply(this, args)
}, true)

/**
 * Respond request with a file.
 * Ported from Express (https://github.com/strongloop/express)
 *
 * @param path {string} File path
 * @param options {object} An object containing options
 * @param callback
 */
defineMethod('sendFile', function sendFile(path, options, callback) {
    var done = callback,
        req  = this.req,
        res  = this,
        next = req.next,
        opts = options || {}

    if (!path)
        throw new TypeError('path argument is required to res.sendFile')

    // support function as second arg
    if (options instanceof Function) {
        done = options
        opts = {}
    }

    if (!opts.root && !isAbsolute(path))
        throw new TypeError('path must be absolute or specify root to res.sendFile')

    // create file stream
    var pathname = encodeURI(path),
        file     = send(req, pathname, opts)

    // transfer
    sendfile(res, file, opts, function (err) {
        if (done) return done(err)

        if (err && err.code === 'EISDIR')
            return next()

        // next() all but write errors
        if (err && err.code !== 'ECONNABORTED' && err.syscall !== 'write')
            next(err)
    })
}, true, true)

Object.defineProperties(proto, descriptor)

// utils

function capitalizeHeaderField(field) {
    return field.split('-').map(function (part) {
        return part[ 0 ].toUpperCase() + part.substring(1).toLowerCase()
    }).join('-')
}

/**
 * Check the given path is absolute or not
 * Ported from Express (https://github.com/strongloop/express)
 *
 * @param path {string} The path to check
 * @returns {boolean} Returns true if path is absolute.
 */
function isAbsolute(path) {
    if ('/' == path[0]) return true
    if (':' == path[1] && '\\' == path[2]) return true
    if ('\\\\' == path.substring(0, 2)) return true // Microsoft Azure absolute path
}

function bodyType(body) {
    if(body instanceof Object) {
        if(body instanceof Buffer)
            return 'buffer'
        else if(body instanceof Stream)
            return 'stream'
        else
            return 'object'
    }
    else
        return typeof body
}

function jsonToString(obj, env) {
    if(env !== 'production' && env !== 'test')
        return JSON.stringify(obj, null, 4)
    else
        return JSON.stringify(obj)
}

/**
 * Pipe the send file stream
 * Ported from Express (https://github.com/strongloop/express)
 *
 * @param res {http.ServerResponse} The actual response object
 * @param file
 * @param options
 * @param callback
 */
function sendfile(res, file, options, callback) {
    var done = false,
        streaming

    // request aborted
    function onaborted() {
        if (done)
            return

        done = true

        var err = new Error('Request aborted')
        err.code = 'ECONNABORTED'
        callback(err)
    }

    // directory
    function ondirectory() {
        if (done) return;
        done = true;

        var err = new Error('EISDIR, read');
        err.code = 'EISDIR';
        callback(err);
    }

    // errors
    function onerror(err) {
        if (done)
            return

        done = true
        callback(err)
    }

    // ended
    function onend() {
        if (done)
            return

        done = true
        callback()
    }

    // file
    function onfile() {
        streaming = false
    }

    // finished
    function onfinish(err) {
        if (err && err.code === 'ECONNRESET') return onaborted()
        if (err) return onerror(err)
        if (done) return

        setImmediate(function () {
            if (streaming !== false && !done) {
                onaborted()
                return
            }

            if (done)
                return

            done = true
            callback()
        })
    }

    // streaming
    function onstream() {
        streaming = true
    }

    file.on('directory', ondirectory)
    file.on('end', onend)
    file.on('error', onerror)
    file.on('file', onfile)
    file.on('stream', onstream)
    onFinished(res, onfinish)

    if (options.headers)
        // set headers on successful transfer
        file.on('headers', function headers(res) {
            var obj  = options.headers,
                keys = Object.keys(obj)

            for (var i = 0, l = keys.length; i < l; i++) {
                var k = keys[i]
                res.setHeader(k, obj[k])
            }
        })

    // pipe
    file.pipe(res)
}

// expose

module.exports = proto
