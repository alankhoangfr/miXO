const express = require("express")
const router = express.Router()
const pool = require("../dbpool")
const auth = require('../middleware/auth')

router.get('/all',auth, (req, res) => {
    let sql = 'SELECT * FROM expenses';
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.post('/new',auth, (req, res) => {
    let sql = "INSERT INTO expenses set ?"
    let query = pool.query(sql, req.body ,(err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.put('/update',auth, (req, res) => {
    let sql = `UPDATE expenses SET ? WHERE ?`
    let query = pool.query(sql, [{ "comment": req.body.comment,"paymentStatus":req.body.paymentStatus,"payDate":req.body.payDate,
        "paid":req.body.paid,"currency":req.body.currency }, { "idExpenses": req.body.idExpenses}], (err, results) => {
            if(err) throw err;
            res.send(results)
    });
});


module.exports =router