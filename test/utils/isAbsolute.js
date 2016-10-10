'use strict'

const path  = require('path'),
      posix = path.posix.isAbsolute,
      win32 = path.win32.isAbsolute,
      test  = require('tap'),
      isAbs = require('../../lib/utils/isAbsolute')

test.notOk(isAbs(''), 'empty path should be handled')
test.ok(isAbs('\\\\foo\\bar'), 'Microsoft Azure absolute path should be recognised')

test.test('posix', test => {
    path.isAbsolute = posix

    test.ok(isAbs('/foo/bar'), 'absolute path should be recognised')
    test.notOk(isAbs('./foo/bar'), 'relative path should be recognised')
    test.end()
})

test.test('win32', test => {
    path.isAbsolute = win32

    test.ok(isAbs('C:/foo/bar'), 'absolute path should be recognised')
    test.ok(isAbs('D:\\foo\\bar'), 'absolute path should be recognised')
    test.notOk(isAbs('../foo/bar'), 'relative path should be recognised')
    test.notOk(isAbs('..\\foo\\bar'), 'relative path should be recognised')
    test.end()
})
