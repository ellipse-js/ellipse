/**
 * Created by schwarzkopfb on 15/11/20.
 */

// todo: add copyright stuff (if required)

'use strict'

// expose

module.exports = {
    isGenerator:         isGenerator,
    isGeneratorFunction: isGeneratorFunction
}

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
