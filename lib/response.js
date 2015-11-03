/**
 * Created by schwarzkopfb on 15/9/12.
 */

var http        = require('http'),
    Stream      = require('stream'),
    proto       = http.ServerResponse.prototype,
    statusCodes = http.STATUS_CODES,
    send        = require('send'),
    escapeHtml  = require('escape-html'),
    onFinished  = require('on-finished'),
    Context     = require('./context'),
    production  = process.env.NODE_ENV === 'production'

Object.defineProperties(proto, {
    body: {
        get: function () {
            return this._body || ''
        },

        set: function (value) {
            this._body = value
        }
    },

    send: {
        writable: true, // *
        
        value: function send(body) {
            var status  = this.statusCode || 200,
                message = this.statusMessage || statusCodes[ status ],
                headers = this.headers || {},
                type    = headers[ 'Content-Type' ] || 'text/plain; charset=utf8',
                length  = this.length

            this.headers = headers

            if(!body)
                body = ''

            if(!length) {
                if (body instanceof Buffer)
                    length = body.length
                else if (typeof body === 'string')
                    length = Buffer.byteLength(body)
                else if(!(body instanceof Stream))
                    length = 0
            }

            if(length !== undefined)
                headers[ 'Content-Length' ] = length

            if(!~type.indexOf('charset'))
                type += '; charset=utf8'

            headers[ 'Content-Type' ] = type

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
                if(body instanceof Stream)
                    body.pipe(this)
                else
                    this.end(body)
            }
            else
                this.end()

            return this
        }
    },

    status: {
        writable: true, // *

        value: function status(code, message) {
            var res = this

            if(this instanceof Context)
                res = this.res

            res.statusCode    = code
            res.statusMessage = message || statusCodes[code]

            return this
        }
    },

    set: {
        writable: true, // *

        value: function set(field, value) {
            var res = this

            if(this instanceof Context)
                res = this.res

            if(!res.headers)
                res.headers = {}

            res.headers[ capitalizeHeaderField(field) ] = value

            return this
        }
    },

    get: {
        writable: true, // *

        value: function get(field) {
            var res = this

            if(this instanceof Context)
                res = this.res

            if(!res.headers)
                res.headers = {}

            return res.headers[ capitalizeHeaderField(field) ]
        }
    },

    remove: {
        value: function (field) {
            var res = this

            if(this instanceof Context)
                res = this.res

            delete res.headers[ capitalizeHeaderField(field) ]

            return this
        }
    },

    json: {
        writable: true, // *

        value: function json(value) {
            var res = this

            if(this instanceof Context)
                res = this.res

            if(production)
                var body = JSON.stringify(value)
            else
                body = JSON.stringify(value, null, 4)

            if(!res.get('content-type'))
                res.set('content-type', 'application/json')

            res.send(body)

            return this
        }
    },

    html: {
        writable: true, // *

        value: function html(body) {
            var res = this

            if(this instanceof Context)
                res = this.res

            if(!res.get('content-type'))
                res.set('content-type', 'text/html')

            res.send(body)

            return this
        }
    },

    redirect: {
        writable: true, // *

        value: function redirect(url) {
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

            var res = this

            if(res instanceof Context)
                res = this.res

            res.status(302).set('location', url).send(body)

            return this
        }
    },

    sendFile: {
        writable: true, // *

        value: function sendFile(path, options, callback) {
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
        }
    }
})

// *: let Express overwrite it,
//    this allows Express and Ellipse to be used together

// utils

function capitalizeHeaderField(field) {
    return field.split('-').map(function (part) {
        return part[ 0 ].toUpperCase() + part.substring(1).toLowerCase()
    }).join('-')
}

function isAbsolute(path) {
    if ('/' == path[0]) return true
    if (':' == path[1] && '\\' == path[2]) return true
    if ('\\\\' == path.substring(0, 2)) return true // Microsoft Azure absolute path
}

// pipe the send file stream
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
