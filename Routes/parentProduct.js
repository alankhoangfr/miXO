const express = require("express")
const router = express.Router()
const pool = require("../dbpool")
var fs = require("fs");
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function(req, file, cb){
    cb(null,file.originalname + '-' + Date.now() + path.extname(file.originalname));
  }
});


function checkFileType(file, cb){
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Images Only!');
  }
}

const upload = multer({
  storage: storage,
  limits:{fileSize: 1000000},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).single('image')


router.get('/all', (req, res) => {
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

router.get('/productImage/:idParentProduct', (req, res) => {
    console.log(req.params.idParentProduct)
    let sql = `SELECT productImage FROM parentproduct where idParentProduct=${`"${req.params.idParentProduct}"`}`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.get('/productName', (req, res) => {
    let sql = `SELECT productName FROM parentproduct` ;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
})    

    
router.get('/getInfo/:productName', (req, res) => {
    let sql = `SELECT * FROM parentproduct WHERE productName = ${`"${req.params.productName}"`}`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});

router.get('/getInfoIpp/:ipp', (req, res) => {
    let sql = `SELECT * FROM parentproduct WHERE idParentProduct = ${req.params.ipp}`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results);
    });
});




router.post("/newMulter", upload, (req,res)=>{
    let info = req.body    
    info["productImage"]=req.file.path
    let sql = "INSERT INTO parentproduct set?"
    let query = pool.query(sql,info,(err,results)=>{
        if (err) throw err
        res.send(results)
    })
})
    

router.post("/new", (req,res)=>{
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
router.post("/fromIncoming",(req,res)=>{
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
router.put("/changeImage", (req,res)=>{
    let sql = `UPDATE parentproduct SET ? WHERE ?`
    let query = pool.query(sql,[{"productImage":req.files.productImage.data}, {"idParentProduct": req.body.idParentProduct}],
        (err,results)=>{
        if (err) throw err
        res.send(results)
    })
})
module.exports =router