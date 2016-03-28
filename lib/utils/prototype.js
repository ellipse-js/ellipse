/**
 * Created by schwarzkopfb on 16/3/26.
 */

'use strict'

// expose

module.exports = prototype

// method

function prototype(base, descriptor) {
    var names = Object.getOwnPropertyNames(descriptor)

    for (var i = 0, l = names.length; i < l; i++) {
        var name = names[ i ],
            desc = Object.getOwnPropertyDescriptor(descriptor, name)

        Object.defineProperty(base.prototype, name, desc)
    }
}
