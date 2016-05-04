/**
 * Created by schwarzkopfb on 15/11/6.
 */

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
                var self = this

                return function () {
                    var value = fn.apply(self, arguments)
                    return chain ? this : value
                }
            },

            // Express also extends `http.ServerResponse` and `http.IncomingMessage`, so defining only a getter
            // leads to an error when used together with Ellipse, except we add this fake setter
            set: function noop() {
            }
        }

        return defineMethod
    }
}
