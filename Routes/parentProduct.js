const express = require("express")
const router = express.Router()
const pool = require("../dbpool")
const auth = require('../middleware/auth')


router.get('/all', auth,(req, res) => {
    let sql = `SELECT idParentProduct, productName, category, subCategory, idSuppliers, wholeSalePrice, basePrice, dateCreated,
                Case
                  when (productImage is null) then null
                    else "image"
                end
                as productImageBinary
                 FROM parentproduct`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});
router.get('/allPhoto',auth, (req, res) => {
    let sql = `SELECT *
                 FROM parentproduct`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});
router.get('/productImage/:idParentProduct', auth,(req, res) => {
    let sql = `SELECT productImage FROM parentproduct where idParentProduct=${`"${req.params.idParentProduct}"`}`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.get('/productName',auth, (req, res) => {
    let sql = `SELECT productName FROM parentproduct` ;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
})    

    
router.get('/getInfo/:productName',auth, (req, res) => {
    let sql = `SELECT * FROM parentproduct WHERE productName = ${`"${req.params.productName}"`}`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.get('/getInfoIpp/:ipp',auth, (req, res) => {
    let sql = `SELECT * FROM parentproduct WHERE idParentProduct = ${req.params.ipp}`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});



router.post("/new",auth, (req,res)=>{
    let info = req.body  
    if(req.files!==null){
        info["productImage"]=req.files.productImage.data    
    }
    console.log(info["productImage"])
    let sql = "INSERT INTO parentproduct set?"
    let query = pool.query(sql,info,(err,results)=>{
        if (err) throw err
        res.send(results)
    })
})
router.post("/fromIncoming",auth,(req,res)=>{
    console.log(req.body)
    let info = req.body  
    let sql = `INSERT INTO parentproduct(productName, category, subCategory, idSuppliers, wholeSalePrice, basePrice, dateCreated, productImage) 
        SELECT ${`"${info.productName}"`} , category, subCategory,  ${`"${info.idSuppliers}"`}, 
            wholeSalePrice, retailPrice, ${`"${info.dateCreated}"`}, productImage
        FROM incomingorderproducts 
        where idIncomingOrderProducts = ${info.idIncomingOrderProducts}`
    let query = pool.query(sql,(err,results)=>{
      if(err) throw err
      res.send(results)
    })
})
router.put("/changeImage", auth,(req,res)=>{
    let sql = `UPDATE parentproduct SET ? WHERE ?`
    let query = pool.query(sql,[{"productImage":req.files.productImage.data}, {"idParentProduct": req.body.idParentProduct}],
        (err,results)=>{
        if (err) throw err
        res.send(results)
    })
})
module.exports =router