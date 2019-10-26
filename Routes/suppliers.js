const express = require("express")
const router = express.Router()
const pool = require("../dbpool")

router.get('/all', (req, res) => {
    let sql = 'SELECT * FROM suppliers';
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.get('/allIdName', (req, res) => {
    let sql = 'SELECT idSuppliers,supplierName FROM suppliers';
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.post('/new', (req, res) => {

    let sql = "INSERT INTO suppliers set ?"
    let query = pool.query(sql, req.body ,(err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.put('/update',(req,res)=>{
    let sql = `Update suppliers SET ? where idSuppliers= ${req.body.id.idSuppliers}`
    let query = pool.query(sql, req.body.info ,(err, results) => {
        if(err) throw err;
        res.send(results);
    });
})
module.exports =router