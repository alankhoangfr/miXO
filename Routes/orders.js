const express = require("express")
const router = express.Router()
const pool = require("../dbpool")

router.get('/all', (req, res) => {
    let sql = 'SELECT * FROM Orders WHERE paymentStatus = "Pending" or paymentStatus ="InTransit" or paymentStatus ="ReadyForPick" or paymentStatus="Incomplete"';
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.put('/statusComment', (req, res) => {
    console.log("update",req.body)
    let sql = 'UPDATE Orders SET ? WHERE ?'
    let query = pool.query(sql, [{ "comment": req.body.comment,"paymentStatus":req.body.paymentStatus,"payDate":req.body.payDate}, { "idOrders": req.body.idOrders }], (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.post('/new', (req, res) => {
	console.log(req.body)
    let sql = "INSERT INTO Orders set ?"
    let query = pool.query(sql, req.body ,(err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

module.exports =router