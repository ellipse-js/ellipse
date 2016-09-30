'use strict'

// expose

module.exports = handleOptions

// methods

function upperCase(string) {
    return string.toUpperCase()
}

function handleOptions(options, res) {
    if (~options.indexOf('get') && !~options.indexOf('head'))
        options.push('head')

    const body = options.map(upperCase).join(',')

    res.set('content-length', Buffer.byteLength(body))

    if (options.length)
        res.set('allow', body)

    res.end(body)
}
