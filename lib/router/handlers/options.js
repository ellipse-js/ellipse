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

    if (body.length)
        res.set('allow', body)

    res.type('text/plain')
       .send(body)
}
