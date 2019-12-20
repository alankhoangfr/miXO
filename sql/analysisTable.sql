/* Check */
select second.*,pp.productName,vp.colour,vp.size,ords.orderDate,
ords .customerId, ordd.quantity
from
(
select first.sku, first.sumq,
vp.quantityInStock stock ,vp.accumulation accum,
(vp.accumulation-vp.quantityInStock-first.sumq)
from (
select ords.sku sku , sum(ords.quantity) as sumq 
from order_details ords
group by sku
) as first
left join variantproduct vp
on vp.sku = first.sku
where vp.accumulation-vp.quantityInStock-first.sumq <>0
) as second
inner join order_details ordd
on ordd.sku=second.sku
left join orders ords
on ords.idOrders=ordd.idOrders
left join variantproduct vp
on vp.sku = second.sku
left join parentproduct pp
On pp.idParentProduct = vp.idParentProduct ;

/*check 2 */
select cust.customerId, cust.firstName, cust.lastName, ords.totalPriceSold,ords.reduction,ords.deliveryPrice
from orders ords
left join customers cust 
on cust.customerId=ords.customerId
order by customerId;

/* Orders */
/* Number of Outstanding Payments*/
select count(*) nOutPay from orders
where not (status ="Cancelled") and paymentStatus = "Partially Paid" or paymentStatus is null and not (status ="Cancelled");
/* Amount of outstanding payments*/
select sum(totalPriceSold-ifnull(reduction,0)+ifnull(deliveryPrice,0)-ifnull(paid,0)) amountOut from orders
where not (status ="Cancelled") and paymentStatus = "Partially Paid" or paymentStatus is null and not (status ="Cancelled");
/* Number of outstanding delivery*/
select count(*) outDelivery from orders
where status not in ("Delivered","Cancelled");
/* Number of Products Ordered*/
select sum(quantity) quantityOrdered
from order_details ;

/*Amount Summary*/
select sum(IFNULL(totalPriceSold,0)-IFNULL(reduction,0)+IFNULL(deliveryPrice,0)-IFNULL(paid,0)) as amount,
IFNULL(paymentStatus,"Not Paid") as status
from orders
where not paymentStatus = "Completely Paid" or paymentStatus is null
group by paymentStatus
union
select sum(paid) as amount,paymentStatus as status
from orders
where paymentStatus="Completely Paid"
group by paymentStatus;

/*Quantity Summary*/
select count(IFNULL(paymentStatus,"Not Paid")) as count ,IFNULL(paymentStatus,"Not Paid") as status
from orders
group by paymentStatus
union
select count(IFNULL(deliveryDate,"Not Deliveried")) as count ,IFNULL(deliveryDate,"Not Deliveried") as status
from orders
where deliveryDate is null and not status = "Cancelled"
group by deliveryDate
union
select sum(quantity) count,"Total Quantity Ordered"
from order_details ;

/* Top parent products ordered */
select pp.productName,pp.category,pp.subCategory,first.sumq as quantityOrdered
,pp.productImage
from 
(
select vp.idParentProduct, sum(quantity) as sumq
from order_details ordd 
left join variantproduct vp
on vp.sku=ordd.sku
group by vp.idParentProduct
) as first
left join parentproduct pp
on first.idParentProduct =pp.idParentProduct
order by first.sumq desc;

/*Top variant Product ordered */
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
order by quantityOrdered desc
;

/* Number of products, orders, new customers and existing customers*/
select nOrders.*,nProducts.numberOfProducts
from
(
select week(ords.orderDate) period, ifnull(sum(ordd.quantity),0) numberOfProducts
from order_details ordd
left join orders ords
on ords.idOrders=ordd.idOrders
group by period
) as nProducts
left join
(
select week(orderDate) period,
ifnull(count(ords.idOrders),0) numberOfOrders,
ifnull(count(distinct( ords.customerId)),0) numberOfNewCustomers,
ifnull(count(ords.customerId)-count(distinct( ords.customerId)),0) numberOfExisting
from orders ords
group by period
) as nOrders
on nOrders.period =nProducts.period
order by period;

/* Number of parent Product per period*/
select week(ords.orderDate) wk, pp.productName productName, ifnull(sum(ordd.quantity),0) quantity
from order_details ordd
left join variantproduct vp
on vp.sku = ordd.sku
left join orders ords
on ords.idOrders=ordd.idOrders
left join parentproduct pp
on pp.idParentProduct = vp.idParentProduct
group by wk,productName
order by wk;

/*Top colour and size per period*/

