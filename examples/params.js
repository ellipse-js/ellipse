/**
 * Created by schwarzkopfb on 16/3/22.
 */

'use strict'

var Ellipse = require('../lib/ellipse'),
    app     = new Ellipse

function capitalize(str) {
    return str[ 0 ].toUpperCase() + str.toLowerCase().substring(1)
}

function *findUserById(id) {
    if (id == 1)
        return {
            id: 1,
            username: 'jdoe',
            name: 'John Doe'
        }
    else
        return null
}

// main route
app.get('/', function () {
    this.body = [
        'try:',
        "/females_aren't_wombats",
        '/males_are_not_wombats',
        '/male_is_wombat',
        '/female_is_a_wombat',
        '/user/1',
        '/user/2',
        '/batman',
        '/bat%20man',
        '/john%20doe'
    ].join('\n')

    this.send()
})

// override `name` param in `ctx.params`
app.param('name', function (next, name) {
    this.params.name = name.split(' ').map(capitalize).join(' ')
    next()
})

// extend `ctx` based on `user_id` param
app.param('user_id', function *(next, id) {
    this.user = yield *findUserById(id)
    yield next
})

/*
    capturing groups of a RegExp path are available under `ctx.params` with a numeric index

    try:
    /females_aren't_wombats
    /males_are_not_wombats
    /male_is_wombat
    /female_is_a_wombat

            |0 |     |1|   |2     |  |3      |             |4|                  */
app.get(/^\/(fe)?male(s)?_?(is|are)_?(n't|not)?_?a?_?wombat(s)?/, function () {
    if (this.params[ 0 ])
        console.log('female')
    else
        console.log('male')

    if (this.params[ 1 ])
        console.log('more than one!')

    if (this.params[ 2 ] === 'are')
        console.log('plural!')

    if (this.params[ 3 ])
        console.log('negation!')

    if (this.params[ 4 ])
        console.log('a whole bunch of wombats!')

    this.body = this.params
    this.send()
})

/*
    try:
    /user/1
    /user/2
*/
app.get('/user/:user_id', function () {
    this.body = this.user || "this server can't recognize you! :("
    this.send()
})

/*
    named params

    try:
    /batman
    /bat%20man
    /john%20doe

    note: '%20' is the url escape code of the space (' ') char
*/
app.get('/:name', function () {
    this.send(this.params.name)
})

// start listening
app.listen(3333)
