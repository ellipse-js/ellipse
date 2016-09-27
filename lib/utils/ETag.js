// todo: add copyright stuff (if required)

'use strict'

// expose

module.exports = selectETagFunction

// includes

const etag  = require('etag'),
      sETag = ETag.bind(null, false),
      wETag = ETag.bind(null, true)

// methods

function ETag(weak, body, encoding) {
    const buf = !Buffer.isBuffer(body)
        ? new Buffer(body, encoding)
        : body

    return etag(buf, { weak: weak })
}

function selectETagFunction(value) {
    if (value instanceof Function)
        return value

    switch (value) {
        case true:
        case 'weak':
            return wETag

        case 'strong':
            return sETag

        case false:
            break

        default:
            throw new TypeError('unknown value for ETag function: ' + value)
    }
}