select colour.*,size.numberSize,size.size
from
(
select s.period, ifnull(s.maxq,0) as numberSize, first.size
from(
select first.period, max(first.totalquantity) as maxq
from
(
select week(ords.orderDate) as period, sum(ordd.quantity) as totalquantity, vp.size 
from order_details ordd 
left join variantproduct vp 
on vp.sku = ordd.sku
left join orders ords 
on ords.idOrders = ordd.idOrders
group by period,size
) as first
group by period
) as s
left join 
(
select week(ords.orderDate) as period, sum(ordd.quantity) as totalquantity, vp.size 
from order_details ordd 
left join variantproduct vp 
on vp.sku = ordd.sku
left join orders ords 
on ords.idOrders = ordd.idOrders
group by period,size
) as first
on first.period=s.period
and first.totalquantity =s.maxq
) as size
left join
(
select s.period period , ifnull(s.maxq,0) as numberColour, first.colour
from(
select first.period, max(first.totalquantity) as maxq
from
(
select week(ords.orderDate) as period, sum(ordd.quantity) as totalquantity, vp.colour 
from order_details ordd 
left join variantproduct vp 
on vp.sku = ordd.sku
left join orders ords 
on ords.idOrders = ordd.idOrders
group by period,colour
) as first
group by period
) as s
left join 
(
select week(ords.orderDate) as period, sum(ordd.quantity) as totalquantity, vp.colour
from order_details ordd 
left join variantproduct vp 
on vp.sku = ordd.sku
left join orders ords 
on ords.idOrders = ordd.idOrders
group by period,colour
) as first
on first.period=s.period
and first.totalquantity =s.maxq
) as colour
on colour.period=size.period
order by period;

/* Number of variant Product per period*/
/*Not needed*/
select week(ords.orderDate) wk, vp.sku sku,
pp.productName productName, vp.colour colour, vp.size size, sum(ordd.quantity) quantity
from order_details ordd
left join variantproduct vp
on vp.sku = ordd.sku
left join orders ords
on ords.idOrders=ordd.idOrders
left join parentproduct pp
on pp.idParentProduct = vp.idParentProduct
group by wk,sku,productName, colour,size
order by wk;

/* Products /*
/* Quantity Summary*/

select count(*) as count, "Number of Product Models" as status
from parentproduct
union
select count(*) as count, "Number of Model Vairations" as status
from variantproduct
union
select sum(accumulation) as count, "Total quantity ordered in lifetime" as status
from variantproduct
union
select sum(quantityInStock) as count, "Total quantity in Stock" as status
from variantproduct;


/*Variant Product that needs to be restocked*/
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
;


/* Top variant Product in stock*/
select pp.productName, vp.size,vp.colour,vp.quantityInStock,pp.category,pp.subCategory,vp.productImage
from variantproduct vp
left join parentproduct pp
On pp.idParentProduct = vp.idParentProduct 
where vp.quantityInStock =
(
select max(quantityInStock)
from variantproduct
)
order by pp.productName;

/* Count of products in stock*/
select quantityInStock, count(vp.sku) numberOfProducts
from variantproduct vp
group by quantityInStock
order by quantityInStock;


/* Shelf Life*/
/* orders*/
SELECT ordd.sku,ords.deliveryDate,ordd.quantity 
FROM order_details ordd
left join orders ords
on ords.idOrders=ordd.idOrders
where deliveryDate is not Null
order by deliveryDate;

/* incoming*/
SELECT vppp.sku, iod.payDate,iop.quantity
FROM  incomingorderproducts iop
left join incomingorders iod
on iod.idIncomingOrders=iop.idIncomingOrders
left join 
(select pp.productName, vp.colour,vp.size,vp.sku
from variantproduct vp
left join parentproduct pp
on pp.idParentProduct=vp.idParentProduct) as vppp
on CONCAT(vppp.productName,"-",vppp.size,"-",vppp.colour)=iop.sku
order by payDate;

/* Incoming Orders*/

/* Amount summary*/
select ifnull(sum(totalAmount-ifnull(supplierDiscount,0)),0) amount, "Amount of Outstanding Payments" as status
from incomingorders
where not (status ="Cancelled") and paymentStatus = "Partially Paid" or paymentStatus is null and not (status ="Cancelled")
union
 SELECT sum(paid) as amount, "Total Amount Paid" as status
 FROM incomingorders
 union
 SELECT avg(paid) as averageAmount, "Average Amount Paid per Order" as status
FROM incomingorders;

/* Quantiy Summary*/
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
) as sumQuantity;



