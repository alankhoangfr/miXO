const express = require("express")
const router = express.Router()
const pool = require("../dbpool")

router.get('/all', (req, res) => {
    let sql = 'SELECT OD.* ,VP.idParentProduct,PP.productName,PP.category,PP.subCategory,VP.size,VP.colour,VP.productImage,VP.quantityInStock FROM Order_Details OD LEFT JOIN  Orders ords ON OD.idOrders=ords.idOrders left Join VariantProduct VP ON OD.sku = VP.SKU LEFT JOIN ParentProduct PP ON VP.idParentProduct = PP.idParentProduct WHERE NOT ords.paymentStatus="Paid" '
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.put('/statusComment', (req, res) => {
    console.log("update",req.body)
    let sql = 'UPDATE Order_Details SET ? WHERE ?'
    let query = pool.query(sql, [{ "comment": req.body.comment,"status":req.body.status }, { "idOrder_Details": req.body.idOrder_Details }], (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.post('/new', (req, res) => {
    let sql = "INSERT INTO Order_Details set ?"
    let query = pool.query(sql, req.body ,(err, results) => {
        if(err) throw err;
        res.send(results);
    });
});


module.exports =router