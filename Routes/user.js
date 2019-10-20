const express = require("express")
const router = express.Router()
const pool = require("../dbpool")

router.get('/all', (req, res) => {
    let sql = 'SELECT * FROM user';
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});


module.exports =router