/* Top parent products supply ordered */
select pp.productName,pp.category,pp.subCategory,first.sumq as quantityOrdered
,pp.productImage, sold.totalSold as quantitySold
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
left join (
select pp.idParentProduct,sum(quantity) totalSold
from order_details ordd
left join orders ords
on ordd.idOrders=ords.idOrders
left join variantproduct vp
on vp.sku - ordd.sku
left join parentproduct pp
on vp.idParentProduct = pp.idParentProduct
where ords.paymentStatus="Completely Paid"
group by pp.idParentProduct) as sold
on sold.idParentProduct = first.idParentProduct
where pp.productName is not null or pp.category is not null or pp.subCategory is not null
order by first.sumq desc;
        
			
/*Top variant Product supply ordered */
select pp.productName, vp.colour, vp.size,first.sumq as quantityOrdered,pp.category,pp.subCategory,vp.productImage,
ifNull(vp.accumulation,ifnull(vp.quantityInStock,0))-ifnull(vp.quantityInStock,0) as quantitySold
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
where pp.productName is not null or pp.category is not null or pp.subCategory is not null
or vp.colour is not null or vp.size
order by quantityOrdered desc
;

/*Customers*/
/* Number of Customers*/
select count(*)
from customers ;

/* customer id and week*/
select week(ords.orderDate) wk, customerId
from orders ords
order by wk;

/* Average  customer payment per period*/
select first.wk period ,ifnull(avg(sumA),0) as amount
from 
(
select week(payDate) wk,customerId, sum(totalPriceSold+ifnull(deliveryPrice,0)-ifnull(reduction,0)) sumA
from orders 
where payDate is not null
group by wk,customerId
) as first
group by first.wk
order by first.wk;

/*Average  number of products ordered per customer per period*/
select first.wk period, ifnull(avg(sumq),0) amount
from 
(
select week(ords.orderDate) wk,ords.customerId, sum(ordd.quantity) sumQ
from order_details ordd
left join orders ords
on ords.idOrders = ordd.idOrders
group by wk,customerId
) as first
group by first.wk;

/*Average number of orders per customer per period*/
select first.wk period, ifnull(avg(countOrders),0) amount
from 
(
select week(ords.orderDate) wk,ords.customerId, count(ords.customerId) countOrders
from orders ords
group by wk,ords.customerId
) as first
group by first.wk;

/*Expense Summary*/
/* Quantity Summary*/
select count(paymentStatus) as count, IFNULL(paymentStatus,"Not Paid") as status
from expenses
group by paymentStatus;


/* Amount Summary*/
select ifnull(sum(amount-ifnull(paid,0)),0) amount, "Outstanding Payments" as status
from expenses
where paymentStatus in ("Partially Paid", null)
union
 SELECT sum(paid) as amount, "Total Amount Paid" as status
 FROM expenses
 union
  SELECT avg(paid) as averageAmount, "Average Amount Paid per Expense" as status
FROM expenses;

select category,subCategory,format(sum(paid),2) amount
from expenses
group by category,subCategory;

/*Revenue*/
select week(payDate) as period, ifnull(sum(paid),0) amount, "Dong" as currency
from orders
group by period
having period is not null;

/*Expense*/
select week(payDate) as period, ifnull(sum(amount),0) amount, "AUD" as currency
from expenses
group by period
having period is not null;

/*Delivery Expenses*/
select week(payDate) as period, ifnull(sum(deliveryPrice),0) amount , "Dong" as currency
from orders
group by period
having period is not null;

/*Supply Expenses*/
select week(payDate) as period, ifnull(sum(paid),0) amount, "Dong" as currency
from incomingorders
group by period;

/*Category Expense*/
select week(payDate) as period, count(category), category,  ifnull(sum(paid),0)  amount, "AUD" as currency
from expenses
group by period,category;


/* Revenue and delivery Price by City*/
select week(ords.payDate) period, if(cust.city="Ho Chi Minh",true,false) as HoChiMinh, sum(ords.paid) revenue, sum(ords.deliveryPrice) deliveryPrice
from orders ords
left join customers cust
on cust.customerId=ords.customerId
where ords.paid is not null
group by period, HoChiMinh;

