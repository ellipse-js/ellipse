'use strict'

const test  = require('tap'),
      isAbs = require('../../lib/utils/isAbsolute')

test.notOk(isAbs(''), 'empty path should be handled')
test.ok(isAbs('\\\\foo\\bar'), 'Microsoft Azure absolute path should be recognised')

if (process.platform === 'win32')
    test.test('win32', test => {
        test.ok(isAbs('C:/foo/bar'), 'absolute path should be recognised')
        test.ok(isAbs('D:\\foo\\bar'), 'absolute path should be recognised')
        test.notOk(isAbs('../foo/bar'), 'relative path should be recognised')
        test.notOk(isAbs('..\\foo\\bar'), 'relative path should be recognised')
        test.end()
    })
else
    test.test('posix', test => {
        test.ok(isAbs('/foo/bar'), 'absolute path should be recognised')
        test.notOk(isAbs('./foo/bar'), 'relative path should be recognised')
        test.end()
    })
