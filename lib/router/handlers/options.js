/**
 * Created by schwarzkopfb on 15/11/20.
 */

'use strict'

// expose

module.exports = handleOptions

// methods

function upperCase(string) {
    return string.toUpperCase()
}

function handleOptions(options, res) {
    var body = options.map(upperCase).join(',')

    res.set('content-length', Buffer.byteLength(body))

    if (options.length)
        res.set('allow', body)

    res.end(body)
}
