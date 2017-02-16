var express = require('express');
var config = require('../config/config');
var checkAuth = require('../middleware/checkAuth');
var mysql = require('mysql');

var mysqlpr = require('promise-mysql');
var connectionpr;
var mysqlconnect = mysqlpr.createConnection({
    host: config.dbmysql.host,
    user: config.dbmysql.user,
    password: config.dbmysql.password,
    database: config.dbmysql.database
});

var router = express.Router();

var connection = mysql.createConnection({
    host: config.dbmysql.host,
    user: config.dbmysql.user,
    password: config.dbmysql.password,
    database: config.dbmysql.database
});

router.get('/', checkAuth, function (req, res, next) {
    console.log(req.session.role);
    console.log('connect from module');
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

router.post('/voting', checkAuth, function (req, res, next) {
    console.log(req.body);
    connection.query("UPDATE records SET ? WHERE ?", [{ evaluation: req.body.evaluation }, { id: req.body.id }], function (error, data) {
        if (error) throw error;

        res.json(data);
    });
});

router.get('/edit/:id', checkAuth, function (req, res, next) {
    console.log(req.params);
    var id = req.params.id;
    connection.query('SELECT * FROM records WHERE id = ?', [id], function (err, row) {
        console.log('row', row[0]);
        if (err)
            console.log("Error Selecting : %s ", err);
        res.render('edit_customer', { page_title: "Edit Customers - Node.js", record: row[0] });
    });
});

router.post('/edit', checkAuth, function (req, res, next) {
    console.log('req.body', req.body);

    var id = req.body.id;
    var question = req.body.question;
    var solution = req.body.solution;
    mysqlconnect.then(function (conn) {
        connectionpr = conn;

        // return connection.query('select * from records where `id`="' + id + '"');
        return connectionpr.query('update records set `question`="' + question + '",`solution`="' + solution + '" where `id`="' + id + '"');
    }).then(function (rows) {
        console.log('rows 2', rows);
        res.json('_successful_');
    }).catch(function (error) {
        //logs out the error 
        res.send('unsuccessful');
        console.log(error);
    });
});

router.get('/create', checkAuth, function (req, res, next) {
    res.render('create');
});

router.post('/create', checkAuth, function (req, res, next) {
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


module.exports = router;