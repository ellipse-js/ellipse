// todo: add copyright stuff (if required)

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
    var constructor = obj.constructor

    if (!constructor)
        return false
    else if (constructor.name === 'GeneratorFunction' || constructor.displayName === 'GeneratorFunction')
        return true
    else
        return isGenerator(constructor.prototype)
}
