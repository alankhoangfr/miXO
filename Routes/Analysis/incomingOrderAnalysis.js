const express = require("express")
const router = express.Router()
const pool = require("../../dbpool")
const auth = require('../../middleware/auth')


router.get('/amountSummary', auth,(req, res) => {
    let sql = `
        select ifnull(sum(totalAmount-ifnull(supplierDiscount,0)),0) amount, "Amount of Outstanding Payments" as status
		from incomingorders
		where not (status ="Cancelled") and paymentStatus = "Partially Paid" or paymentStatus is null and not (status ="Cancelled")
		union
		 SELECT sum(paid) as amount, "Total Amount Paid" as status
		 FROM incomingorders
		 union
		 SELECT Round(avg(paid),2) as averageAmount, "Average Amount Paid per Order" as status
		FROM incomingorders;`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});    


router.get('/quantitySummary', auth,(req, res) => {
    let sql = `
        select count(*) quantity,"Number of Outstanding Payments" as status
		from incomingorders
		where not (status ="Cancelled") and paymentStatus = "Partially Paid" or paymentStatus is null and not (status ="Cancelled")
		union
		select count(*) quantity, "Number of Outstanding Incoming Orders" as status
		from incomingorders
		where status not in ("Complete","Cancelled")
		union
		select sum(quantity) quantity, "Total Quantity Ordered" as status
		from incomingorderproducts
		union
		 select avg(sumQuantity.totalQuantity) as quantity, "Average Quantity per Order"
		from
		(
		SELECT iop.idIncomingOrders,sum(iop.quantity) as totalQuantity
		FROM incomingorderproducts iop
		group by iop.idIncomingOrders
		) as sumQuantity
        ;
    `;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});    

router.get('/topVp', auth,(req, res) => {
    let sql = `
		select pp.productName, vp.colour, vp.size,first.sumq as quantityOrdered,pp.category,pp.subCategory,vp.productImage,
		ifNull(vp.accumulation,ifnull(vp.quantityInStock,0))-ifnull(vp.quantityInStock,0) as quantitySold
		,(ifNull(vp.accumulation,ifnull(vp.quantityInStock,0))-ifnull(vp.quantityInStock,0))/first.sumq as ratio
		from 
		(
		SELECT vppp.sku, sum(iop.quantity) as sumq
		FROM  incomingorderproducts iop
		left join 
		(select pp.productName, vp.colour,vp.size,vp.idParentProduct,vp.sku
		from variantproduct vp
		left join parentproduct pp
		on pp.idParentProduct=vp.idParentProduct) as vppp
		on CONCAT(vppp.productName,"-",vppp.size,"-",vppp.colour)=iop.sku
		group by vppp.sku
		) as first
		left join variantproduct vp
		On vp.sku = first.sku
		left join parentproduct pp
		on vp.idParentProduct =pp.idParentProduct
		left join order_details ordd
		on ordd.sku=vp.sku
		left join orders ords
		on ords.idOrders=ordd.idOrders
		where pp.productName is not null or pp.category is not null or pp.subCategory is not null
		and ords.paymentStatus = "Completely Paid"
		or vp.colour is not null or vp.size
		order by quantityOrdered desc`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	

router.get('/topPp', auth,(req, res) => {
    let sql = `
		select pp.idParentProduct,pp.productName,pp.category,pp.subCategory,first.sumq as quantityOrdered
		,pp.productImage, ifnull(sold.totalSold,0) as quantitySold,
		(sold.totalSold/first.sumq) as ratio
		from 
			(
			SELECT vppp.idParentProduct, sum(iop.quantity) as sumq
			FROM  incomingorderproducts iop
			left join 
				(select pp.productName, vp.colour,vp.size,vp.idParentProduct
				from variantproduct vp
				left join parentproduct pp
				on pp.idParentProduct=vp.idParentProduct) as vppp
			on CONCAT(vppp.productName,"-",vppp.size,"-",vppp.colour)=iop.sku
			group by vppp.idParentProduct
			) as first
		left join parentproduct pp
		on first.idParentProduct =pp.idParentProduct
		left join 
			(
			select pp.idParentProduct,sum(ordd.quantity) totalSold
			from order_details ordd
			left join orders ords
			on ordd.idOrders=ords.idOrders
			left join variantproduct vp
			on vp.sku = ordd.sku
			left join parentproduct pp
			on vp.idParentProduct = pp.idParentProduct
			where ords.paymentStatus="Completely Paid"
			group by pp.idParentProduct) as sold
		on sold.idParentProduct = first.idParentProduct
		where pp.productName is not null or pp.category is not null or pp.subCategory is not null
		order by first.sumq desc;`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	



module.exports =router