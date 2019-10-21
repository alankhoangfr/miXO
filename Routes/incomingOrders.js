const express = require("express")
const router = express.Router()
const pool = require("../dbpool")

router.get('/all', (req, res) => {
    let sql =
       `SELECT iord.* , sum(iop.quantity) as totalQuantity, sum(iop.statusQuantity) as totalStatusQuantity
        FROM incomingorders iord
        right join incomingorderproducts iop
        on  iord.idIncomingOrders=iop.idIncomingOrders
        WHERE NOT status = "Complete" 
        or not paymentStatus = "Completely Paid" 
        or paymentStatus is null
        group by iord.idIncomingOrders, iord.supplierOrderNumber, iord.orderDate, iord.idSuppliers, iord.totalAmount, 
        iord.supplierDiscount, iord.status, iord.comment, iord.paymentStatus, iord.paid, iord.payDate`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.put('/statusComment', (req, res) => {
    console.log("update",req.body)
    let sql = 'UPDATE incomingorders SET ? WHERE ?'
    let query = pool.query(sql, [{ "comment": req.body.comment,"status":req.body.status,"paymentStatus":req.body.paymentStatus,"payDate":req.body.payDate,
        "paid":req.body.paid,"totalAmount":req.body.totalAmount,"supplierDiscount":req.body.supplierDiscount }, { "idIncomingOrders": req.body.idIncomingOrders}], (err, results) => {
            if(err) throw err;
            res.send(results);
    });
});
router.post('/new', (req, res) => {
    let sql = "INSERT INTO incomingorders set ?"
    let query = pool.query(sql, req.body ,(err, results) => {
        if(err) throw err;
        res.send(results);
    });
});
module.exports =router