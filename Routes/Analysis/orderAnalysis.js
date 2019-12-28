const express = require("express")
const router = express.Router()
const pool = require("../../dbpool")
const moment = require("moment")
const auth = require('../../middleware/auth')


router.get('/amountSummary', auth,(req, res) => {
    let sql = `
        select sum(paid) as amount,paymentStatus as status
        from orders
        where paymentStatus="Completely Paid"
        group by paymentStatus
        union
        select sum(IFNULL(totalPriceSold,0)-IFNULL(reduction,0)+IFNULL(deliveryPrice,0)-IFNULL(paid,0)) as amount,
        IFNULL(paymentStatus,"Not Paid") as status
        from orders
        where not paymentStatus = "Completely Paid" or paymentStatus is null
        group by paymentStatus
        union
        select Round(avg(paid),2) as amount,"Average Payment" as status
        from orders
        where paymentStatus="Completely Paid"
        group by paymentStatus;`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});    


router.get('/quantitySummary', auth,(req, res) => {
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
        select sum(quantity) count,"Total Items Ordered"
        from order_details 
        ;
    `;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});    
router.get('/topVp', auth,(req, res) => {
    let sql = `
    select pp.productName, vp.colour, vp.size,first.sumq as quantityOrdered
    ,pp.category,pp.subCategory,vp.productImage
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
	order by quantityOrdered desc`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	

router.get('/topPp', auth,(req, res) => {
    let sql = `
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
	order by first.sumq desc`
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});	
//Daily

router.get('/nData/daily', auth,(req, res) => {
    let dailyFirst = moment().subtract(14,'d').format('YYYY-M-D')
    let sql = `
         select nOrders.period as period,nOrders.numberOfOrders-ifnull(nCancel.numberOfCancel,0) as numberOfOrders,
        ifnull(nCancel.numberOfCancel,0) numberOfCancel,nOrders.numberOfNewCustomers,nOrders.numberOfExisting,
        nProducts.numberOfProducts
        from
        (
            select ords.orderDate period, ifnull(sum(ordd.quantity),0) numberOfProducts
            from order_details ordd
            left join orders ords
            on ords.idOrders=ordd.idOrders
            group by period
        ) as nProducts
        left join
        (
            select orderDate period,
            ifnull(count(ords.idOrders),0) numberOfOrders,
            ifnull(count(distinct( ords.customerId)),0) numberOfNewCustomers,
            ifnull(count(ords.customerId)-count(distinct( ords.customerId)),0) numberOfExisting
            from orders ords
            group by period
        ) as nOrders
        on nOrders.period =nProducts.period
        left join
        (
            select orderDate period,
            ifnull(count(ords.idOrders),0) numberOfCancel
            from orders ords
            where status = "Cancelled"
            group by period
        ) as nCancel
        on nCancel.period =nProducts.period
        having nOrders.period>${`"${dailyFirst}"`} 
        order by period
        `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n = 13
        var dates=[]
            results.map(each=>{
                if(dates.indexOf(moment(each.period).format('YYYY-M-D'))<0&&each.period!==null){
                    dates.push(moment(each.period).format('YYYY-M-D'))
                }
            })   
        dates.length<5?n=5:n=dates.length
        var dateRange=[]
        while (n>=0){
            var day = moment().subtract(n,'d').format('YYYY-M-D')
            var info = results.filter(info=>moment(info.period).format('YYYY-M-D')===day)
            if(info.length>=1){
                info.forEach(each=>dateRange.push({period:day,numberOfOrders:each.numberOfOrders,numberOfNewCustomers:each.numberOfNewCustomers
                    ,numberOfExisting:each.numberOfExisting,numberOfProducts:each.numberOfProducts,numberOfCancel:each.numberOfCancel}))
            }else if (info.length===0){
                dateRange.push({period:day,numberOfOrders:0,numberOfNewCustomers:0,numberOfCancel:0
                    ,numberOfExisting:0,numberOfProducts:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});    

router.get('/topColourSize/daily', auth,(req, res) => {
    let dailyFirst = moment().subtract(14,'d').format('YYYY-M-D')
    let sql = `
        select colour.*,size.numberSize,size.size
        from
        (
            select s.period as period, ifnull(s.maxq,0) as numberSize, first.size
            from(
                select first.period, max(first.totalquantity) as maxq
                from
                (
                    select ords.orderDate as period, sum(ordd.quantity) as totalquantity, vp.size 
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
            select ords.orderDate as period, sum(ordd.quantity) as totalquantity, vp.size 
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
                    select ords.orderDate as period, sum(ordd.quantity) as totalquantity, vp.colour 
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
                select ords.orderDate as period, sum(ordd.quantity) as totalquantity, vp.colour
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
        having colour.period>${`"${dailyFirst}"`} 
        order by period;
        `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n = 13
        var dates=[]
            results.map(each=>{
                if(dates.indexOf(moment(each.period).format('YYYY-M-D'))<0&&each.period!==null){
                    dates.push(moment(each.period).format('YYYY-M-D'))
                }
            })   
        dates.length<5?n=5:n=dates.length
        var dateRange=[]
        while (n>=0){
            var day = moment().subtract(n,'d').format('YYYY-M-D')
            var info = results.filter(info=>moment(info.period).format('YYYY-M-D')===day)
            if(info.length>=1){
                info.forEach(each=>dateRange.push({period:day,numberColour:each.numberColour,colour:each.colour,
                    numberSize:each.numberSize,size:each.size}))
            }else if (info.length===0){
                dateRange.push({period:day,numberColour:0,colour:"",
                    numberSize:0,size:""})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});    

router.get('/topPPOrder/daily', auth,(req, res) => {
    let dailyFirst = moment().subtract(14,'d').format('YYYY-M-D')
    let sql = `
        select ords.orderDate period, pp.productName productName, ifnull(sum(ordd.quantity),0) quantity
        from order_details ordd
        left join variantproduct vp
        on vp.sku = ordd.sku
        left join orders ords
        on ords.idOrders=ordd.idOrders
        left join parentproduct pp
        on pp.idParentProduct = vp.idParentProduct
        group by period,productName
        having period>${`"${dailyFirst}"`} 
        order by period;
    `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n = 13
        var dates=[]
            results.map(each=>{
                if(dates.indexOf(moment(each.period).format('YYYY-M-D'))<0&&each.period!==null){
                    dates.push(moment(each.period).format('YYYY-M-D'))
                }
            })   
        dates.length<5?n=5:n=dates.length
        var dateRange=[]
        while (n>=0){
            var day = moment().subtract(n,'d').format('YYYY-M-D')
            var info = results.filter(info=>moment(info.period).format('YYYY-M-D')===day)
            if(info.length>=1){
                info.forEach(each=>dateRange.push({period:day,productName:each.productName,quantity:each.quantity}))
            }else if (info.length===0){
                dateRange.push({period:day,productName:null,quantity:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});  


//Weekly
router.get('/nData/wk', auth,(req, res) => {
    let wkFirst = moment().format("WW")-10
    let sql = `
        select nOrders.period period,nOrders.numberOfOrders-ifnull(nCancel.numberOfCancel,0) as numberOfOrders,
        ifnull(nCancel.numberOfCancel,0) numberOfCancel,nOrders.numberOfNewCustomers,nOrders.numberOfExisting,
        nProducts.numberOfProducts
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
        left join
        (
            select week(orderDate) period,
            ifnull(count(ords.idOrders),0) numberOfCancel
            from orders ords
            where status = "Cancelled"
            group by period
        ) as nCancel
        on nCancel.period =nProducts.period
        having nOrders.period>${wkFirst}
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
                info.forEach(each=>dateRange.push({period:week,numberOfOrders:each.numberOfOrders,numberOfNewCustomers:each.numberOfNewCustomers
                    ,numberOfExisting:each.numberOfExisting,numberOfProducts:each.numberOfProducts,numberOfCancel:each.numberOfCancel}))
            }else if (info.length===0){
                dateRange.push({period:week,numberOfOrders:0,numberOfNewCustomers:0,numberOfCancel:0
                    ,numberOfExisting:0,numberOfProducts:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});    

router.get('/topColourSize/wk', auth,(req, res) => {
    let wkFirst = moment().format("WW")-10
    let sql = `
        select colour.*,size.numberSize,size.size
        from
        (
            select s.period as period, ifnull(s.maxq,0) as numberSize, first.size
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
        having colour.period>${wkFirst}
        order by colour.period;
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
                info.forEach(each=>dateRange.push({period:week,numberColour:each.numberColour,colour:each.colour,
                    numberSize:each.numberSize,size:each.size}))
            }else if (info.length===0){
                dateRange.push({period:week,numberColour:0,colour:"",
                    numberSize:0,size:""})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});    

router.get('/topPPOrder/wk', auth,(req, res) => {
    let wkFirst = moment().format("WW")-10
    let sql = `
        select week(ords.orderDate) period, pp.productName productName, ifnull(sum(ordd.quantity),0) quantity
        from order_details ordd
        left join variantproduct vp
        on vp.sku = ordd.sku
        left join orders ords
        on ords.idOrders=ordd.idOrders
        left join parentproduct pp
        on pp.idParentProduct = vp.idParentProduct
        group by period,productName
        having period>${wkFirst} 
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
                info.forEach(each=>dateRange.push({period:week,productName:each.productName,quantity:each.quantity}))
            }else if (info.length===0){
                dateRange.push({period:week,productName:null,quantity:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});  

//Monthly
router.get('/nData/mth', auth,(req, res) => {
    const mth = moment().subtract(24,'months').format('MM')
    const yr = moment().subtract(24,'months').format('YYYY')
    const mthFirst=`${String(yr)}${String(mth)}`
    let sql = `    
         select nOrders.period period,nOrders.numberOfOrders-ifnull(nCancel.numberOfCancel,0) as numberOfOrders,
        ifnull(nCancel.numberOfCancel,0) numberOfCancel,nOrders.numberOfNewCustomers,nOrders.numberOfExisting,
        nProducts.numberOfProducts
        from
        (
            select concat(month(ords.orderDate),year(ords.orderDate)) period, ifnull(sum(ordd.quantity),0) numberOfProducts
            from order_details ordd
            left join orders ords
            on ords.idOrders=ordd.idOrders
            group by period
        ) as nProducts
        left join
        (
            select concat(month(ords.orderDate),year(ords.orderDate)) period,
            ifnull(count(ords.idOrders),0) numberOfOrders,
            ifnull(count(distinct( ords.customerId)),0) numberOfNewCustomers,
            ifnull(count(ords.customerId)-count(distinct( ords.customerId)),0) numberOfExisting
            from orders ords
            group by period
        ) as nOrders
        on nOrders.period =nProducts.period 
        left join
        (
            select concat(month(ords.orderDate),year(ords.orderDate)) period,
            ifnull(count(ords.idOrders),0) numberOfCancel
            from orders ords
            where status = "Cancelled"
            group by period
        ) as nCancel
        on nCancel.period =nProducts.period
        having concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )>${`"${mthFirst}"`}
        order by period
        `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n
        results.length<5?n=5:n=results.length
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
                info.forEach(each=>dateRange.push({period:month,numberOfOrders:each.numberOfOrders,numberOfNewCustomers:each.numberOfNewCustomers
                    ,numberOfExisting:each.numberOfExisting,numberOfProducts:each.numberOfProducts,numberOfCancel:each.numberOfCancel}))
            }else if (info.length===0){
                dateRange.push({period:month,numberOfOrders:0,numberOfNewCustomers:0,numberOfCancel:0
                    ,numberOfExisting:0,numberOfProducts:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});    

router.get('/topColourSize/mth', auth,(req, res) => {
    const mth = moment().subtract(24,'months').format('MM')
    const yr = moment().subtract(24,'months').format('YYYY')
    const mthFirst=`${String(yr)}${String(mth)}`
    let sql = `
        select colour.*,size.numberSize,size.size
        from
        (
            select s.period as period, ifnull(s.maxq,0) as numberSize, first.size
            from(
                select first.period, max(first.totalquantity) as maxq
                from
                (
                    select concat(month(ords.orderDate),year(ords.orderDate)) as period, sum(ordd.quantity) as totalquantity, vp.size 
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
            select concat(month(ords.orderDate),year(ords.orderDate)) as period, sum(ordd.quantity) as totalquantity, vp.size 
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
                    select concat(month(ords.orderDate),year(ords.orderDate)) as period, sum(ordd.quantity) as totalquantity, vp.colour 
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
                select concat(month(ords.orderDate),year(ords.orderDate)) as period, sum(ordd.quantity) as totalquantity, vp.colour
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
                info.forEach(each=>dateRange.push({period:month,numberColour:each.numberColour,colour:each.colour,
                    numberSize:each.numberSize,size:each.size}))
            }else if (info.length===0){
                dateRange.push({period:month,numberColour:0,colour:"",numberSize:0,size:""})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});    

router.get('/topPPOrder/mth', auth,(req, res) => {
    const mth = moment().subtract(24,'months').format('MM')
    const yr = moment().subtract(24,'months').format('YYYY')
    const mthFirst=`${String(yr)}${String(mth)}`
    let sql = `
        select concat(month(ords.orderDate),year(ords.orderDate)) period, pp.productName productName, ifnull(sum(ordd.quantity),0) quantity
        from order_details ordd
        left join variantproduct vp
        on vp.sku = ordd.sku
        left join orders ords
        on ords.idOrders=ordd.idOrders
        left join parentproduct pp
        on pp.idParentProduct = vp.idParentProduct
        group by period,productName
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
                info.forEach(each=>dateRange.push({period:month,productName:each.productName,quantity:each.quantity}))
            }else if (info.length===0){
                dateRange.push({period:month,productName:null,quantity:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});  

//quarterly
router.get('/nData/qrt', auth,(req, res) => {
    const qrt = moment().subtract(24,'quarters').format('Q')
    const yr = moment().subtract(24,'quarters').format('YYYY')
    const qrtFirst=`${String(yr)}${String(qrt)}`
    let sql = `    
         select nOrders.period as period,nOrders.numberOfOrders-ifnull(nCancel.numberOfCancel,0) as numberOfOrders,
        ifnull(nCancel.numberOfCancel,0) numberOfCancel,nOrders.numberOfNewCustomers,nOrders.numberOfExisting,
        nProducts.numberOfProducts
        from
        (
            select concat(quarter(ords.orderDate),year(ords.orderDate)) period, ifnull(sum(ordd.quantity),0) numberOfProducts
            from order_details ordd
            left join orders ords
            on ords.idOrders=ordd.idOrders
            group by period
        ) as nProducts
        left join
        (
            select concat(quarter(ords.orderDate),year(ords.orderDate)) period,
            ifnull(count(ords.idOrders),0) numberOfOrders,
            ifnull(count(distinct( ords.customerId)),0) numberOfNewCustomers,
            ifnull(count(ords.customerId)-count(distinct( ords.customerId)),0) numberOfExisting
            from orders ords
            group by period
        ) as nOrders
        on nOrders.period =nProducts.period 
        left join
        (
            select concat(quarter(ords.orderDate),year(ords.orderDate)) period,
            ifnull(count(ords.idOrders),0) numberOfCancel
            from orders ords
            where status = "Cancelled"
            group by period
        ) as nCancel
        on nCancel.period =nProducts.period
        having concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )>${`"${qrtFirst}"`}
        order by period
        `
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        var n
        results.length<5?n=5:n=results.length
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
                info.forEach(each=>dateRange.push({period:quarter,numberOfOrders:each.numberOfOrders,numberOfNewCustomers:each.numberOfNewCustomers
                    ,numberOfExisting:each.numberOfExisting,numberOfProducts:each.numberOfProducts,numberOfCancel:each.numberOfCancel}))
            }else if (info.length===0){
                dateRange.push({period:quarter,numberOfOrders:0,numberOfNewCustomers:0,numberOfCancel:0
                    ,numberOfExisting:0,numberOfProducts:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});    

router.get('/topColourSize/qrt', auth,(req, res) => {
    const qrt = moment().subtract(24,'quarters').format('Q')
    const yr = moment().subtract(24,'quarters').format('YYYY')
    const qrtFirst=`${String(yr)}${String(qrt)}`
    let sql = `
        select colour.*,size.numberSize,size.size
        from
        (
            select s.period as period, ifnull(s.maxq,0) as numberSize, first.size
            from(
                select first.period, max(first.totalquantity) as maxq
                from
                (
                    select concat(quarter(ords.orderDate),year(ords.orderDate)) as period, sum(ordd.quantity) as totalquantity, vp.size 
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
            select concat(quarter(ords.orderDate),year(ords.orderDate)) as period, sum(ordd.quantity) as totalquantity, vp.size 
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
                    select concat(quarter(ords.orderDate),year(ords.orderDate)) as period, sum(ordd.quantity) as totalquantity, vp.colour 
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
                select concat(quarter(ords.orderDate),year(ords.orderDate)) as period, sum(ordd.quantity) as totalquantity, vp.colour
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
                info.forEach(each=>dateRange.push({period:quarter,numberColour:each.numberColour,colour:each.colour,
                    numberSize:each.numberSize,size:each.size}))
            }else if (info.length===0){
                dateRange.push({period:quarter,numberColour:0,colour:"",numberSize:0,size:""})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});    

router.get('/topPPOrder/qrt', auth,(req, res) => {
    const qrt = moment().subtract(24,'quarters').format('Q')
    const yr = moment().subtract(24,'quarters').format('YYYY')
    const qrtFirst=`${String(yr)}${String(qrt)}`
    let sql = `
        select concat(quarter(ords.orderDate),year(ords.orderDate)) period, pp.productName productName, ifnull(sum(ordd.quantity),0) quantity
        from order_details ordd
        left join variantproduct vp
        on vp.sku = ordd.sku
        left join orders ords
        on ords.idOrders=ordd.idOrders
        left join parentproduct pp
        on pp.idParentProduct = vp.idParentProduct
        group by period,productName
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
                info.forEach(each=>dateRange.push({period:quarter,productName:each.productName,quantity:each.quantity}))
            }else if (info.length===0){
                dateRange.push({period:quarter,productName:null,quantity:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});  

//Yearly

router.get('/nData/yr', auth,(req, res) => {
    let yrFirst = moment().format("YYYY")-5
    let sql = `
        select nOrders.period as period,nOrders.numberOfOrders-ifnull(nCancel.numberOfCancel,0) as numberOfOrders,
        ifnull(nCancel.numberOfCancel,0) numberOfCancel,nOrders.numberOfNewCustomers,nOrders.numberOfExisting,
        nProducts.numberOfProducts
        from
        (
            select year(ords.orderDate) period, ifnull(sum(ordd.quantity),0) numberOfProducts
            from order_details ordd
            left join orders ords
            on ords.idOrders=ordd.idOrders
            group by period
        ) as nProducts
        left join
        (
            select year(orderDate) period,
            ifnull(count(ords.idOrders),0) numberOfOrders,
            ifnull(count(distinct( ords.customerId)),0) numberOfNewCustomers,
            ifnull(count(ords.customerId)-count(distinct( ords.customerId)),0) numberOfExisting
            from orders ords
            group by period
        ) as nOrders
        on nOrders.period =nProducts.period
        left join
        (
            select year(ords.orderDate) period,
            ifnull(count(ords.idOrders),0) numberOfCancel
            from orders ords
            where status = "Cancelled"
            group by period
        ) as nCancel
        on nCancel.period =nProducts.period
        having nOrders.period>${yrFirst} 
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
                info.forEach(each=>dateRange.push({period:year,numberOfOrders:each.numberOfOrders,numberOfNewCustomers:each.numberOfNewCustomers
                    ,numberOfExisting:each.numberOfExisting,numberOfProducts:each.numberOfProducts,numberOfCancel:each.numberOfCancel}))
            }else if (info.length===0){
                dateRange.push({period:year,numberOfOrders:0,numberOfNewCustomers:0
                    ,numberOfExisting:0,numberOfProducts:0,numberOfCancel:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});    

router.get('/topColourSize/yr', auth,(req, res) => {
    let yrFirst = moment().format("YYYY")-5
    let sql = `
        select colour.*,size.numberSize,size.size
        from
        (
            select s.period as period, ifnull(s.maxq,0) as numberSize, first.size
            from(
                select first.period, max(first.totalquantity) as maxq
                from
                (
                    select year(ords.orderDate) as period, sum(ordd.quantity) as totalquantity, vp.size 
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
            select year(ords.orderDate) as period, sum(ordd.quantity) as totalquantity, vp.size 
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
                    select year(ords.orderDate) as period, sum(ordd.quantity) as totalquantity, vp.colour 
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
                select year(ords.orderDate) as period, sum(ordd.quantity) as totalquantity, vp.colour
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
        having colour.period>${yrFirst}
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
                info.forEach(each=>dateRange.push({period:year,numberColour:each.numberColour,colour:each.colour,
                    numberSize:each.numberSize,size:each.size}))
            }else if (info.length===0){
                dateRange.push({period:year,numberColour:0,colour:"",
                    numberSize:0,size:""})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});    

router.get('/topPPOrder/yr', auth,(req, res) => {
    let yrFirst = moment().format("YYYY")-5
    let sql = `
        select year(ords.orderDate) period, pp.productName productName, ifnull(sum(ordd.quantity),0) quantity
        from order_details ordd
        left join variantproduct vp
        on vp.sku = ordd.sku
        left join orders ords
        on ords.idOrders=ordd.idOrders
        left join parentproduct pp
        on pp.idParentProduct = vp.idParentProduct
        group by period,productName
        having period>${yrFirst} 
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
                info.forEach(each=>dateRange.push({period:year,productName:each.productName,quantity:each.quantity}))
            }else if (info.length===0){
                dateRange.push({period:year,productName:null,quantity:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }        
    });
});  
module.exports =router