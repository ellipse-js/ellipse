/**
 * Created by schwarzkopfb on 15/11/20.
 */

'use strict';

function alias(obj, descriptor) {
    return function addAlias(name, field, writable) {
        if(arguments.length === 2 && typeof field === 'boolean') {
            writable = field
            field    = null
        }

        if(!field)
            field = name

        var member = {
            get: function () {
                return this[ obj ][ field ]
            }
        }

        if(writable)
            member[ 'set' ] = function (value) {
                this[ obj ][ field ] = value
            }

        descriptor[ name ] = member

        return addAlias
    }
}

module.exports = alias
