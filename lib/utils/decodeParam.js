'use strict'

// expose

module.exports = decodeParam

// method

function decodeParam(val) {
    if (typeof val !== 'string' || val.length === 0)
        return val

    try {
        return decodeURIComponent(val)
    }
    catch (ex) {
        if (ex instanceof URIError) {
            ex.message = "Failed to decode param '" + val + "'"
            ex.status  = ex.statusCode = 400
        }

        throw ex
    }
}
