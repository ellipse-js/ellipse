'use strict'

module.exports = extend

function extend(obj, add) {
    var keys = Object.keys(add)

    for (var i = keys.length; i--;) {
        var key = keys[ i ]
        obj[ key ] = add[ key ]
    }

    return obj
}
