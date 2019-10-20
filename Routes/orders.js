const express = require("express")
const router = express.Router()
const pool = require("../dbpool")

router.get('/all', (req, res) => {
    let sql = 
       `SELECT ords.* ,cust.firstName,cust.lastName, sum(ordet.quantity) as totalQuantity, sum(ordet.statusQuantity) as totalStatusQuantity
        FROM orders ords
        left join customers cust 
        on cust.customerId=ords.customerId
        right join order_details ordet 
        on ords.idOrders=ordet.idOrders
        WHERE NOT status = "Delivered" 
        or not paymentStatus = "Completely Paid" 
        or paymentStatus is null;`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});


router.put('/statusComment', (req, res) => {
    console.log("update",req.body)
    let sql = 'UPDATE orders SET ? WHERE ?'
    let query = pool.query(sql, [{ "comment": req.body.comment,"status":req.body.status,"payDate":req.body.payDate,
        "paymentStatus":req.body.paymentStatus, "paid":req.body.paid,"totalBasePrice":req.body.totalBasePrice,
        "reduction":req.body.reduction }, { "idOrders": req.body.idOrders }], (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.post('/new', (req, res) => {
	console.log(req.body)
    let sql = "INSERT INTO orders set ?"
    let query = pool.query(sql, req.body ,(err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

module.exports =router