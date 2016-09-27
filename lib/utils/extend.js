'use strict'

module.exports = extend

function extend(obj, add) {
    const keys = Object.keys(add)

    for (var i = keys.length; i--;) {
        const key = keys[ i ]
        obj[ key ] = add[ key ]
    }

    return obj
}
