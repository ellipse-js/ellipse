'use strict'

// expose

module.exports = defineMethod

// method

/**
 * Helper function to define methods with bound `this` on a prototype
 *
 * @param descriptor {object} property descriptor object
 */
function defineMethod(descriptor) {
    /**
     * @param name {string}
     * @param fn {function}
     * @param [chain] {boolean}
     */
    return function defineMethod(name, fn, chain) {
        descriptor[ name ] = {
            get: function () {
                const self = this

                return function () {
                    const value = fn.apply(self, arguments)
                    return chain ? this : value
                }
            },

            set: () => {
                throw new Error('cannot overwrite `' + name + '()`')
            }
        }

        return defineMethod
    }
}
