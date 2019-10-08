const express = require("express")
const router = express.Router()
const pool = require("../dbpool")

router.get('/all', (req, res) => {
    let sql = 'SELECT * FROM Expenses';
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.post('/new', (req, res) => {
    let sql = "INSERT INTO Expenses set ?"
    let query = pool.query(sql, req.body ,(err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.put('/update', (req, res) => {
    let sql = 'UPDATE Expenses SET ? WHERE ?'
    let query = pool.query(sql, [{ "comment": req.body.comment,"paymentStatus":req.body.paymentStatus,"payDate":req.body.payDate,
        "paid":req.body.paid  }, { "idExpenses": req.body.idExpenses}], (err, results) => {
            if(err) throw err;
            res.send(results);
    });
});


module.exports =router