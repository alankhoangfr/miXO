const express = require("express")
const router = express.Router()
const pool = require("../../dbpool")
const moment = require("moment")
const auth = require('../../middleware/auth')


router.get('/amountSummary', auth,(req, res) => {
    let sql = `
		select ifnull(sum(amount-ifnull(paid,0)),0) amount, "Outstanding Payments" as status
		from expenses
		where paymentStatus in ("Partially Paid", null)
		union
		SELECT sum(paid) as amount, "Total Amount Paid" as status
		FROM expenses
		union
		SELECT avg(paid) as averageAmount, "Average Amount Paid per Expense" as status
		FROM expenses;`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});    


router.get('/quantitySummary', auth,(req, res) => {
    let sql = `
        select count(paymentStatus) as count, IFNULL(paymentStatus,"Not Paid") as status
		from expenses
		group by paymentStatus;
        ;
    `;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});    

router.get('/delamountSummary', auth,(req, res) => {
    let sql = `
        select sum(deliveryPrice) amount, "Delivery Total"  as status
        from orders
        union
        select avg(deliveryPrice) amount, "Average Delivery" as status
        from orders;`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});    


router.get('/delquantitySummary', auth,(req, res) => {
    let sql = `
        select deliveryPrice as status, count(*) as count 
        from orders
        group by deliveryPrice;
        ;
    `;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});  

router.get('/supamountSummary', auth,(req, res) => {
    let sql = `
        select ifnull(sum(totalAmount-ifnull(supplierDiscount,0)),0) amount, "Amount of Outstanding Payments" as status
        from incomingorders
        where not (status ="Cancelled") and paymentStatus = "Partially Paid" or paymentStatus is null and not (status ="Cancelled")
        union
         SELECT sum(paid) as amount, "Total Amount Paid" as status
         FROM incomingorders
         union
         SELECT avg(paid) as averageAmount, "Average Amount Paid per Order" as status
        FROM incomingorders;
        `;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});    


router.get('/supquantitySummary', auth,(req, res) => {
    let sql = `
        select count(*) count,"Number of Outstanding Payments" as status
        from incomingorders
        where not (status ="Cancelled") and paymentStatus = "Partially Paid" or paymentStatus is null and not (status ="Cancelled");
    `;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});  
router.get('/revamountSummary', auth,(req, res) => {
    let sql = `
        select sum(IFNULL(totalPriceSold,0)-IFNULL(reduction,0)+IFNULL(deliveryPrice,0)-IFNULL(paid,0)) as amount,
        IFNULL(paymentStatus,"Not Paid") as status
        from orders
        where not paymentStatus = "Completely Paid" or paymentStatus is null
        group by paymentStatus
        union
        select sum(paid) as amount,paymentStatus as status
        from orders
        where paymentStatus="Completely Paid"
        group by paymentStatus
        union
        select avg(paid) as amount,"Average Payment" as status
        from orders
        where paymentStatus="Completely Paid"
        group by paymentStatus;`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});    


router.get('/revquantitySummary', auth,(req, res) => {
    let sql = `
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
        from order_details 
        ;
    `;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});    
router.get('/category', auth,(req, res) => {
    let sql = `
		select category,subCategory,format(sum(paid),2) amount
		from expenses
		group by category,subCategory;
    `;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});  	


router.get(`/summaryFinancial`,auth,(req,res)=>{
    let sql = `
        select analysis.*, pp.category,pp.subCategory,pp.productImage
        from
        (
            select first.idParentProduct,first.productName, second.city,avg(second.netProfit-ifnull(first.wholeSalePrice,0)) avgNetProfit, 
            sum(second.netProfit-ifnull(first.wholeSalePrice,0)) totalNetProfit, count(second.quantity) quantitySold, avg(second.revenue) avgRevenue,
            sum(second.revenue) totalRevenue,avg(second.deliveryPrice) avgDelivery,sum(second.deliveryPrice) totalDelivery
            from 
            (
                select ordd.idOrders,pp.idParentProduct,pp.productName,pp.wholeSalePrice
                from order_details ordd
                left join orders ords
                on ords.idOrders=ordd.idOrders
                left join variantproduct vp
                on ordd.sku=vp.sku
                left join parentproduct pp
                on vp.idParentProduct=pp.idParentProduct
                where ords.status="Delivered"
            ) as first
            left join
            (
                select ordd.idOrders,sum(ordd.quantity) quantity,
                (ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/sum(ordd.quantity) as netProfit,
                ifnull(ords.paid,0)/sum(ordd.quantity) as revenue,
                ifnull(ords.deliveryPrice,0)/sum(ordd.quantity) as deliveryPrice,
                cust.city as city
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
                group by ordd.idOrders,city
                having netProfit is not null
             ) as second
            on first.idOrders = second.idOrders
            group by first.idParentProduct , first.productName,second.city
            having avgNetProfit is not null
        ) as analysis
        left join parentproduct pp
        on pp.idParentProduct=analysis.idParentProduct;
    `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
})


