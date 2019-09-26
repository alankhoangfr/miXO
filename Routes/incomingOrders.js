const express = require("express")
const router = express.Router()
const pool = require("../dbpool")

router.get('/all', (req, res) => {
    let sql = 'SELECT * FROM IncomingOrders WHERE NOT STATUS = "Complete"';
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.put('/statusComment', (req, res) => {
    console.log("update",req.body)
    let sql = 'UPDATE IncomingOrders SET ? WHERE ?'
    let query = pool.query(sql, [{ "comment": req.body.comment,"status":req.body.status }, { "idIncomingOrders": req.body.idIncomingOrders }], (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});
router.post('/new', (req, res) => {
    let sql = "INSERT INTO IncomingOrders set ?"
    let query = pool.query(sql, req.body ,(err, results) => {
        if(err) throw err;
        res.send(results);
    });
});
module.exports =router