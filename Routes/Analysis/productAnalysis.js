const express = require("express")
const router = express.Router()
const pool = require("../../dbpool")
const auth = require('../../middleware/auth')


router.get('/quantitySummary', auth,(req, res) => {
    let sql = `
    select count(*) as count, "Number of Brands" as status
	from parentproduct
	union
	select count(*) as count, "Number of Models" as status
	from variantproduct
	union
	select sum(quantityInStock) as count, "Models in Stock" as status
	from variantproduct;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	

router.get('/topVariantInStock', auth,(req, res) => {
    let sql = `
	select pp.productName, vp.size,vp.colour,vp.quantityInStock,pp.category,pp.subCategory,vp.productImage
	from variantproduct vp
	left join parentproduct pp
	On pp.idParentProduct = vp.idParentProduct 
	where vp.quantityInStock =
	(
	select max(quantityInStock)
	from variantproduct
	)
	order by pp.productName;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	


router.get('/restock', auth,(req, res) => {
    let sql = `
		select pp.productName, vp.colour, vp.size,first.sumq as quantityOrdered,pp.category,pp.subCategory,vp.productImage
		from 
		(
		select ordd.sku, sum(quantity) as sumq
		from order_details ordd
		group by ordd.sku
		) as first
		left join variantproduct vp
		on vp.sku = first.sku
		left join parentproduct pp
		On pp.idParentProduct = vp.idParentProduct
		where quantityInStock=0
		order by quantityOrdered desc
		;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	

router.get('/countInStock', auth,(req, res) => {
    let sql = `
		select quantityInStock, count(vp.sku) numberOfProducts
		from variantproduct vp
		group by quantityInStock
		order by quantityInStock;
		;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	

router.get('/shelfLife/orders', auth,(req, res) => {
    let sql = `
			SELECT pp.productName,pp.idParentProduct,ords.deliveryDate as date,ordd.quantity 
			FROM order_details ordd
			left join orders ords
			on ords.idOrders=ordd.idOrders
			left join variantproduct vp
			on vp.sku = ordd.sku
			left join parentproduct pp
			on pp.idParentProduct=vp.idParentProduct
			where deliveryDate is not Null
			order by deliveryDate;
		;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	

router.get('/shelfLife/incoming', auth,(req, res) => {
    let sql = `
			select * 
            from
            (
            SELECT vppp.productName,vppp.idParentProduct, iod.payDate as date,sum(iop.quantity) as quantity
			FROM  incomingorderproducts iop
			left join incomingorders iod
			on iod.idIncomingOrders=iop.idIncomingOrders
			left join 
			(select pp.idParentProduct,pp.productName, vp.colour,vp.size,vp.sku
			from variantproduct vp
			left join parentproduct pp
			on pp.idParentProduct=vp.idParentProduct) as vppp
			on CONCAT(vppp.productName,"-",vppp.size,"-",vppp.colour)=iop.sku
            where vppp.productName is not null
			group by vppp.productName,vppp.idParentProduct, iod.payDate
			order by payDate
            ) original
            union
            select * 
            from
            (
			SELECT vppp.productName,vppp.idParentProduct, iod.payDate as date,sum(iop.quantity) as quantity
			FROM  incomingorderproducts iop
			left join incomingorders iod
			on iod.idIncomingOrders=iop.idIncomingOrders
			left join 
            (select pp.idParentProduct,pp.productName, vp.colour,vp.size,vp.sku
			from variantproduct vp
			left join parentproduct pp
			on pp.idParentProduct=vp.idParentProduct) as vppp
			on vppp.sku=iop.sku
            where productName is not null
			group by vppp.productName,vppp.idParentProduct, iod.payDate
			order by payDate
            ) older;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	

module.exports =router