//Weekly
router.get('/revenue/wk', auth,(req, res) => {
    let wkFirst = moment().format("WW")-10
    let sql = `
        select week(payDate) as period, ifnull(sum(paid),0) amount, "Dong" as currency
        from orders
        group by period
        having period>${wkFirst} && period is not null
        order by period
        `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n
        var dates=[]
            results.map(each=>{
                if(dates.indexOf(each.period)<0&&each.period!==null){
                    dates.push(each.period)
                }
            })  
        dates.length<5?n=5:n=dates.length
        var dateRange=[]
        while (n>=0){
            var week = moment().format("WW")-n
            var info = results.filter(info=>info.period===week)
            if(info.length>=1){
                info.forEach(each=>dateRange.push({period:week,amount:info[0].amount,currency:info[0].currency}))
            }else if (info.length===0){
                dateRange.push({period:week,amount:0,currency:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});    

router.get('/expenses/wk', auth,(req, res) => {
    let wkFirst = moment().format("WW")-10
    let sql = `
        select week(payDate) as period, count(category), category,  ifnull(sum(paid),0)  amount, "AUD" as currency
        from expenses
        group by period,category
        having period>${wkFirst} && period is not null
        order by period;
        `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n
        var dates=[]
            results.map(each=>{
                if(dates.indexOf(each.period)<0&&each.period!==null){
                    dates.push(each.period)
                }
            })   
        dates.length<5?n=5:n=dates.length
        var dateRange=[]
        while (n>=0){
            var week = moment().format("WW")-n
            var info = results.filter(info=>info.period===week)
            if(info.length>=1){
                info.forEach(each=>dateRange.push({period:week,amount:info[0].amount,currency:info[0].currency,category:info[0].category}))
            }else if (info.length===0){
                dateRange.push({period:week,amount:0,currency:null,category:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});    

router.get('/delivery/wk', auth,(req, res) => {
    let wkFirst = moment().format("WW")-10
    let sql = `
        select week(payDate) as period, ifnull(sum(deliveryPrice),0) amount , "Dong" as currency
        from orders
        group by period
        having period>${wkFirst} && period is not null
        order by period;
    `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n
        var dates=[]
            results.map(each=>{
                if(dates.indexOf(each.period)<0&&each.period!==null){
                    dates.push(each.period)
                }
            })   
        dates.length<5?n=5:n=dates.length
        var dateRange=[]
        while (n>=0){
            var week = moment().format("WW")-n
            var info = results.filter(info=>info.period===week)
            if(info.length>=1){
                info.forEach(each=>dateRange.push({period:week,amount:info[0].amount,currency:info[0].currency}))
            }else if (info.length===0){
                dateRange.push({period:week,amount:0,currency:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});  

router.get('/supply/wk', auth,(req, res) => {
    let wkFirst = moment().format("WW")-10
    let sql = `
        select week(payDate) as period, ifnull(sum(paid),0) amount, "Dong" as currency
        from incomingorders
        group by period
        having period>${wkFirst} && period is not null
        order by period;
    `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n
        var dates=[]
            results.map(each=>{
                if(dates.indexOf(each.period)<0&&each.period!==null){
                    dates.push(each.period)
                }
            })   
        dates.length<5?n=5:n=dates.length
        var dateRange=[]
        while (n>=0){
            var week = moment().format("WW")-n
            var info = results.filter(info=>info.period===week)
            if(info.length>=1){
                info.forEach(each=>dateRange.push({period:week,amount:info[0].amount,currency:info[0].currency}))
            }else if (info.length===0){
                dateRange.push({period:week,amount:0,currency:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});  

router.get('/category/wk', auth,(req, res) => {
    let wkFirst = moment().format("WW")-6
    let sql = `
        select analysis.*
        from
        (
        select first.period as period, second.category, second.subCategory,avg(second.netProfit-ifnull(first.wholeSalePrice,0)) avgNetProfit, 
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
        ) as analysis
        having period>${wkFirst}
        order by period;
            `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n=5
        var dateRange=[...results]
        while (n>=0){
            var week = moment().format("WW")-n
            var info = results.filter(info=>info.period===week)
            if (info.length===0){
                dateRange.push({period:week, category:null, subCategory:null, avgNetProfit:null, totalNetProfit:null,
                    quantitySold:null, avgRevenue:null, totalRevenue:null, avgDelivery:null, totalDelivery:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
})
router.get('/city/wk', auth,(req, res) => {
    let wkFirst = moment().format("WW")-6
    let sql = `
        select analysis.*
        from
        (
        select first.period as period, second.city,
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
        cust.city 
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
        group by period,ordd.idOrders,city
        having netProfit is not null
        ) as second
        on first.idOrders = second.idOrders
        group by first.period, second.city
        having avgNetProfit is not null
        ) as analysis
        having period>${wkFirst}
        order by period;
            `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n=5
        var dateRange=[...results]
        while (n>=0){
            var week = moment().format("WW")-n
            var info = results.filter(info=>info.period===week)
            if (info.length===0){
                dateRange.push({period:week, city:null, avgNetProfit:null, totalNetProfit:null,
                    quantitySold:null, avgRevenue:null, totalRevenue:null, avgDelivery:null, totalDelivery:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
})

//Monthly
router.get('/revenue/mth', auth,(req, res) => {
    const mth = moment().subtract(24,'months').format('MM')
    const yr = moment().subtract(24,'months').format('YYYY')
    const mthFirst=`${String(yr)}${String(mth)}`      
    let sql = `
        select concat(month(payDate),year(payDate)) period, ifnull(sum(paid),0) amount, "Dong" as currency
        from orders
        group by period
        having concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )>${`"${mthFirst}"`}
         && period is not null
        order by period
        `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n
        var dates=[]
        results.map(each=>{
            if(dates.indexOf(`${String(each.period).slice(0,each.period.length-4)}-${String(each.period).slice(each.period.length-4,each.period.length)}`)
                <0&&each.period!==null){
                dates.push(`${String(each.period).slice(0,each.period.length-4)}-${String(each.period).slice(each.period.length-4,each.period.length)}`)
            }
        }) 
        dates.length<5?n=5:n=dates.length
        var dateRange=[]
        while (n>=0){
            var month = moment().subtract(n,'month').format('MM-YYYY')
            var info = results.filter(info=>
                `${String(info.period).slice(0,info.period.length-4)}-${String(info.period).slice(info.period.length-4,info.period.length)}`===month)
            if(info.length>=1){
                info.forEach(each=>dateRange.push({period:month,amount:info[0].amount,currency:info[0].currency}))
            }else if (info.length===0){
                dateRange.push({period:month,amount:0,currency:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});    

router.get('/expenses/mth', auth,(req, res) => {
    const mth = moment().subtract(24,'months').format('MM')
    const yr = moment().subtract(24,'months').format('YYYY')
    const mthFirst=`${String(yr)}${String(mth)}`     
    let sql = `
        select concat(month(payDate),year(payDate)) period, count(category), category,  ifnull(sum(paid),0)  amount, "AUD" as currency
        from expenses
        group by period,category
        having concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )>${`"${mthFirst}"`}
        order by period;
        `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n
        var dates=[]
        results.map(each=>{
            if(dates.indexOf(`${String(each.period).slice(0,each.period.length-4)}-${String(each.period).slice(each.period.length-4,each.period.length)}`)
                <0&&each.period!==null){
                dates.push(`${String(each.period).slice(0,each.period.length-4)}-${String(each.period).slice(each.period.length-4,each.period.length)}`)
            }
        })  
        dates.length<5?n=5:n=dates.length
        var dateRange=[]
        while (n>=0){
            var month = moment().subtract(n,'month').format('MM-YYYY')
            var info = results.filter(info=>
                `${String(info.period).slice(0,info.period.length-4)}-${String(info.period).slice(info.period.length-4,info.period.length)}`===month)
            if(info.length>=1){
                info.forEach(each=>dateRange.push({period:month,amount:info[0].amount,currency:info[0].currency,category:info[0].category}))
            }else if (info.length===0){
                dateRange.push({period:month,amount:0,currency:null,category:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});    

router.get('/delivery/mth', auth,(req, res) => {
    const mth = moment().subtract(24,'months').format('MM')
    const yr = moment().subtract(24,'months').format('YYYY')
    const mthFirst=`${String(yr)}${String(mth)}`   
    let sql = `
            select concat(month(payDate),year(payDate)) period, ifnull(sum(deliveryPrice),0) amount , "Dong" as currency
        from orders
        group by period
        having concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )>${`"${mthFirst}"`}
        order by period;
    `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n
        var dates=[]
        results.map(each=>{
            if(dates.indexOf(`${String(each.period).slice(0,each.period.length-4)}-${String(each.period).slice(each.period.length-4,each.period.length)}`)
                <0&&each.period!==null){
                dates.push(`${String(each.period).slice(0,each.period.length-4)}-${String(each.period).slice(each.period.length-4,each.period.length)}`)
            }
        })  
        dates.length<5?n=5:n=dates.length
        var dateRange=[]
        while (n>=0){
            var month = moment().subtract(n,'month').format('MM-YYYY')
            var info = results.filter(info=>
                `${String(info.period).slice(0,info.period.length-4)}-${String(info.period).slice(info.period.length-4,info.period.length)}`===month)
            if(info.length>=1){
                info.forEach(each=>dateRange.push({period:month,amount:info[0].amount,currency:info[0].currency}))
            }else if (info.length===0){
                dateRange.push({period:month,amount:0,currency:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});  

router.get('/supply/mth', auth,(req, res) => {
    const mth = moment().subtract(24,'months').format('MM')
    const yr = moment().subtract(24,'months').format('YYYY')
    const mthFirst=`${String(yr)}${String(mth)}`    
    let sql = `
        select concat(month(payDate),year(payDate)) period, ifnull(sum(paid),0) amount, "Dong" as currency
        from incomingorders
        group by period
        having concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )>${`"${mthFirst}"`}
        order by period;
    `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n
        var dates=[]
        results.map(each=>{
            if(dates.indexOf(`${String(each.period).slice(0,each.period.length-4)}-${String(each.period).slice(each.period.length-4,each.period.length)}`)
                <0&&each.period!==null){
                dates.push(`${String(each.period).slice(0,each.period.length-4)}-${String(each.period).slice(each.period.length-4,each.period.length)}`)
            }
        }) 
        dates.length<5?n=5:n=dates.length
        var dateRange=[]
        while (n>=0){
            var month = moment().subtract(n,'month').format('MM-YYYY')
            var info = results.filter(info=>
                `${String(info.period).slice(0,info.period.length-4)}-${String(info.period).slice(info.period.length-4,info.period.length)}`===month)
            if(info.length>=1){
                info.forEach(each=>dateRange.push({period:month,amount:info[0].amount,currency:info[0].currency}))
            }else if (info.length===0){
                dateRange.push({period:month,amount:0,currency:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});  
router.get('/category/mth', auth,(req, res) => {   
    const mth = moment().subtract(7,'months').format('MM')
    const yr = moment().subtract(7,'months').format('YYYY')
    const mthFirst=`${String(yr)}${String(mth)}`  
    let sql = `
        select analysis.*
        from
        (
        select first.period as period, second.category, second.subCategory,avg(second.netProfit-ifnull(first.wholeSalePrice,0)) avgNetProfit, 
        sum(second.netProfit-ifnull(first.wholeSalePrice,0)) totalNetProfit, count(second.quantity) quantitySold, avg(second.revenue) avgRevenue,
        sum(second.revenue) totalRevenue,avg(second.deliveryPrice) avgDelivery,sum(second.deliveryPrice) totalDelivery
        from 
        (select concat(month(payDate),year(payDate)) period,ordd.idOrders,pp.idParentProduct,pp.productName,pp.wholeSalePrice
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
       select concat(month(payDate),year(payDate)) period, ordd.idOrders,sum(ordd.quantity) quantity,
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
        ) as analysis
        having concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )> ${`"${mthFirst}"`}
        order by concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) );
            `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n=6
        var dateRange=[...results]
        while (n>=0){
            var month = moment().subtract(n,'month').format('MM-YYYY')
            var info = results.filter(info=>
                `${String(info.period).slice(0,info.period.length-4)}-${String(info.period).slice(info.period.length-4,info.period.length)}`===month)
            if (info.length===0){
                const monthString = `${String(month).slice(0,String(month).length-4-1)}${String(month).slice(String(month).length-4,String(month).length)}`
                dateRange.push({period:monthString, category:null, subCategory:null, avgNetProfit:null, totalNetProfit:null,
                    quantitySold:null, avgRevenue:null, totalRevenue:null, avgDelivery:null, totalDelivery:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});  
router.get('/city/mth', auth,(req, res) => {   
    const mth = moment().subtract(7,'months').format('MM')
    const yr = moment().subtract(7,'months').format('YYYY')
    const mthFirst=`${String(yr)}${String(mth)}`  
    let sql = `
        select analysis.*
        from
        (
        select first.period as period, second.city,
        sum(ifnull(first.wholeSalePrice,0))/count(second.quantity) wholeSalePrice,
        (sum(second.netProfit) -sum(ifnull(first.wholeSalePrice,0))/count(second.quantity))/count(second.quantity) avgNetProfit,
        sum(second.netProfit) -sum(ifnull(first.wholeSalePrice,0))/count(second.quantity) totalNetProfit,
         count(second.quantity) quantitySold, avg(second.revenue) avgRevenue,
        sum(second.revenue) totalRevenue,avg(second.deliveryPrice) avgDelivery,sum(second.deliveryPrice) totalDelivery
        from 
        (select concat(month(ords.payDate),year(ords.payDate)) period,ordd.idOrders,pp.idParentProduct,pp.productName,pp.wholeSalePrice
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
        select concat(month(ords.payDate),year(ords.payDate)) period, ordd.idOrders,sum(ordd.quantity) quantity,
        (ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/sum(ordQ.quantityInOrder) as netProfit,
        ifnull(ords.paid,0)/sum(ordQ.quantityInOrder) as revenue,
        ifnull(ords.deliveryPrice,0)/sum(ordQ.quantityInOrder) as deliveryPrice,
        cust.city 
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
        group by period,ordd.idOrders,city
        having netProfit is not null
        ) as second
        on first.idOrders = second.idOrders
        group by first.period, second.city
        having avgNetProfit is not null
        ) as analysis
        having concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )> ${`"${mthFirst}"`}
        order by concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) );
            `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n=6
        var dateRange=[...results]
        while (n>=0){
            var month = moment().subtract(n,'month').format('MM-YYYY')
            var info = results.filter(info=>
                `${String(info.period).slice(0,info.period.length-4)}-${String(info.period).slice(info.period.length-4,info.period.length)}`===month)
            if (info.length===0){
                const monthString = `${String(month).slice(0,String(month).length-4-1)}${String(month).slice(String(month).length-4,String(month).length)}`
                dateRange.push({period:monthString, city:null, avgNetProfit:null, totalNetProfit:null,
                    quantitySold:null, avgRevenue:null, totalRevenue:null, avgDelivery:null, totalDelivery:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
}); 
//Quarterly
router.get('/revenue/qrt', auth,(req, res) => {
    const qrt = moment().subtract(8,'quarters').format('Q')
    const yr = moment().subtract(8,'quarters').format('YYYY')
    const qrtFirst=`${String(yr)}${String(qrt)}`      
    let sql = `
        select concat(QUARTER(payDate),year(payDate)) period, ifnull(sum(paid),0) amount, "Dong" as currency
        from orders
        group by period
        having concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )>${`"${qrtFirst}"`}
         && period is not null
        order by period
        `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n
        var dates=[]
        results.map(each=>{
            if(dates.indexOf(`${String(each.period).slice(0,each.period.length-4)}-${String(each.period).slice(each.period.length-4,each.period.length)}`)
                <0&&each.period!==null){
                dates.push(`${String(each.period).slice(0,each.period.length-4)}-${String(each.period).slice(each.period.length-4,each.period.length)}`)
            }
        }) 
        dates.length<5?n=5:n=dates.length
        var dateRange=[...results]
        while (n>=0){
            var quarter = moment().subtract(n,'quarters').format('Q-YYYY')
            var info = results.filter(info=>
                `${String(info.period).slice(0,info.period.length-4)}-${String(info.period).slice(info.period.length-4,info.period.length)}`===quarter)
            if(info.length>=1){
                info.forEach(each=>dateRange.push({period:quarter,amount:info[0].amount,currency:info[0].currency}))
            }else if (info.length===0){
                dateRange.push({period:quarter,amount:0,currency:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});    

router.get('/expenses/qrt', auth,(req, res) => {
    const qrt = moment().subtract(8,'quarters').format('Q')
    const yr = moment().subtract(8,'quarters').format('YYYY')
    const qrtFirst=`${String(yr)}${String(qrt)}`     
    let sql = `
        select concat(QUARTER(payDate),year(payDate)) period, count(category), category,  ifnull(sum(paid),0)  amount, "AUD" as currency
        from expenses
        group by period,category
        having concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )>${`"${qrtFirst}"`}
        order by period;
        `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n
        var dates=[]
        results.map(each=>{
            if(dates.indexOf(`${String(each.period).slice(0,each.period.length-4)}-${String(each.period).slice(each.period.length-4,each.period.length)}`)
                <0&&each.period!==null){
                dates.push(`${String(each.period).slice(0,each.period.length-4)}-${String(each.period).slice(each.period.length-4,each.period.length)}`)
            }
        }) 
        dates.length<5?n=5:n=dates.length
        var dateRange=[]
        while (n>=0){
            var quarter = moment().subtract(n,'quarters').format('Q-YYYY')
            var info = results.filter(info=>
                `${String(info.period).slice(0,info.period.length-4)}-${String(info.period).slice(info.period.length-4,info.period.length)}`===quarter)
            if(info.length>=1){
                info.forEach(each=>dateRange.push({period:quarter,amount:info[0].amount,currency:info[0].currency,category:info[0].category}))
            }else if (info.length===0){
                dateRange.push({period:quarter,amount:0,currency:null,category:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});    

router.get('/delivery/qrt', auth,(req, res) => {
    const qrt = moment().subtract(8,'quarters').format('Q')
    const yr = moment().subtract(8,'quarters').format('YYYY')
    const qrtFirst=`${String(yr)}${String(qrt)}`   
    let sql = `
            select concat(QUARTER(payDate),year(payDate)) period, ifnull(sum(deliveryPrice),0) amount , "Dong" as currency
        from orders
        group by period
        having concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )>${`"${qrtFirst}"`}
        order by period;
    `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n
        var dates=[]
        results.map(each=>{
            if(dates.indexOf(`${String(each.period).slice(0,each.period.length-4)}-${String(each.period).slice(each.period.length-4,each.period.length)}`)
                <0&&each.period!==null){
                dates.push(`${String(each.period).slice(0,each.period.length-4)}-${String(each.period).slice(each.period.length-4,each.period.length)}`)
            }
        })  
        dates.length<5?n=5:n=dates.length
        var dateRange=[]
        while (n>=0){
            var quarter = moment().subtract(n,'quarters').format('Q-YYYY')
            var info = results.filter(info=>
                `${String(info.period).slice(0,info.period.length-4)}-${String(info.period).slice(info.period.length-4,info.period.length)}`===quarter)
            if(info.length>=1){
                info.forEach(each=>dateRange.push({period:quarter,amount:info[0].amount,currency:info[0].currency}))
            }else if (info.length===0){
                dateRange.push({period:quarter,amount:0,currency:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});  

router.get('/supply/qrt', auth,(req, res) => {
    const qrt = moment().subtract(8,'quarters').format('Q')
    const yr = moment().subtract(8,'quarters').format('YYYY')
    const qrtFirst=`${String(yr)}${String(qrt)}`    
    let sql = `
        select concat(QUARTER(payDate),year(payDate)) period, ifnull(sum(paid),0) amount, "Dong" as currency
        from incomingorders
        group by period
       having concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )>${`"${qrtFirst}"`}
        order by period;
    `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n
        var dates=[]
        results.map(each=>{
            if(dates.indexOf(`${String(each.period).slice(0,each.period.length-4)}-${String(each.period).slice(each.period.length-4,each.period.length)}`)
                <0&&each.period!==null){
                dates.push(`${String(each.period).slice(0,each.period.length-4)}-${String(each.period).slice(each.period.length-4,each.period.length)}`)
            }
        }) 
        dates.length<5?n=5:n=dates.length
        var dateRange=[]
        while (n>=0){
            var quarter = moment().subtract(n,'quarters').format('Q-YYYY')
            var info = results.filter(info=>
                `${String(info.period).slice(0,info.period.length-4)}-${String(info.period).slice(info.period.length-4,info.period.length)}`===quarter)
            if(info.length>=1){
                info.forEach(each=>dateRange.push({period:quarter,amount:info[0].amount,currency:info[0].currency}))
            }else if (info.length===0){
                dateRange.push({period:quarter,amount:0,currency:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
}); 
router.get('/category/qrt', auth,(req, res) => { 
    const qrt = moment().subtract(7,'quarters').format('Q')
    const yr = moment().subtract(7,'quarters').format('YYYY')
    const qrtFirst=`${String(yr)}${String(qrt)}`  
    let sql = `
        select analysis.*
        from
        (
        select first.period as period, second.category, second.subCategory,avg(second.netProfit-ifnull(first.wholeSalePrice,0)) avgNetProfit, 
        sum(second.netProfit-ifnull(first.wholeSalePrice,0)) totalNetProfit, count(second.quantity) quantitySold, avg(second.revenue) avgRevenue,
        sum(second.revenue) totalRevenue,avg(second.deliveryPrice) avgDelivery,sum(second.deliveryPrice) totalDelivery
        from 
        (select concat(QUARTER(payDate),year(payDate)) period,ordd.idOrders,pp.idParentProduct,pp.productName,pp.wholeSalePrice
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
       select concat(QUARTER(payDate),year(payDate)) period, ordd.idOrders,sum(ordd.quantity) quantity,
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
        ) as analysis
        having concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )> ${`"${qrtFirst}"`}
        order by  concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )
            `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n=6
        var dateRange=[...results]
        while (n>=0){
            var quarter = moment().subtract(n,'quarters').format('Q-YYYY')
            var info = results.filter(info=>
                `${String(info.period).slice(0,info.period.length-4)}-${String(info.period).slice(info.period.length-4,info.period.length)}`===quarter)
            if (info.length===0){
                const quarterString = `${String(quarter).slice(0,String(quarter).length-4-1)}${String(quarter).slice(String(quarter).length-4,String(quarter).length)}`
                dateRange.push({period:quarterString, category:null, subCategory:null, avgNetProfit:null, totalNetProfit:null,
                    quantitySold:null, avgRevenue:null, totalRevenue:null, avgDelivery:null, totalDelivery:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)

            }
        }        
    });
});

router.get('/city/qrt', auth,(req, res) => { 
    const qrt = moment().subtract(7,'quarters').format('Q')
    const yr = moment().subtract(7,'quarters').format('YYYY')
    const qrtFirst=`${String(yr)}${String(qrt)}`  
    let sql = `
        select analysis.*
        from
        (
        select first.period as period, second.city,
        sum(ifnull(first.wholeSalePrice,0))/count(second.quantity) wholeSalePrice,
        (sum(second.netProfit) -sum(ifnull(first.wholeSalePrice,0))/count(second.quantity))/count(second.quantity) avgNetProfit,
        sum(second.netProfit) -sum(ifnull(first.wholeSalePrice,0))/count(second.quantity) totalNetProfit,
         count(second.quantity) quantitySold, avg(second.revenue) avgRevenue,
        sum(second.revenue) totalRevenue,avg(second.deliveryPrice) avgDelivery,sum(second.deliveryPrice) totalDelivery
        from 
        (select concat(QUARTER(ords.payDate),year(ords.payDate)) period,ordd.idOrders,pp.idParentProduct,pp.productName,pp.wholeSalePrice
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
        select concat(QUARTER(ords.payDate),year(ords.payDate)) period, ordd.idOrders,sum(ordd.quantity) quantity,
        (ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/sum(ordQ.quantityInOrder) as netProfit,
        ifnull(ords.paid,0)/sum(ordQ.quantityInOrder) as revenue,
        ifnull(ords.deliveryPrice,0)/sum(ordQ.quantityInOrder) as deliveryPrice,
        cust.city 
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
        group by period,ordd.idOrders,city
        having netProfit is not null
        ) as second
        on first.idOrders = second.idOrders
        group by first.period, second.city
        having avgNetProfit is not null
        ) as analysis
        having concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )> ${`"${qrtFirst}"`}
        order by  concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )
            `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n=6
        var dateRange=[...results]
        while (n>=0){
            var quarter = moment().subtract(n,'quarters').format('Q-YYYY')
            var info = results.filter(info=>
                `${String(info.period).slice(0,info.period.length-4)}-${String(info.period).slice(info.period.length-4,info.period.length)}`===quarter)
            if (info.length===0){
                const quarterString = `${String(quarter).slice(0,String(quarter).length-4-1)}${String(quarter).slice(String(quarter).length-4,String(quarter).length)}`
                dateRange.push({period:quarterString, city:null,  avgNetProfit:null, totalNetProfit:null,
                    quantitySold:null, avgRevenue:null, totalRevenue:null, avgDelivery:null, totalDelivery:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)

            }
        }        
    });
});

//Yearly
router.get('/revenue/yr', auth,(req, res) => {
    let yrFirst = moment().format("YYYY")-5 
    let sql = `
        select year(payDate) period, ifnull(sum(paid),0) amount, "Dong" as currency
        from orders
        group by period
        having period>${yrFirst} && period is not null
        order by period
        `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n
        var dates=[]
            results.map(each=>{
                if(dates.indexOf(each.period)<0&&each.period!==null){
                    dates.push(each.period)
                }
            })   
        dates.length<5?n=5:n=dates.length
        var dateRange=[]
        while (n>=0){
            var year = moment().format("YYYY")-n
            var info = results.filter(info=>info.period===year)
            if(info.length>=1){
                info.forEach(each=>dateRange.push({period:year,amount:info[0].amount,currency:info[0].currency}))
            }else if (info.length===0){
                dateRange.push({period:year,amount:0,currency:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});    

router.get('/expenses/yr', auth,(req, res) => {
    let yrFirst = moment().format("YYYY")-5  
    let sql = `
        select year(payDate) period, count(category), category,  ifnull(sum(paid),0)  amount, "AUD" as currency
        from expenses
        group by period,category
        having period>${yrFirst} && period is not null
        order by period;
        `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n
        var dates=[]
            results.map(each=>{
                if(dates.indexOf(each.period)<0&&each.period!==null){
                    dates.push(each.period)
                }
            })   
        dates.length<5?n=5:n=dates.length
        var dateRange=[]
        while (n>=0){
            var year = moment().format("YYYY")-n
            var info = results.filter(info=>info.period===year)
            if(info.length>=1){
                info.forEach(each=>dateRange.push({period:year,amount:info[0].amount,currency:info[0].currency,category:info[0].category}))
            }else if (info.length===0){
                dateRange.push({period:year,amount:0,currency:null,category:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});    

router.get('/delivery/yr', auth,(req, res) => {
    let yrFirst = moment().format("YYYY")-5
    let sql = `
            select year(payDate) period, ifnull(sum(deliveryPrice),0) amount , "Dong" as currency
        from orders
        group by period
        having period>${yrFirst} && period is not null
        order by period;
    `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n
        var dates=[]
            results.map(each=>{
                if(dates.indexOf(each.period)<0&&each.period!==null){
                    dates.push(each.period)
                }
            })   
        dates.length<5?n=5:n=dates.length
        var dateRange=[]
        while (n>=0){
            var year = moment().format("YYYY")-n
            var info = results.filter(info=>info.period===year)
            if(info.length>=1){
                info.forEach(each=>dateRange.push({period:year,amount:info[0].amount,currency:info[0].currency}))
            }else if (info.length===0){
                dateRange.push({period:year,amount:0,currency:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});  

router.get('/supply/yr', auth,(req, res) => {
    let yrFirst = moment().format("YYYY")-5
    let sql = `
        select year(payDate) period, ifnull(sum(paid),0) amount, "Dong" as currency
        from incomingorders
        group by period
        having period>${yrFirst} && period is not null
        order by period;
    `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n
        var dates=[]
            results.map(each=>{
                if(dates.indexOf(each.period)<0&&each.period!==null){
                    dates.push(each.period)
                }
            })   
        dates.length<5?n=5:n=dates.length
        var dateRange=[]
        while (n>=0){
            var year = moment().format("YYYY")-n
            var info = results.filter(info=>info.period===year)
            if(info.length>=1){
                info.forEach(each=>dateRange.push({period:year,amount:info[0].amount,currency:info[0].currency}))
            }else if (info.length===0){
                dateRange.push({period:year,amount:0,currency:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});  

router.get('/category/yr', auth,(req, res) => {
    let yrFirst = moment().format("YYYY")-5
    let sql = `
        select analysis.*
        from
        (
        select first.period as period, second.category, second.subCategory,avg(second.netProfit-ifnull(first.wholeSalePrice,0)) avgNetProfit, 
        sum(second.netProfit-ifnull(first.wholeSalePrice,0)) totalNetProfit, count(second.quantity) quantitySold, avg(second.revenue) avgRevenue,
        sum(second.revenue) totalRevenue,avg(second.deliveryPrice) avgDelivery,sum(second.deliveryPrice) totalDelivery
        from 
        (select year(ords.payDate) period,ordd.idOrders,pp.idParentProduct,pp.productName,pp.wholeSalePrice
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
        select year(ords.payDate) period, ordd.idOrders,sum(ordd.quantity) quantity,
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
        ) as analysis
        having period> ${yrFirst}
        order by period;
            `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n=5
        var dateRange=[...results]
        while (n>=0){
            var year = moment().format("YYYY")-n
            var info = results.filter(info=>info.period===year)
            if (info.length===0){
                dateRange.push({period:year, category:null, subCategory:null, avgNetProfit:null, totalNetProfit:null,
                    quantitySold:null, avgRevenue:null, totalRevenue:null, avgDelivery:null, totalDelivery:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
})

router.get('/city/yr', auth,(req, res) => {
    let yrFirst = moment().format("YYYY")-5
    let sql = `
        select analysis.*
        from
        (
        select first.period as period, second.city,
        sum(ifnull(first.wholeSalePrice,0))/count(second.quantity) wholeSalePrice,
        (sum(second.netProfit) -sum(ifnull(first.wholeSalePrice,0))/count(second.quantity))/count(second.quantity) avgNetProfit,
        sum(second.netProfit) -sum(ifnull(first.wholeSalePrice,0))/count(second.quantity) totalNetProfit,
         count(second.quantity) quantitySold, avg(second.revenue) avgRevenue,
        sum(second.revenue) totalRevenue,avg(second.deliveryPrice) avgDelivery,sum(second.deliveryPrice) totalDelivery
        from 
        (select year(ords.payDate) period,ordd.idOrders,pp.idParentProduct,pp.productName,pp.wholeSalePrice
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
        select year(ords.payDate) period, ordd.idOrders,sum(ordd.quantity) quantity,
        (ifnull(ords.paid,0)-ifnull(ords.deliveryPrice,0))/sum(ordQ.quantityInOrder) as netProfit,
        ifnull(ords.paid,0)/sum(ordQ.quantityInOrder) as revenue,
        ifnull(ords.deliveryPrice,0)/sum(ordQ.quantityInOrder) as deliveryPrice,
        cust.city 
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
        group by period,ordd.idOrders,city
        having netProfit is not null
        ) as second
        on first.idOrders = second.idOrders
        group by first.period, second.city
        having avgNetProfit is not null
        ) as analysis
        having period> ${yrFirst}
        order by period;
            `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n=5
        var dateRange=[...results]
        while (n>=0){
            var year = moment().format("YYYY")-n
            var info = results.filter(info=>info.period===year)
            if (info.length===0){
                dateRange.push({period:year, city:null, avgNetProfit:null, totalNetProfit:null,
                    quantitySold:null, avgRevenue:null, totalRevenue:null, avgDelivery:null, totalDelivery:null})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
})
module.exports =router