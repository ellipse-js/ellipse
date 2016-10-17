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
 * @param {http.ServerResponse} res The actual response object
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
        else
            done = true

        const err  = new Error('Request aborted')
        err.code = 'ECONNABORTED'
        callback(err)
    }

    // directory
    function ondirectory() {
        if (done)
            return
        else
            done = true

        const err  = new Error('EISDIR, read')
        err.code = 'EISDIR'
        callback(err)
    }

    // errors
    function onerror(err) {
        if (done)
            return
        else
            done = true

        callback(err)
    }

    // ended
    function onend() {
        if (done)
            return
        else
            done = true

        callback()
    }

    // file
    function onfile() {
        streaming = false
    }

    // finished
    function onfinish(err) {
        if (err && err.code === 'ECONNRESET')
            return onaborted()
        else if (err)
            return onerror(err)
        else if (done)
            return

        setImmediate(() => {
            if (streaming !== false && !done) {
                onaborted()
                return
            }

            if (done)
                return
            else
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
            const obj = options.headers
            Object.keys(obj).forEach(k => res.setHeader(k, obj[ k ]))
        })

    // pipe
    file.pipe(res)
}
