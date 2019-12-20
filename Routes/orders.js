const express = require("express")
const router = express.Router()
const pool = require("../dbpool")
const moment = require("moment")
const auth = require('../middleware/auth')

router.get('/all',auth, (req, res) => {
    let sql = 
       `SELECT ords.* ,cust.firstName,cust.lastName, sum(ordet.quantity) as totalQuantity, sum(ordet.statusQuantity) as totalStatusQuantity
        FROM orders ords
        left join customers cust 
        on cust.customerId=ords.customerId
        right join order_details ordet 
        on ords.idOrders=ordet.idOrders
        WHERE status in ('Pending',"ReadyForPick","InTransit","Incomplete")
        or paymentStatus in  (null, "Paritally Paid")
        group by ords.idOrders, ords.orderDate, ords.customerId, ords.totalBasePrice, ords.reduction, 
        ords.status, ords.comment, ords.paid, ords.payDate, ords.paymentStatus,cust.firstName,cust.lastName;
        `;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });        
});


router.put('/statusComment',auth, (req, res) => {    
    let sql = 'UPDATE orders SET ? WHERE ?'
    let query = pool.query(sql, [{ "comment": req.body.comment,"status":req.body.status,"payDate":req.body.payDate,"deliveryPrice":req.body.deliveryPrice,
        "paymentStatus":req.body.paymentStatus, "paid":req.body.paid, "totalPriceSold":req.body.totalPriceSold,"deliveryDate":req.body.deliveryDate,
        "reduction":req.body.reduction,"orderDate":req.body.orderDate }, { "idOrders": req.body.idOrders }], (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.post('/new',auth, (req, res) => {
	console.log(req.body)
    let sql = "INSERT INTO orders set ?"
    let query = pool.query(sql, req.body ,(err, results) => {
        if(err) throw err;
        res.send(results);
    });
});




module.exports =router