var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mysql = require('mysql');

var MySQLStore = require('express-mysql-session')(session);
var config = require('./config/config');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

app.set('port', (process.env.PORT || 5000));

var checkAuth = require('./middleware/checkAuth');




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

var options = {
  host: config.dbmysql.host,
  port: 3306,
  user: config.dbmysql.user,
  password: config.dbmysql.password,
  database: config.dbmysql.database,
  schema: {
    tableName: 'custom_sessions_table_name',
    columnNames: {
      session_id: 'custom_session_id',
      expires: 'custom_expires_column_name',
      data: 'custom_data_column_name'
    }
  }
};
var sessionStore = new MySQLStore(options);


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// app.use(session({
//   secret: 'testproject',
//   resave: false,
//   saveUninitialized: true,
//   cookie: {
//     path: '/',
//     httpOnly: true,
//     secure: false,
//     maxAge: null
//   }
// }));

app.use(session({
  key: 'session_cookie_name',
  secret: 'session_cookie_secret',
  store: sessionStore,
  resave: true,
  saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', index);
app.use('/users', users);

var connection = mysql.createConnection({
  host: config.dbmysql.host,
  user: config.dbmysql.user,
  password: config.dbmysql.password,
  database: config.dbmysql.database
});

connection.connect(function (err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  console.log('connected as id ' + connection.threadId);
});

// function getUserDB(username, done) {
//   connection.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username], function (err, rows, fields) {
//     if (err) throw err;
//     done(rows[0]);
//   });
// }

app.get('/', function (req, res) {
  console.log('req.session', req.session);
  console.log('res.session', res.session);
  if (req.session.role) {
    res.redirect('/table');
  } else {
    res.redirect('/login');
  }
  // res.render('hello');
});
app.get('/logout', function (req, res) {
  req.session.destroy(function () {
    res.redirect('/login');
  });
});
// *************************************************************
var mysql = require('promise-mysql');
var connection;
var mysqlconnect = mysql.createConnection({
  host: config.dbmysql.host,
  user: config.dbmysql.user,
  password: config.dbmysql.password,
  database: config.dbmysql.database
});
app.get('/testmysql', function (req, res) {
  var id = 1;
  mysqlconnect.then(function (conn) {
    connection = conn;

    return connection.query('select * from records where `id`="' + id + '"');
  }).then(function (rows) {
    // Query the items for a ring that Frodo owns. 
    // UPDATE records SET ? WHERE ?
    console.log('rows 1', rows);
    return connection.query('update records set `edit`="' + 1 + '" where `id`="' + rows[0].id + '"');
  }).then(function (rows) {
    // Logs out a ring that Frodo owns 

    console.log('rows 2', rows);
    res.send('successful');
  }).catch(function (error) {
    //logs out the error 
    res.send('unsuccessful');
    console.log(error);
  });
});
// *************************************************************

app.get('/login', function (req, res) {
  res.render('main');
});

app.post('/login', function (req, res) {

  if (!req.body.login || !req.body.password) {
    return res.status(400).send("You must send the username and the password");
  }

  connection.query('SELECT * FROM users WHERE login = ? LIMIT 1', [req.body.login], function (err, rows, fields) {
    if (err) throw err;

    if (!rows[0]) {
      return res.status(401).send("The username is not existing");
    }
    if (rows[0].password !== req.body.password) {
      return res.status(401).send("The username or password don't match");
    }

    req.session.role = rows[0].role;
    res.status(201).redirect('/table');

  });

});

app.get('/table', checkAuth, function (req, res) {
  console.log(req.session.role);
  switch (req.session.role) {
    case 'role_first':
      connection.query('SELECT * FROM records', function (err, rows, fields) {
        if (err) throw err;


        rating = [5, 4, 3, 2, 1];
        res.render('f_r_table', { role: 'first role', records: rows, rating: rating })
      })
      break
    case 'role_second':
      connection.query('SELECT * FROM records', function (err, rows, fields) {
        if (err) throw err;

        rating = [5, 4, 3, 2, 1];
        res.render('s_r_table', { role: 'second role', records: rows, rating: rating })
      })
      break
    default:
      console.log('test');
      break
  }
});

app.post('/table/voting', function (req, res) {
  // var sqlQuery = ;

  console.log(req.body);
  connection.query("UPDATE records SET ? WHERE ?", [{ evaluation: req.body.evaluation }, { id: req.body.id }], function (error, data) {
    if (error) throw error;

    res.json(data);
  });
});

app.get('/table/edit/:id', function (req, res) {
  // var sqlQuery = ;

  console.log(req.params);
  // connection.query("UPDATE records SET ? WHERE ?", [{ evaluation: req.body.evaluation }, { id: req.body.id }], function (error, data) {
  //   if (error) throw error;

  //   res.json(data);
  // });


  var id = req.params.id;
  console.log(id);
  // req.getConnection(function (err, connection) {
  connection.query('SELECT * FROM records WHERE id = ?', [id], function (err, row) {
    console.log('row', row[0]);
    if (err)
      console.log("Error Selecting : %s ", err);
    res.render('edit_customer', { page_title: "Edit Customers - Node.js", record: row[0] });
  });
  // });


});

app.post('/table/edit', function (req, res) {
  console.log('req.body', req.body);

  var id = req.body.id;
  var question = req.body.question;
  var solution = req.body.solution;
  mysqlconnect.then(function (conn) {
    connection = conn;

    // return connection.query('select * from records where `id`="' + id + '"');
    return connection.query('update records set `question`="' + question + '",`solution`="' + solution + '" where `id`="' + id + '"');
  }).then(function (rows) {
    console.log('rows 2', rows);
    res.json('_successful_');
  }).catch(function (error) {
    //logs out the error 
    res.send('unsuccessful');
    console.log(error);
  });
});

app.get('/table/create', function (req, res) {
  res.render('create');
});

app.post('/table/create', function (req, res) {
  console.log('/table/create', req.body);

  var question = req.body.question;
  var solution = req.body.solution;
  mysqlconnect.then(function (conn) {
    connection = conn;
    
    return connection.query('insert into records set `question`="' + question + '",`solution`="' + solution + '"');
  }).then(function (rows) {
    res.json('_successful_');
  }).catch(function (error) {
    //logs out the error 
    res.send('unsuccessful');
    console.log(error);
  });
});

app.get('/test', function (req, res) {
  // req.session.numberOfVisits = req.session.numberOfVisits + 1 || 1;
  // res.send("visits " + req.session.numberOfVisits);

  var sqlQuery = "SELECT * FROM users";
  connection.query(sqlQuery, function (error, data) {
    if (error) throw error;

    res.json(data);
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


// var express = require('express');
// var app = express();
// app.use(express.static(__dirname + '/public'));
// views is directory for all template files
// app.set('views', __dirname + '/views');
// app.set('view engine', 'ejs');

// app.get('/', function(request, response) {
  // response.render('pages/index');
// });

