const express = require("express")
const router = express.Router()
const pool = require("../dbpool")

router.get('/all', (req, res) => {
    let sql = 'SELECT * FROM Suppliers';
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.get('/allIdName', (req, res) => {
    let sql = 'SELECT idSuppliers,supplierName FROM Suppliers';
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.post('/new', (req, res) => {
	console.log(req.body)
    let sql = "INSERT INTO Suppliers set ?"
    let query = pool.query(sql, req.body ,(err, results) => {
        if(err) throw err;
        res.send(results);
    });
});
module.exports =router