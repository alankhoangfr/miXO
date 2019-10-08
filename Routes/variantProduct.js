const express = require("express")
const router = express.Router()
const pool = require("../dbpool")

router.get('/all', (req, res) => {
    let sql = `SELECT PP.productName,VP.idProducts, VP.sku, VP.idParentProduct, VP.size, VP.colour, VP.quantityInStock, VP.productDescription, 
    VP.wholeSalePrice, VP.priceAdjustment, VP.dateCreated, PP.category,PP.subCategory ,
    case
        when (VP.productImage is Null) then null
        else "Image"
    end as productImageBinary
    FROM VariantProduct VP LEFT JOIN ParentProduct PP 
    ON VP.idParentProduct=PP.idParentProduct `;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.put('/update', (req, res) => {
	console.log("update",req.body)
    let sql = `UPDATE VariantProduct SET ? WHERE sku= ${`"${req.body.sku}"`}`
    let query = pool.query(sql, req.body,(err, results) => {
        if(err) throw err;
        res.send(results);
    });
});
router.get('/productImage/:sku', (req, res) => {
    console.log(req.params.sku)
    let sql = `SELECT productImage FROM VariantProduct where sku=${`"${req.params.sku}"`}`;
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
    let sql = `UPDATE VariantProduct SET ?
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
    let sql = "INSERT INTO VariantProduct set?"
    let query = pool.query(sql,info,(err,results)=>{
        if (err) throw err
        res.send(results)
    })
})

router.post("/fromIncoming",(req,res)=>{
    let info = req.body  
    let sql = `INSERT INTO VariantProduct(sku, idParentProduct, size, colour, quantityInStock,
     productDescription, wholeSalePrice, priceAdjustment, dateCreated, productImage)
     SELECT ${`"${info.sku}"`} , ${`"${info.idParentProduct}"`},size, colour, quantity,productDescription, 
     wholeSalePrice, retailPrice,${`"${info.dateCreated}"`}, productImage FROM IncomingOrderProducts 
     where idIncomingOrderProducts = ${info.idIncomingOrderProducts}`
    let query = pool.query(sql,(err,results)=>{
      if(err) throw err
      res.send(results)
    })
})
router.get('/getIpp/:idParentProduct', (req, res) => {        
    let sql = `SELECT * FROM VariantProduct WHERE idParentProduct = ${req.params.idParentProduct}`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.get("/getSKU", (req, res) => {
    let sql = `SELECT * FROM VariantProduct WHERE sku = ${`"${req.query.sku}"`}`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.get('/iPPSizeColour/', (req, res) => {
    let sql = `SELECT * FROM VariantProduct WHERE idParentProduct = ${`"${req.query.Ipp}"`}and size =${`"${req.query.size}"`}and colour = ${`"${req.query.colour}"`}`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});



module.exports =router