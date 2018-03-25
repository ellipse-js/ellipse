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
    let done = false,
        streaming

    // request aborted
    function onaborted() {
        /* istanbul ignore if */
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
        /* istanbul ignore if */
        if (done)
            return
        else
            done = true

        const err = new Error('EISDIR, read')
        err.code = 'EISDIR'
        callback(err)
    }

    // errors
    function onerror(err) {
        /* istanbul ignore if */
        if (done)
            return
        else
            done = true

        /* istanbul ignore if */
        // todo: find a way to test it properly
        if (err.code === 'ECONNRESET')
            onaborted()
        else
            callback(err)
    }

    // ended
    function onend() {
        /* istanbul ignore if */
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
        /* istanbul ignore if */
        // note: theoretically impossible (because we're listening to the error event)
        if (err)
            return onerror(err)
        /* istanbul ignore else */
        else if (done)
            return

        setImmediate(() => {
            if (streaming !== false && !done) {
                onaborted()
                return
            }

            /* istanbul ignore if */
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
