/**
 * Created by schwarzkopfb on 15/9/13.
 */

var ellipse = require('../lib/ellipse'),
    app     = ellipse()

// account //

var account = app.mount('/account') // returns a Router instance

account.get('/', function (req, res) {
    res.send('Hello there! It\'s your account!')
})

account.get('/profile', function (req, res) {
    res.send('It\'s your profile page!')
})

// account/bills //

var bills = account.mount('/bills')

bills.get('/', function (req, res) {
    res.send('Here are your bills!')
})

bills.get('/latest', function (req, res) {
    res.send('Here is your latest bill!')
})

// pages //

var pages = ellipse.Router() // Express style subrouter usage

app.use('/pages', pages)

pages.get('/', function (req, res) {
    res.send('What a beautiful homepage, isn\'t it?')
})

pages.get('/contact', function (req, res) {
    res.send('Drop us an email!')
})

/* start server */

app.listen(3333)
