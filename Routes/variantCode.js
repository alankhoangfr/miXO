const express = require("express")
const router = express.Router()
const pool = require("../dbpool")
const auth = require('../middleware/auth')

router.get('/all', auth,(req, res) => {
    let sql = 'SELECT * FROM variantcode';
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});


module.exports =router