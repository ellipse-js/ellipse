'use strict'

// expose

exports = module.exports = isGenerator
exports.isFunction = isGeneratorFunction

// methods

function isGenerator(obj) {
    return (
        obj instanceof Object &&
        typeof obj.next === 'function' &&
        typeof obj.throw === 'function'
    )
}

function isGeneratorFunction(obj) {
    const ctor = obj.constructor

    if (ctor.name === 'GeneratorFunction' || ctor.displayName === 'GeneratorFunction')
        return true
    else
        return isGenerator(ctor.prototype)
}
