const express = require("express")
const router = express.Router()
const pool = require("../dbpool")

router.get('/all', (req, res) => {
    let sql = 'SELECT * FROM Customers';
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});
router.get('/facebookId', (req, res) => {
    let sql = 'SELECT facebookId FROM Customers';
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});
router.get('/customerId', (req, res) => {
    let sql = 'SELECT customerId FROM Customers';
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});
router.post('/new', (req, res) => {
	console.log(req.body)
    let sql = "INSERT INTO Customers set ?"
    let query = pool.query(sql, req.body ,(err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.get('/fbcust', (req, res) => {
    let sql = 'SELECT customerId,facebookId FROM Customers';
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.get('/getCustId/:fbId', (req, res) => {
    console.log(req.params.fbId)
    let sql = `SELECT customerId FROM Customers where facebookId = ${parseInt(req.params.fbId)}`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});
module.exports =router