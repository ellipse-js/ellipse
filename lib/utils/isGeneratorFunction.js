/**
 * Created by schwarzkopfb on 15/11/20.
 */

'use strict';

function isGenerator(obj) {
    return obj.next instanceof Function && typeof obj.throw instanceof Function
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

module.exports = isGeneratorFunction
