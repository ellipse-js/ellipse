'use strict'

module.exports = handleOptions

const missing = require('./missing')

function upperCase(string) {
    return string.toUpperCase()
}

function handleOptions(options, res) {
    if (~options.indexOf('GET') && !~options.indexOf('HEAD'))
        options.push('HEAD')

    const body = options.join(',')

    if (body.length)
        res.set('allow', body)
           .type('text/plain')
           .send(body)
    else
        missing(res.ctx)
}
