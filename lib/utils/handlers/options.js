/**
 * Created by schwarzkopfb on 15/11/20.
 */

'use strict';

function upperCase(string) {
    return string.toUpperCase()
}

function handleOptions(options, res) {
    var body = options.map(upperCase).join(','),
        head = res.headers

    head[ 'Content-Length' ] = Buffer.byteLength(body)

    if(options.length)
        head[ 'Allow' ] = body

    res.writeHead(200, head)
    res.end(body)
}

module.exports = handleOptions
