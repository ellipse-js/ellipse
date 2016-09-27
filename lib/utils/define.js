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

            // Express also extends `http.ServerResponse` and `http.IncomingMessage`, so defining only a getter
            // leads to an error when used together with Ellipse, except we add this fake setter
            // todo: TBD: using Ellipse and Express in the same application not seems like a real use-case
            set: () => {}
        }

        return defineMethod
    }
}
