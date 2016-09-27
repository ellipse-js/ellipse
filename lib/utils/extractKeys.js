'use strict'

// expose

module.exports = extractKeys

// methods

function countGroups(rx) {
    // modify regexp so that it will match an empty string
    const checker = new RegExp(rx.source + '|')
    // then match an empty string and see how many groups it returns
    return checker.exec('').length - 1
}

function extractKeys(rx, keys) {
    const n = countGroups(rx)

    for (var i = 0; i < n; i++)
        keys.push({ name: i })

    return rx
}
