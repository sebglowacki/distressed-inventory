//setup Dependencies
var connect = require('connect')
    , express = require('express')
    , io = require('socket.io')
    , port = (process.env.PORT || 3000);


var googleapis = require('googleapis'),
    OAuth2Client = googleapis.OAuth2Client;

var oauth2Client =
    new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.CALLBACK_URL);

var passport = require('passport')
    , GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Google profile is
//   serialized and deserialized.
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});


// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL
    },
    function(accessToken, refreshToken, profile, done) {

        oauth2Client.credentials = {
            access_token: accessToken,
            refresh_token: refreshToken
        };

        // asynchronous verification, for effect...
        process.nextTick(function () {

            console.log(profile);

            // To keep the example simple, the user's Google profile is returned to
            // represent the logged-in user.  In a typical application, you would want
            // to associate the Google account with a user record in your database,
            // and return that user instead.
            return done(null, profile);
        });
    }
));

//Setup Express
var server = express.createServer();
server.configure(function () {
    server.set('views', __dirname + '/views');
    server.set('view options', { layout: false });
    server.use(connect.bodyParser());
    server.use(express.cookieParser());
    server.use(express.session({ secret: "shhhhhhhhh!"}));
    server.use(connect.static(__dirname + '/static'));
    // Initialize Passport!  Also use passport.session() middleware, to support
    // persistent login sessions (recommended).
    server.use(passport.initialize());
    server.use(passport.session());
    server.use(server.router);
});

//setup the errors
server.error(function (err, req, res, next) {
    if (err instanceof NotFound) {
        res.render('404.jade', { locals: {
            title: '404 - Not Found', description: '', author: '', analyticssiteid: 'XXXXXXX'
        }, status: 404 });
    } else {
        res.render('500.jade', { locals: {
            title: 'The Server Encountered an Error', description: '', author: '', analyticssiteid: 'XXXXXXX', error: err
        }, status: 500 });
    }
});
server.listen(port);

var events = require('events');
var util = require('util');

// The Thing That Emits Event
Eventer = function () {
    events.EventEmitter.call(this);
    this.sendCmd = function (cmd) {
        this.emit(cmd);
    };
};
util.inherits(Eventer, events.EventEmitter);


// The thing that drives the two.
var eventer = new Eventer();


//Setup Socket.IO
var io = io.listen(server);
io.sockets.on('connection', function (socket) {
    console.log('Client Connected');
//    socket.on('message', function (data) {
//        sell();
//        socket.broadcast.emit('server_message', counter);
//        socket.emit('server_message', counter);
//    });
    socket.on('disconnect', function () {
        console.log('Client Disconnected.');
    });

    socket.on('userId', function(data) {
       console.log(data);
       console.log(socket.id);

        io.sockets.socket(socket.id).emit('log', 'Personalized message');
    });

    eventer.on('sold', function () {
        socket.broadcast.emit('server_message', counter);
    });

    eventer.on('updated', function () {
        socket.broadcast.emit('server_message', counter);
    });
});

var counter = 88;

var sell = function () {
    var sold = false;
    if (counter > 0) {
        counter--;
        sold = true;
    }
    eventer.sendCmd('sold');
    return sold;
};

///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

/////// ADD ALL YOUR ROUTES HERE  /////////

server.get('/', function (req, res) {
    res.render('index.jade', {
        locals: {
            title: 'Distressed Inventory',
            description: 'Get it, Get it now!',
            author: 'Seb Glowacki',
            counter: counter,
            analyticssiteid: 'XXXXXXX',
            user: req.user
        }
    });
});

server.get('/admin', function (req, res) {
    res.render('admin.jade', {
        locals: {
            title: 'Distressed Inventory - Admin', description: 'Admin page', author: 'Seb Glowacki', counter: counter, analyticssiteid: 'XXXXXXX'
        }
    });
});

server.get('/counter', function (req, res) {
    res.json({ counter: counter });
});

server.post('/order', function (req, res) {
    if (sell())
        res.json({ sold: 'yes' });
});

server.post('/admin', function (req, res) {
    counter = req.body.counter;
    res.json({ counter: counter });
    eventer.sendCmd('updated');
});


// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
server.get('/auth/google',
    passport.authenticate('google', {
        scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/plus.login'
        ]
    }),
    function(req, res){
        // The request will be redirected to Google for authentication, so this
        // function will not be called.
    });

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
server.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
//        console.log('request', req.user.id);

        googleapis.load('plus', 'v1', function(err, client) {
            client.plus.people.list({ userId: 'me', collection: 'visible' }).withAuthClient(oauth2Client).execute(function(err, results) {
                if (err) {
                    console.log(err.message);
                } else {
                    console.log(results);
                }
            });

        });

        res.cookie('User-Id', req.user.id);
        res.redirect('/?userId=' + req.user.id);

//        res.writeHead(302, {
//            "location": "/",
//            "Cache-Control" : "no-cache, no-store, must-revalidate",
//            "Pragma": "no-cache",
//            "Expires": 0,
//            "UserId": req.user.id
//        });
//        res.end();
    });

server.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});


//A Route for Creating a 500 Error (Useful to keep around)
server.get('/500', function (req, res) {
    throw new Error('This is a 500 Error');
});

//The 404 Route (ALWAYS Keep this as the last route)
server.get('/*', function (req, res) {
    throw new NotFound;
});

function NotFound(msg) {
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login');
}

console.log('Listening on http://0.0.0.0:' + port);
