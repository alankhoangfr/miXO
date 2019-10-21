const express = require("express")
const router = express.Router()
const pool = require("../dbpool")

router.get('/all', (req, res) => {
    let sql = `SELECT PP.productName,VP.idProducts, VP.sku, VP.idParentProduct, VP.size, VP.colour, VP.quantityInStock, VP.productDescription, 
    VP.wholeSalePrice, VP.priceAdjustment, VP.dateCreated, VP.accumulation,PP.category,PP.subCategory ,
    case
        when (VP.productImage is Null) then null
        else "Image"
    end as productImageBinary
    FROM variantproduct VP LEFT JOIN parentproduct PP 
    ON VP.idParentProduct=PP.idParentProduct `;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.put('/update', (req, res) => {
	console.log("update",req.body)
    let sql = `UPDATE variantproduct SET ? WHERE sku= ${`"${req.body.sku}"`}`
    let query = pool.query(sql, req.body,(err, results) => {
        if(err) throw err;
        res.send(results);
    });
});
router.get('/productImage/:sku', (req, res) => {
    console.log(req.params.sku)
    let sql = `SELECT productImage FROM variantproduct where sku=${`"${req.params.sku}"`}`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});
router.put('/updateWithImage', (req, res) => {
    let info = req.body    
    if(req.files!==null){
        info["productImage"]=req.files.productImage.data    
    }
    let sql = `UPDATE variantproduct SET ?
    WHERE sku=${`"${req.body.sku}"`}`
    let query = pool.query(sql, info,(err, results) => {
            if(err) throw err;
            res.send(results);
        });
});
router.post("/new", (req,res)=>{
    let info = req.body    
    if(req.files!==null){
        info["productImage"]=req.files.productImage.data    
    }
    let sql = "INSERT INTO variantproduct set?"
    let query = pool.query(sql,info,(err,results)=>{
        if (err) throw err
        res.send(results)
    })
})

router.post("/fromIncoming",(req,res)=>{
    let info = req.body  
    let sql = `INSERT INTO variantproduct(sku, idParentProduct, size, colour, quantityInStock,
     productDescription, wholeSalePrice, priceAdjustment, dateCreated, productImage,accumulation)
     SELECT ${`"${info.sku}"`} , ${`"${info.idParentProduct}"`},size, colour, statusQuantity ,productDescription, 
     wholeSalePrice, retailPrice,${`"${info.dateCreated}"`}, productImage, ${`"${info.accumulation}"`} FROM incomingorderproducts
     where idIncomingOrderProducts = ${info.idIncomingOrderProducts}`
    let query = pool.query(sql,(err,results)=>{
      if(err) throw err
      res.send(results)
    })
})
router.get('/getIpp/:idParentProduct', (req, res) => {        
    let sql = `SELECT * FROM variantproduct WHERE idParentProduct = ${req.params.idParentProduct}`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.get("/getSKU", (req, res) => {
    let sql = `SELECT * FROM variantproduct WHERE sku = ${`"${req.query.sku}"`}`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.get('/iPPSizeColour/', (req, res) => {
    let sql = `SELECT * FROM variantproduct WHERE idParentProduct = ${`"${req.query.Ipp}"`}and size =${`"${req.query.size}"`}and colour = ${`"${req.query.colour}"`}`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});



module.exports =router