'use strict'

const test    = require('tap'),
      helpers = require('./helpers'),
      end     = helpers.end,
      create  = helpers.create,
      request = helpers.request,
      app     = create({ respond: true })

test.plan(1)

function init(ctx, next) {
    ctx.body = ''
    next()
}

function addLetterMw(ctx, next) {
    ctx.body += 'a'
    next()
}

app.use(init, addLetterMw, [ addLetterMw, addLetterMw ], addLetterMw, [ addLetterMw, [ addLetterMw ] ], addLetterMw)
app.get('/', addLetterMw, [ addLetterMw, addLetterMw ], addLetterMw, [ addLetterMw ])

request(app)
    .get('/')
    .expect(200, 'aaaaaaaaaaaa', end(test))
