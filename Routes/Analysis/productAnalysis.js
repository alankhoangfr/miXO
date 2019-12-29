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
//Daily

router.get('/selectProduct/size/daily', auth,(req, res) => {
	const info = req.query
    let sql = `
    	select groupanalysis.*
		,totalProfit/groupanalysis.quantity as avgProfit,
		totalRevenue/groupanalysis.quantity as avgRevenue, totalDelivery/groupanalysis.quantity as avgDelivery
		from
		(
		select period,idParentProduct,productName,size as factor,sum(quantity) quantity,sum(netProfit) as totalProfit,
		sum(revenue) as totalRevenue, sum(deliveryPrice) as totalDelivery
			from(
				select (ords.orderDate) as period, pp.idParentProduct,pp.productName, vp.size,
				(ordd.quantity) as quantity,
				((ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/ordQ.quantityInOrder-vp.wholeSalePrice) as netProfit,
				(ifnull(ords.paid,0)/ordQ.quantityInOrder) as revenue,
				(ifnull(ords.deliveryPrice,0)/ordQ.quantityInOrder) as deliveryPrice
				from order_details ordd
				left join orders ords
				on ordd.idOrders = ords.idOrders
				left join (
				select idOrders,sum(quantity) quantityInOrder
				from order_details ordd
				group by idOrders
				having sum(quantity) is not null)  as ordQ
				on ordQ.idOrders =ordd.idOrders
				left join variantproduct vp
				on vp.sku = ordd.sku
				left join parentproduct pp
				on pp.idParentProduct=vp.idParentProduct
				where quantity is not null and ords.paymentStatus = "Completely Paid" and
				ords.orderDate BETWEEN CAST(${`"${info.start}"`}  AS DATE) AND CAST(${`"${info.end}"`}  AS DATE)
			) as analysis
		group by period, idParentProduct, productName, size
		) as groupanalysis
		order by period;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	
router.get('/selectProduct/colour/daily', auth,(req, res) => {
	const info = req.query
    let sql = `
    	select groupanalysis.*
		,totalProfit/groupanalysis.quantity as avgProfit,
		totalRevenue/groupanalysis.quantity as avgRevenue, totalDelivery/groupanalysis.quantity as avgDelivery
		from
		(
		select period,idParentProduct,productName,colour as factor,sum(quantity) quantity,sum(netProfit) as totalProfit,
		sum(revenue) as totalRevenue, sum(deliveryPrice) as totalDelivery
			from(
				select (ords.orderDate) as period, pp.idParentProduct,pp.productName, vp.colour,
				(ordd.quantity) as quantity,
				((ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/ordQ.quantityInOrder-vp.wholeSalePrice) as netProfit,
				(ifnull(ords.paid,0)/ordQ.quantityInOrder) as revenue,
				(ifnull(ords.deliveryPrice,0)/ordQ.quantityInOrder) as deliveryPrice
				from order_details ordd
				left join orders ords
				on ordd.idOrders = ords.idOrders
				left join (
				select idOrders,sum(quantity) quantityInOrder
				from order_details ordd
				group by idOrders
				having sum(quantity) is not null)  as ordQ
				on ordQ.idOrders =ordd.idOrders
				left join variantproduct vp
				on vp.sku = ordd.sku
				left join parentproduct pp
				on pp.idParentProduct=vp.idParentProduct
				where quantity is not null and ords.paymentStatus = "Completely Paid" and
				ords.orderDate BETWEEN CAST(${`"${info.start}"`}  AS DATE) AND CAST(${`"${info.end}"`}  AS DATE)
			) as analysis
		group by period, idParentProduct, productName, colour
		) as groupanalysis
		order by period;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	
router.get('/selectProduct/overall/daily', auth,(req, res) => {
	const info = req.query
    let sql = `
     	select groupanalysis.*
		,totalProfit/groupanalysis.quantity as avgProfit,
		totalRevenue/groupanalysis.quantity as avgRevenue, totalDelivery/groupanalysis.quantity as avgDelivery
		from
		(
		select period,idParentProduct,productName,null as factor,sum(quantity) quantity,sum(netProfit) as totalProfit,
		sum(revenue) as totalRevenue, sum(deliveryPrice) as totalDelivery
			from(
				select (ords.orderDate) as period, pp.idParentProduct,pp.productName,
				(ordd.quantity) as quantity,
				((ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/ordQ.quantityInOrder-vp.wholeSalePrice) as netProfit,
				(ifnull(ords.paid,0)/ordQ.quantityInOrder) as revenue,
				(ifnull(ords.deliveryPrice,0)/ordQ.quantityInOrder) as deliveryPrice
				from order_details ordd
				left join orders ords
				on ordd.idOrders = ords.idOrders
				left join (
				select idOrders,sum(quantity) quantityInOrder
				from order_details ordd
				group by idOrders
				having sum(quantity) is not null)  as ordQ
				on ordQ.idOrders =ordd.idOrders
				left join variantproduct vp
				on vp.sku = ordd.sku
				left join parentproduct pp
				on pp.idParentProduct=vp.idParentProduct
				where quantity is not null and ords.paymentStatus = "Completely Paid" and
				ords.orderDate BETWEEN CAST(${`"${info.start}"`}  AS DATE) AND CAST(${`"${info.end}"`}  AS DATE)
			) as analysis
		group by period, idParentProduct, productName, factor
		) as groupanalysis
		order by period;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	

//weekly
router.get('/selectProduct/size/wk', auth,(req, res) => {
	const info = req.query
    let sql = `
		select groupanalysis.*
		,totalProfit/groupanalysis.quantity as avgProfit,
		totalRevenue/groupanalysis.quantity as avgRevenue, totalDelivery/groupanalysis.quantity as avgDelivery
		from
		(
		select period,idParentProduct,productName,size as factor,sum(quantity) quantity,sum(netProfit) as totalProfit,
		sum(revenue) as totalRevenue, sum(deliveryPrice) as totalDelivery
			from(
				select week(ords.orderDate) as period, pp.idParentProduct,pp.productName, vp.size,
				(ordd.quantity) as quantity,
				((ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/ordQ.quantityInOrder-vp.wholeSalePrice) as netProfit,
				(ifnull(ords.paid,0)/ordQ.quantityInOrder) as revenue,
				(ifnull(ords.deliveryPrice,0)/ordQ.quantityInOrder) as deliveryPrice
				from order_details ordd
				left join orders ords
				on ordd.idOrders = ords.idOrders
				left join (
				select idOrders,sum(quantity) quantityInOrder
				from order_details ordd
				group by idOrders
				having sum(quantity) is not null)  as ordQ
				on ordQ.idOrders =ordd.idOrders
				left join variantproduct vp
				on vp.sku = ordd.sku
				left join parentproduct pp
				on pp.idParentProduct=vp.idParentProduct
				where quantity is not null and ords.paymentStatus = "Completely Paid" and
				ords.orderDate BETWEEN CAST(${`"${info.start}"`}  AS DATE) AND CAST(${`"${info.end}"`}  AS DATE)
			) as analysis
		group by period, idParentProduct, productName, size
		) as groupanalysis
		order by period;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	
router.get('/selectProduct/colour/wk', auth,(req, res) => {
	const info = req.query
    let sql = `
		select groupanalysis.*
		,totalProfit/groupanalysis.quantity as avgProfit,
		totalRevenue/groupanalysis.quantity as avgRevenue, totalDelivery/groupanalysis.quantity as avgDelivery
		from
		(
		select period,idParentProduct,productName,colour as factor,sum(quantity) quantity,sum(netProfit) as totalProfit,
		sum(revenue) as totalRevenue, sum(deliveryPrice) as totalDelivery
			from(
				select week(ords.orderDate) as period, pp.idParentProduct,pp.productName, vp.colour,
				(ordd.quantity) as quantity,
				((ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/ordQ.quantityInOrder-vp.wholeSalePrice) as netProfit,
				(ifnull(ords.paid,0)/ordQ.quantityInOrder) as revenue,
				(ifnull(ords.deliveryPrice,0)/ordQ.quantityInOrder) as deliveryPrice
				from order_details ordd
				left join orders ords
				on ordd.idOrders = ords.idOrders
				left join (
				select idOrders,sum(quantity) quantityInOrder
				from order_details ordd
				group by idOrders
				having sum(quantity) is not null)  as ordQ
				on ordQ.idOrders =ordd.idOrders
				left join variantproduct vp
				on vp.sku = ordd.sku
				left join parentproduct pp
				on pp.idParentProduct=vp.idParentProduct
				where quantity is not null and ords.paymentStatus = "Completely Paid" and
				ords.orderDate BETWEEN CAST(${`"${info.start}"`}  AS DATE) AND CAST(${`"${info.end}"`}  AS DATE)
			) as analysis
		group by period, idParentProduct, productName, colour
		) as groupanalysis
		order by period;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	
router.get('/selectProduct/overall/wk', auth,(req, res) => {
	const info = req.query
    let sql = `
    	select groupanalysis.*
		,totalProfit/groupanalysis.quantity as avgProfit,
		totalRevenue/groupanalysis.quantity as avgRevenue, totalDelivery/groupanalysis.quantity as avgDelivery
		from
		(
		select period,idParentProduct,productName,null as factor,sum(quantity) quantity,sum(netProfit) as totalProfit,
		sum(revenue) as totalRevenue, sum(deliveryPrice) as totalDelivery
			from(
				select week(ords.orderDate) as period, pp.idParentProduct,pp.productName,
				(ordd.quantity) as quantity,
				((ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/ordQ.quantityInOrder-vp.wholeSalePrice) as netProfit,
				(ifnull(ords.paid,0)/ordQ.quantityInOrder) as revenue,
				(ifnull(ords.deliveryPrice,0)/ordQ.quantityInOrder) as deliveryPrice
				from order_details ordd
				left join orders ords
				on ordd.idOrders = ords.idOrders
				left join (
				select idOrders,sum(quantity) quantityInOrder
				from order_details ordd
				group by idOrders
				having sum(quantity) is not null)  as ordQ
				on ordQ.idOrders =ordd.idOrders
				left join variantproduct vp
				on vp.sku = ordd.sku
				left join parentproduct pp
				on pp.idParentProduct=vp.idParentProduct
				where quantity is not null and ords.paymentStatus = "Completely Paid" and
				ords.orderDate BETWEEN CAST(${`"${info.start}"`}  AS DATE) AND CAST(${`"${info.end}"`}  AS DATE)
			) as analysis
		group by period, idParentProduct, productName,factor
		) as groupanalysis
		order by period;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	
//Monthly 
router.get('/selectProduct/size/mth', auth,(req, res) => {
	const info = req.query
    let sql = `
    	select groupanalysis.*
		,totalProfit/groupanalysis.quantity as avgProfit,
		totalRevenue/groupanalysis.quantity as avgRevenue, totalDelivery/groupanalysis.quantity as avgDelivery
		from
		(
		select period,idParentProduct,productName,size as factor,sum(quantity) quantity,sum(netProfit) as totalProfit,
		sum(revenue) as totalRevenue, sum(deliveryPrice) as totalDelivery
			from(
				select concat(month(ords.orderDate),year(ords.orderDate)) as period, pp.idParentProduct,pp.productName, vp.size,
				(ordd.quantity) as quantity,
				((ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/ordQ.quantityInOrder-vp.wholeSalePrice) as netProfit,
				(ifnull(ords.paid,0)/ordQ.quantityInOrder) as revenue,
				(ifnull(ords.deliveryPrice,0)/ordQ.quantityInOrder) as deliveryPrice
				from order_details ordd
				left join orders ords
				on ordd.idOrders = ords.idOrders
				left join (
				select idOrders,sum(quantity) quantityInOrder
				from order_details ordd
				group by idOrders
				having sum(quantity) is not null)  as ordQ
				on ordQ.idOrders =ordd.idOrders
				left join variantproduct vp
				on vp.sku = ordd.sku
				left join parentproduct pp
				on pp.idParentProduct=vp.idParentProduct
				where quantity is not null and ords.paymentStatus = "Completely Paid" and
				ords.orderDate BETWEEN CAST(${`"${info.start}"`}  AS DATE) AND CAST(${`"${info.end}"`}  AS DATE)
			) as analysis
		group by period, idParentProduct, productName, size
		) as groupanalysis
		order by period;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	
router.get('/selectProduct/colour/mth', auth,(req, res) => {
	const info = req.query
    let sql = `
    	select groupanalysis.*
		,totalProfit/groupanalysis.quantity as avgProfit,
		totalRevenue/groupanalysis.quantity as avgRevenue, totalDelivery/groupanalysis.quantity as avgDelivery
		from
		(
		select period,idParentProduct,productName,colour as factor,sum(quantity) quantity,sum(netProfit) as totalProfit,
		sum(revenue) as totalRevenue, sum(deliveryPrice) as totalDelivery
			from(
				select concat(month(ords.orderDate),year(ords.orderDate)) as period, pp.idParentProduct,pp.productName, vp.colour,
				(ordd.quantity) as quantity,
				((ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/ordQ.quantityInOrder-vp.wholeSalePrice) as netProfit,
				(ifnull(ords.paid,0)/ordQ.quantityInOrder) as revenue,
				(ifnull(ords.deliveryPrice,0)/ordQ.quantityInOrder) as deliveryPrice
				from order_details ordd
				left join orders ords
				on ordd.idOrders = ords.idOrders
				left join (
				select idOrders,sum(quantity) quantityInOrder
				from order_details ordd
				group by idOrders
				having sum(quantity) is not null)  as ordQ
				on ordQ.idOrders =ordd.idOrders
				left join variantproduct vp
				on vp.sku = ordd.sku
				left join parentproduct pp
				on pp.idParentProduct=vp.idParentProduct
				where quantity is not null and ords.paymentStatus = "Completely Paid" and
				ords.orderDate BETWEEN CAST(${`"${info.start}"`}  AS DATE) AND CAST(${`"${info.end}"`}  AS DATE)
			) as analysis
		group by period, idParentProduct, productName, colour
		) as groupanalysis
		order by period;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	
router.get('/selectProduct/overall/mth', auth,(req, res) => {
	const info = req.query
    let sql = `
     	select groupanalysis.*
		,totalProfit/groupanalysis.quantity as avgProfit,
		totalRevenue/groupanalysis.quantity as avgRevenue, totalDelivery/groupanalysis.quantity as avgDelivery
		from
		(
		select period,idParentProduct,productName,null as factor,sum(quantity) quantity,sum(netProfit) as totalProfit,
		sum(revenue) as totalRevenue, sum(deliveryPrice) as totalDelivery
			from(
				select concat(month(ords.orderDate),year(ords.orderDate)) as period, pp.idParentProduct,pp.productName,
				(ordd.quantity) as quantity,
				((ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/ordQ.quantityInOrder-vp.wholeSalePrice) as netProfit,
				(ifnull(ords.paid,0)/ordQ.quantityInOrder) as revenue,
				(ifnull(ords.deliveryPrice,0)/ordQ.quantityInOrder) as deliveryPrice
				from order_details ordd
				left join orders ords
				on ordd.idOrders = ords.idOrders
				left join (
				select idOrders,sum(quantity) quantityInOrder
				from order_details ordd
				group by idOrders
				having sum(quantity) is not null)  as ordQ
				on ordQ.idOrders =ordd.idOrders
				left join variantproduct vp
				on vp.sku = ordd.sku
				left join parentproduct pp
				on pp.idParentProduct=vp.idParentProduct
				where quantity is not null and ords.paymentStatus = "Completely Paid" and
				ords.orderDate BETWEEN CAST(${`"${info.start}"`}  AS DATE) AND CAST(${`"${info.end}"`}  AS DATE)
			) as analysis
		group by period, idParentProduct, productName, factor
		) as groupanalysis
		order by period;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	

//Quarterly

router.get('/selectProduct/size/qrt', auth,(req, res) => {
	const info = req.query
    let sql = `
    	select groupanalysis.*
		,totalProfit/groupanalysis.quantity as avgProfit,
		totalRevenue/groupanalysis.quantity as avgRevenue, totalDelivery/groupanalysis.quantity as avgDelivery
		from
		(
		select period,idParentProduct,productName,size as factor,sum(quantity) quantity,sum(netProfit) as totalProfit,
		sum(revenue) as totalRevenue, sum(deliveryPrice) as totalDelivery
			from(
				select concat(quarter(ords.orderDate),year(ords.orderDate)) as period, pp.idParentProduct,pp.productName, vp.size,
				(ordd.quantity) as quantity,
				((ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/ordQ.quantityInOrder-vp.wholeSalePrice) as netProfit,
				(ifnull(ords.paid,0)/ordQ.quantityInOrder) as revenue,
				(ifnull(ords.deliveryPrice,0)/ordQ.quantityInOrder) as deliveryPrice
				from order_details ordd
				left join orders ords
				on ordd.idOrders = ords.idOrders
				left join (
				select idOrders,sum(quantity) quantityInOrder
				from order_details ordd
				group by idOrders
				having sum(quantity) is not null)  as ordQ
				on ordQ.idOrders =ordd.idOrders
				left join variantproduct vp
				on vp.sku = ordd.sku
				left join parentproduct pp
				on pp.idParentProduct=vp.idParentProduct
				where quantity is not null and ords.paymentStatus = "Completely Paid" and
				ords.orderDate BETWEEN CAST(${`"${info.start}"`}  AS DATE) AND CAST(${`"${info.end}"`}  AS DATE)
			) as analysis
		group by period, idParentProduct, productName, size
		) as groupanalysis
		order by period;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	
router.get('/selectProduct/colour/qrt', auth,(req, res) => {
	const info = req.query
    let sql = `
    	select groupanalysis.*
		,totalProfit/groupanalysis.quantity as avgProfit,
		totalRevenue/groupanalysis.quantity as avgRevenue, totalDelivery/groupanalysis.quantity as avgDelivery
		from
		(
		select period,idParentProduct,productName,colour as factor,sum(quantity) quantity,sum(netProfit) as totalProfit,
		sum(revenue) as totalRevenue, sum(deliveryPrice) as totalDelivery
			from(
				select concat(quarter(ords.orderDate),year(ords.orderDate)) as period, pp.idParentProduct,pp.productName, vp.colour,
				(ordd.quantity) as quantity,
				((ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/ordQ.quantityInOrder-vp.wholeSalePrice) as netProfit,
				(ifnull(ords.paid,0)/ordQ.quantityInOrder) as revenue,
				(ifnull(ords.deliveryPrice,0)/ordQ.quantityInOrder) as deliveryPrice
				from order_details ordd
				left join orders ords
				on ordd.idOrders = ords.idOrders
				left join (
				select idOrders,sum(quantity) quantityInOrder
				from order_details ordd
				group by idOrders
				having sum(quantity) is not null)  as ordQ
				on ordQ.idOrders =ordd.idOrders
				left join variantproduct vp
				on vp.sku = ordd.sku
				left join parentproduct pp
				on pp.idParentProduct=vp.idParentProduct
				where quantity is not null and ords.paymentStatus = "Completely Paid" and
				ords.orderDate BETWEEN CAST(${`"${info.start}"`}  AS DATE) AND CAST(${`"${info.end}"`}  AS DATE)
			) as analysis
		group by period, idParentProduct, productName, colour
		) as groupanalysis
		order by period;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	
router.get('/selectProduct/overall/qrt', auth,(req, res) => {
	const info = req.query
    let sql = `
     	select groupanalysis.*
		,totalProfit/groupanalysis.quantity as avgProfit,
		totalRevenue/groupanalysis.quantity as avgRevenue, totalDelivery/groupanalysis.quantity as avgDelivery
		from
		(
		select period,idParentProduct,productName,null as factor,sum(quantity) quantity,sum(netProfit) as totalProfit,
		sum(revenue) as totalRevenue, sum(deliveryPrice) as totalDelivery
			from(
				select concat(quarter(ords.orderDate),year(ords.orderDate)) as period, pp.idParentProduct,pp.productName,
				(ordd.quantity) as quantity,
				((ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/ordQ.quantityInOrder-vp.wholeSalePrice) as netProfit,
				(ifnull(ords.paid,0)/ordQ.quantityInOrder) as revenue,
				(ifnull(ords.deliveryPrice,0)/ordQ.quantityInOrder) as deliveryPrice
				from order_details ordd
				left join orders ords
				on ordd.idOrders = ords.idOrders
				left join (
				select idOrders,sum(quantity) quantityInOrder
				from order_details ordd
				group by idOrders
				having sum(quantity) is not null)  as ordQ
				on ordQ.idOrders =ordd.idOrders
				left join variantproduct vp
				on vp.sku = ordd.sku
				left join parentproduct pp
				on pp.idParentProduct=vp.idParentProduct
				where quantity is not null and ords.paymentStatus = "Completely Paid" and
				ords.orderDate BETWEEN CAST(${`"${info.start}"`}  AS DATE) AND CAST(${`"${info.end}"`}  AS DATE)
			) as analysis
		group by period, idParentProduct, productName, factor
		) as groupanalysis
		order by period;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	

//Yearly

router.get('/selectProduct/size/yr', auth,(req, res) => {
	const info = req.query
    let sql = `
    	select groupanalysis.*
		,totalProfit/groupanalysis.quantity as avgProfit,
		totalRevenue/groupanalysis.quantity as avgRevenue, totalDelivery/groupanalysis.quantity as avgDelivery
		from
		(
		select period,idParentProduct,productName,size as factor,sum(quantity) quantity,sum(netProfit) as totalProfit,
		sum(revenue) as totalRevenue, sum(deliveryPrice) as totalDelivery
			from(
				select year(ords.orderDate) as period, pp.idParentProduct,pp.productName, vp.size,
				(ordd.quantity) as quantity,
				((ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/ordQ.quantityInOrder-vp.wholeSalePrice) as netProfit,
				(ifnull(ords.paid,0)/ordQ.quantityInOrder) as revenue,
				(ifnull(ords.deliveryPrice,0)/ordQ.quantityInOrder) as deliveryPrice
				from order_details ordd
				left join orders ords
				on ordd.idOrders = ords.idOrders
				left join (
				select idOrders,sum(quantity) quantityInOrder
				from order_details ordd
				group by idOrders
				having sum(quantity) is not null)  as ordQ
				on ordQ.idOrders =ordd.idOrders
				left join variantproduct vp
				on vp.sku = ordd.sku
				left join parentproduct pp
				on pp.idParentProduct=vp.idParentProduct
				where quantity is not null and ords.paymentStatus = "Completely Paid" and
				ords.orderDate BETWEEN CAST(${`"${info.start}"`}  AS DATE) AND CAST(${`"${info.end}"`}  AS DATE)
			) as analysis
		group by period, idParentProduct, productName, size
		) as groupanalysis
		order by period;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	
router.get('/selectProduct/colour/yr', auth,(req, res) => {
	const info = req.query
    let sql = `
    	select groupanalysis.*
		,totalProfit/groupanalysis.quantity as avgProfit,
		totalRevenue/groupanalysis.quantity as avgRevenue, totalDelivery/groupanalysis.quantity as avgDelivery
		from
		(
		select period,idParentProduct,productName,colour as factor,sum(quantity) quantity,sum(netProfit) as totalProfit,
		sum(revenue) as totalRevenue, sum(deliveryPrice) as totalDelivery
			from(
				select year(ords.orderDate) as period, pp.idParentProduct,pp.productName, vp.colour,
				(ordd.quantity) as quantity,
				((ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/ordQ.quantityInOrder-vp.wholeSalePrice) as netProfit,
				(ifnull(ords.paid,0)/ordQ.quantityInOrder) as revenue,
				(ifnull(ords.deliveryPrice,0)/ordQ.quantityInOrder) as deliveryPrice
				from order_details ordd
				left join orders ords
				on ordd.idOrders = ords.idOrders
				left join (
				select idOrders,sum(quantity) quantityInOrder
				from order_details ordd
				group by idOrders
				having sum(quantity) is not null)  as ordQ
				on ordQ.idOrders =ordd.idOrders
				left join variantproduct vp
				on vp.sku = ordd.sku
				left join parentproduct pp
				on pp.idParentProduct=vp.idParentProduct
				where quantity is not null and ords.paymentStatus = "Completely Paid" and
				ords.orderDate BETWEEN CAST(${`"${info.start}"`}  AS DATE) AND CAST(${`"${info.end}"`}  AS DATE)
			) as analysis
		group by period, idParentProduct, productName, colour
		) as groupanalysis
		order by period;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	
router.get('/selectProduct/overall/yr', auth,(req, res) => {
	const info = req.query
    let sql = `
     	select groupanalysis.*
		,totalProfit/groupanalysis.quantity as avgProfit,
		totalRevenue/groupanalysis.quantity as avgRevenue, totalDelivery/groupanalysis.quantity as avgDelivery
		from
		(
		select period,idParentProduct,productName,null as factor,sum(quantity) quantity,sum(netProfit) as totalProfit,
		sum(revenue) as totalRevenue, sum(deliveryPrice) as totalDelivery
			from(
				select year(ords.orderDate) as period, pp.idParentProduct,pp.productName,
				(ordd.quantity) as quantity,
				((ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/ordQ.quantityInOrder-vp.wholeSalePrice) as netProfit,
				(ifnull(ords.paid,0)/ordQ.quantityInOrder) as revenue,
				(ifnull(ords.deliveryPrice,0)/ordQ.quantityInOrder) as deliveryPrice
				from order_details ordd
				left join orders ords
				on ordd.idOrders = ords.idOrders
				left join (
				select idOrders,sum(quantity) quantityInOrder
				from order_details ordd
				group by idOrders
				having sum(quantity) is not null)  as ordQ
				on ordQ.idOrders =ordd.idOrders
				left join variantproduct vp
				on vp.sku = ordd.sku
				left join parentproduct pp
				on pp.idParentProduct=vp.idParentProduct
				where quantity is not null and ords.paymentStatus = "Completely Paid" and
				ords.orderDate BETWEEN CAST(${`"${info.start}"`}  AS DATE) AND CAST(${`"${info.end}"`}  AS DATE)
			) as analysis
		group by period, idParentProduct, productName, factor
		) as groupanalysis
		order by period;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	
module.exports =router