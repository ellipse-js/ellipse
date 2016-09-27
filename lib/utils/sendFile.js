'use strict'

// expose

module.exports = sendFile

// includes

const onFinished = require('on-finished')

// method

/**
 * Pipe the send file stream
 * Ported from Express (https://github.com/strongloop/express)
 *
 * @param res {http.ServerResponse} The actual response object
 * @param file
 * @param options
 * @param callback
 */
function sendFile(res, file, options, callback) {
    var done = false,
        streaming

    // request aborted
    function onaborted() {
        if (done)
            return

        done = true

        const err  = new Error('Request aborted')
        err.code = 'ECONNABORTED'
        callback(err)
    }

    // directory
    function ondirectory() {
        if (done) return
        done = true

        const err  = new Error('EISDIR, read')
        err.code = 'EISDIR'
        callback(err)
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
            const obj  = options.headers,
                  keys = Object.keys(obj),
                  len  = keys.length

            for (var i = 0; i < len; i++) {
                const k = keys[ i ]
                res.setHeader(k, obj[ k ])
            }
        })

    // pipe
    file.pipe(res)
}
