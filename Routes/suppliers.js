const express = require("express")
const router = express.Router()
const pool = require("../dbpool")
const auth = require('../middleware/auth')

router.get('/all',auth, (req, res) => {
    let sql = 'SELECT * FROM suppliers';
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.get('/allIdName', auth,(req, res) => {
    let sql = 'SELECT idSuppliers,supplierName FROM suppliers';
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.post('/new', auth,(req, res) => {

    let sql = "INSERT INTO suppliers set ?"
    let query = pool.query(sql, req.body ,(err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.put('/update',auth,(req,res)=>{
    let sql = `Update suppliers SET ? where idSuppliers= ${req.body.id.idSuppliers}`
    let query = pool.query(sql, req.body.info ,(err, results) => {
        if(err) throw err;
        res.send(results);
    });
})
module.exports =router