/* Revenue by parentProduct*/
select analysis.*, pp.category,pp.subCategory,pp.productImage
from
(
select first.idParentProduct,first.productName, second.HoChiMinh,avg(second.netProfit-ifnull(first.wholeSalePrice,0)) avgNetProfit, 
sum(second.netProfit-ifnull(first.wholeSalePrice,0)) totalNetProfit, count(second.quantity) quantitySold
from 
(select ordd.idOrders,pp.idParentProduct,pp.productName,pp.wholeSalePrice
from order_details ordd
left join orders ords
on ords.idOrders=ordd.idOrders
left join variantproduct vp
on ordd.sku=vp.sku
left join parentproduct pp
on vp.idParentProduct=pp.idParentProduct
where ords.status="Delivered") as first
left join
(
select ordd.idOrders,sum(ordd.quantity) quantity,
(ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/sum(ordd.quantity) as netProfit,
if(cust.city="Ho Chi Minh",true,false) as HoChiMinh
from order_details ordd
left join orders ords
on ords.idOrders=ordd.idOrders
left join variantproduct vp
on ordd.sku=vp.sku
left join parentproduct pp
on vp.idParentProduct=pp.idParentProduct
left join customers cust
on cust.customerId=ords.customerId
where ords.status ="Delivered"
group by ordd.idOrders,HoChiMinh
having netProfit is not null
) as second
on first.idOrders = second.idOrders
group by first.idParentProduct , first.productName,second.HoChiMinh
having avgNetProfit is not null
) as analysis
left join parentproduct pp
on pp.idParentProduct=analysis.idParentProduct;

/*Financial Analysis of Ho chi minh by period*/
select analysis.*
from
(
select first.period, second.HoChiMinh,
sum(ifnull(first.wholeSalePrice,0))/count(second.quantity) wholeSalePrice,
(sum(second.netProfit) -sum(ifnull(first.wholeSalePrice,0))/count(second.quantity))/count(second.quantity) avgNetProfit,
sum(second.netProfit) -sum(ifnull(first.wholeSalePrice,0))/count(second.quantity) totalNetProfit,
 count(second.quantity) quantitySold, avg(second.revenue) avgRevenue,
sum(second.revenue) totalRevenue,avg(second.deliveryPrice) avgDelivery,sum(second.deliveryPrice) totalDelivery
from 
(select week(ords.payDate) period,ordd.idOrders,pp.idParentProduct,pp.productName,pp.wholeSalePrice
from order_details ordd
left join orders ords
on ords.idOrders=ordd.idOrders
left join variantproduct vp
on ordd.sku=vp.sku
left join parentproduct pp
on vp.idParentProduct=pp.idParentProduct
where ords.status="Delivered") as first
left join
(
select week(ords.payDate) period, ordd.idOrders,sum(ordd.quantity) quantity,
(ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/sum(ordQ.quantityInOrder) as netProfit,
ifnull(ords.paid,0)/sum(ordQ.quantityInOrder) as revenue,
ifnull(ords.deliveryPrice,0)/sum(ordQ.quantityInOrder) as deliveryPrice,
if(cust.city="Ho Chi Minh",true,false) as HoChiMinh
from order_details ordd
left join orders ords
on ords.idOrders=ordd.idOrders
left join variantproduct vp
on ordd.sku=vp.sku
left join parentproduct pp
on vp.idParentProduct=pp.idParentProduct
left join customers cust
on cust.customerId=ords.customerId
left join (
select idOrders,sum(quantity) quantityInOrder
from order_details ordd
group by idOrders
having sum(quantity) is not null)  as ordQ
on ordQ.idOrders =ordd.idOrders
where ords.status ="Delivered"
group by period,ordd.idOrders,HoChiMinh
having netProfit is not null
) as second
on first.idOrders = second.idOrders
group by first.period, second.HoChiMinh
having avgNetProfit is not null
) as analysis;

/*Financial Analyis of category and subCategory by period*/
select analysis.*
from
(
select first.period, second.category, second.subCategory,avg(second.netProfit-ifnull(first.wholeSalePrice,0)) avgNetProfit, 
sum(second.netProfit-ifnull(first.wholeSalePrice,0)) totalNetProfit, count(second.quantity) quantitySold, avg(second.revenue) avgRevenue,
sum(second.revenue) totalRevenue,avg(second.deliveryPrice) avgDelivery,sum(second.deliveryPrice) totalDelivery
from 
(select week(ords.payDate) period,ordd.idOrders,pp.idParentProduct,pp.productName,pp.wholeSalePrice
from order_details ordd
left join orders ords
on ords.idOrders=ordd.idOrders
left join variantproduct vp
on ordd.sku=vp.sku
left join parentproduct pp
on vp.idParentProduct=pp.idParentProduct
where ords.status="Delivered") as first
left join
(
select week(ords.payDate) period, ordd.idOrders,sum(ordd.quantity) quantity,
(ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/ordQ.quantityInOrder as netProfit,
ifnull(ords.paid,0)/ordQ.quantityInOrder as revenue,
ifnull(ords.deliveryPrice,0)/ordQ.quantityInOrder as deliveryPrice,
pp.category,pp.subCategory
from order_details ordd
left join orders ords
on ords.idOrders=ordd.idOrders
left join variantproduct vp
on ordd.sku=vp.sku
left join parentproduct pp
on vp.idParentProduct=pp.idParentProduct
left join customers cust
on cust.customerId=ords.customerId
left join (
select idOrders,sum(quantity) quantityInOrder
from order_details ordd
group by idOrders
having sum(quantity) is not null)  as ordQ
on ordQ.idOrders =ordd.idOrders
where ords.status ="Delivered"
group by period,ordd.idOrders,category,subCategory
having netProfit is not null
) as second
on first.idOrders = second.idOrders
group by first.period, second.category,second.subCategory
having avgNetProfit is not null
) as analysis;
