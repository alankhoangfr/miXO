const express = require("express")
const router = express.Router()
const pool = require("../dbpool")
const auth = require('../middleware/auth')

router.get('/all', auth,(req, res) => {
    let sql = 
    `
   select * 
   from
   (
   SELECT OD.* ,
    VP.idParentProduct,PP.productName,PP.category,PP.subCategory,VP.size,VP.colour,VP.productImage,
    VP.quantityInStock,VP.wholeSalePrice,VP.accumulation
    FROM order_details OD 
    LEFT JOIN  orders ords ON OD.idOrders=ords.idOrders 
    left Join variantproduct VP ON OD.sku = VP.SKU 
    LEFT JOIN parentproduct PP ON VP.idParentProduct = PP.idParentProduct 
    where not  ords.status  in ("Delivered") || ords.paymentStatus = "Partially Paid" || ords.paymentStatus is null 
    ) as first
    where first.quantity is not null  `    
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.put('/statusComment',auth, (req, res) => {
    console.log("update",req.body)
    const info = req.body
    let sql = 'UPDATE order_details SET ? WHERE ?'
    let query = pool.query(sql, [{  "comment": info.comment,"statusQuantity":info.statusQuantity,"quantity":info.quantity,
        "priceEach":info.priceEach,"arrivedToday":info.arrivedToday}, { "idOrder_Details": req.body.idOrder_Details }], (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.post('/new', auth,(req, res) => {
    let sql = "INSERT INTO order_details set ?"
    let query = pool.query(sql, req.body ,(err, results) => {
        if(err) throw err;
        res.send(results);
    });
});


module.exports =router