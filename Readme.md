# Ellipse

It's a super-simplified web framework inspired by `Express` for those cases when you don't need templates, render engines and all the fancy stuff.
A combination of a router, a middleware chain and a bunch of response helper utilities. Not more, not less. 

## Usage

```js

var ellipse = require('ellipse'),
    app     = ellipse()

app.get('/', function (req, res) {
    var name = req.query.name || 'Ellipse'

    res.send('Welcome ' + name + '!')
})

app.get('/:name', function (req, res) {
    var name = req.params.name || 'Ellipse'

    res.send('Hello ' + name + '!')
})

app.get('/:greeting/:name', function (req) {
    var name = req.params.name || 'Ellipse'

    this.send(req.params.greeting + ' ' + name + '!')
})

app.listen(3333, function () {
    console.log('server is ready to accept connections on port 3333')
})

```

For more information, see the [examples](https://github.com/schwarzkopfb/ellipse/blob/master/examples). 

## Installation

With npm:

    npm install --save ellipse
    
With git:
    
    git clone git://github.com/schwarzkopfb/ellipse.git

## License

[MIT license](https://github.com/schwarzkopfb/hookserver/blob/master/LICENSE).