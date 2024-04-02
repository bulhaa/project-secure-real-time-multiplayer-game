'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTestingRoutes = require('./routes/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const auth = require('./auth.js');

const app = express();

const http = require('http').createServer(app);
const io = require('socket.io')(http);
const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo')(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });
const bcrypt = require('bcrypt');

// const bodyParser = require('body-parser');
const expect = require('chai');
// const socket = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const runner = require('./test-runner.js');


app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false },
  key: 'express.sid',
  store: store
}));

app.use(passport.initialize());
app.use(passport.session());



app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.noCache());
app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.4.3' }));
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
  })
);

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({ origin: '*' }));

myDB(async client => {
  // await client.db('database').collection('users').deleteMany()
  const myDataBase = await client.db('database').collection('users');

  let nCurrentUsers = 0;
  let players = [];

  // Index page (static HTML)
  app.route('/')
    .get(async function (req, res, next) {
      console.log('req.user2: ', req.user);
      if (!req.user) {
        console.log('nCurrentUsers: ', nCurrentUsers);

        req.body.username = "Hammadh"+nCurrentUsers
        req.body.password = "XXXXXX"
        const hash = bcrypt.hashSync(req.body.password, 1);
        // myDataBase.findOne({ username: req.body.username }, (err, user) => {
        //   if (err) {
        //     next(err);
        //   } else if (user) {
        //     res.redirect('/');
        //   } else {
            myDataBase.insertOne({
              username: req.body.username,
              password: hash
            },
              (err, doc) => {
                if (err) {
                  res.redirect('/');
                } else {
                  // The inserted document is held within
                  // the ops property of the doc
                  const player = {
                    position: {x:300, y:300},
                    id: doc.ops[0]._id,
                    score: 0,
                  }
                  // players.push(player);
                  next(null, doc.ops[0]);
                }
              }
            )
        //   }
        // })
      }
      // const user = await myDataBase.findOne({ username: req.body.username })
      // next(null, user);
      res.sendFile(process.cwd() + '/views/index.html');

    },
    passport.authenticate('local', { failureRedirect: '/500' }),
    (req, res, next) => {
      res.sendFile(process.cwd() + '/views/index.html');
    });

  app.route('/user')
    .get((req, res, next) => {
      res.json({id: req.user._id});
    });

  //For FCC testing purposes
  fccTestingRoutes(app);

  // 404 Not Found Middleware
  app.use(function (req, res, next) {
    res.status(404)
      .type('text')
      .send('Not Found');
  });

  auth(app, myDataBase);

  io.on('connection', (socket) => {
    ++nCurrentUsers;
    console.log('A user has connected');
    console.log('socket.request.user: ', socket.request.user);
    // currentUsers.push({})

    io.emit('user', {
      // username: socket.request.user.username,
      nCurrentUsers: nCurrentUsers,
      connected: true
    });

    socket.on('move', (player) => {
      player.id = socket.request.user._id
      const p = players.find(p => p.id === player.id)
      console.log('players2: ', players);

      if(!p) {
        players.push(player)
      }

      players.forEach(p => {
        if (p.id === player.id) {
          p.position = player.position;
        }
      });
      console.log('socket.request.user: ', socket.request.user);
      io.emit('move', players);
    });

    socket.on('disconnect', () => {
      console.log('A user has disconnected');
      --nCurrentUsers;
      io.emit('user', {
        // username: socket.request.user.username,
        nCurrentUsers: nCurrentUsers,
        connected: false
      });
    });
  });


}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});


function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');

  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  console.log('failed connection to socket.io:', message);
  if (error) throw new Error(message);
  accept(null, false);
}




const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = http.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

module.exports = app; // For testing
