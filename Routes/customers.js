const express = require("express")
const router = express.Router()
const pool = require("../dbpool")

router.get('/all', (req, res) => {
    let sql = 'SELECT * FROM customers';
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});
router.get('/facebookId', (req, res) => {
    let sql = 'SELECT facebookId FROM customers';
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});
router.get('/customerId', (req, res) => {
    let sql = 'SELECT customerId FROM customers';
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});
router.post('/new', (req, res) => {
	console.log(req.body)
    let sql = "INSERT INTO customers set ?"
    let query = pool.query(sql, req.body ,(err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.get('/fbcust', (req, res) => {
    let sql = 'SELECT customerId,facebookId FROM customers';
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.get('/getCustId/:fbId', (req, res) => {
    console.log(req.params.fbId)
    let sql = `SELECT customerId, firstName FROM customers where facebookId = ${parseInt(req.params.fbId)}`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.put('/update',(req,res)=>{
    let sql = `Update customers SET ? where customerId= ${req.body.id.customerId}`
    let query = pool.query(sql, req.body.info ,(err, results) => {
        if(err) throw err;
        res.send(results);
    });
})
router.get('/allIdName', (req, res) => {
    let sql = 'SELECT customerId,firstName FROM customers';
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
    });
});
module.exports =router