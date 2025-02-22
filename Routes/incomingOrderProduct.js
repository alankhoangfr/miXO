const express = require("express")
const router = express.Router()
const pool = require("../dbpool")
const auth = require('../middleware/auth')


router.get('/all', auth,(req, res) => {
        let sql = `
        SELECT IOP.*,PP.productName, iorder.supplierOrderNumber,iorder.orderDate,VP.quantityInStock,VP.accumulation
        FROM incomingorderproducts  IOP 
        LEFT JOIN  incomingorders iorder ON IOP.idIncomingOrders=iorder.idIncomingOrders
        left Join variantproduct VP ON IOP.sku = VP.SKU 
        Left join parentproduct PP  on IOP.predictedParentId=PP.idParentProduct 
        where  
        iorder.status="Pending" or iorder.paymentStatus <> "Completely Paid" or iorder.paymentStatus is null`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.put('/statusComment', auth,(req, res) => {
    console.log("update",req.body)
    const info = req.body
    let sql = 'UPDATE incomingorderproducts  SET ? WHERE ?'
    let query = pool.query(sql,
        [{ "comment": info.comment,"statusQuantity":info.statusQuantity,"quantity":info.quantity,"wholeSalePrice":info.wholeSalePrice,
        "retailPrice":info.retailPrice,arrivedToday:info.arrivedToday}
            , { "idIncomingOrderProducts": info.idIncomingOrderProducts }], (err, results) => {
        if(err) throw err;
        res.send(results);
    });     
});

router.post("/new", auth,(req,res)=>{
    let info = req.body    
    if(req.files!==null){
        info["productImage"]=req.files.productImage.data    
    }else{
         info["productImage"]=null
    }
    console.log(info)
    let sql = "INSERT INTO incomingorderproducts  set?"
    let query = pool.query(sql,info,(err,results)=>{
        if (err) throw err
        res.send(results)
    })

})

router.post("/fromVP",auth,(req,res)=>{
    console.log(req.body)
    let info = req.body  
    let sql = `INSERT INTO incomingorderproducts (idIncomingOrders, predictedParentId, sku, wholeSalePrice, 
    quantity, retailPrice, productDescription, category, subCategory, colour, size, productImage) 
    SELECT ${`"${info.idIncomingOrders}"`} , ${`"${info.predictedParentId}"`},${`"${info.sku}"`},${`"${info.wholeSalePrice}"`}, 
    ${`"${info.quantity}"`} , ${`"${info.retailPrice}"`},${`"${info.productDescription}"`},${`"${info.category}"`}, 
    ${`"${info.subCategory}"`} , ${`"${info.colour}"`},${`"${info.size}"`}, productImage
    FROM variantproduct where sku = ${`"${info.skuReference}"`}`
    let query = pool.query(sql,(err,results)=>{
      if(err) throw err
      res.send(results)
    })
})
router.post("/fromPP",auth,(req,res)=>{
    let info = req.body  
    let sql = `INSERT INTO incomingorderproducts (idIncomingOrders, predictedParentId, sku, wholeSalePrice, 
    quantity, retailPrice, productDescription, category, subCategory, colour, size, productImage) 
    SELECT ${`"${info.idIncomingOrders}"`} , ${`"${info.predictedParentId}"`},${`"${info.sku}"`},${`"${info.wholeSalePrice}"`}, 
    ${`"${info.quantity}"`} , ${`"${info.retailPrice}"`},${`"${info.productDescription}"`},${`"${info.category}"`}, 
    ${`"${info.subCategory}"`} , ${`"${info.colour}"`},${`"${info.size}"`}, productImage
    FROM variantproduct where idParentProduct = ${`"${info.predictedParentId}"`}
    LIMIT 1`
    let query = pool.query(sql,(err,results)=>{
      if(err) throw err
      res.send(results)
    })
})
module.exports =router