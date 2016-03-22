/**
 * Created by schwarzkopfb on 15/11/20.
 */

// todo: add copyright stuff

'use strict'

function decodeParam(val) {
    if (typeof val !== 'string' || val.length === 0)
        return val

    try {
        return decodeURIComponent(val)
    }
    catch (err) {
        if (err instanceof URIError) {
            err.message = 'Failed to decode param \'' + val + '\''
            err.status = err.statusCode = 400
        }

        throw err
    }
}

module.exports = decodeParam
