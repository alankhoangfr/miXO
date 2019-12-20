const express = require("express")
const router = express.Router()
const pool = require("../../dbpool")
const moment = require("moment")
const auth = require('../../middleware/auth')

router.get('/numberCustomer', auth,(req, res) => {
    let sql = `
    select count(*) as nCustomer
    from customers ;`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        res.send(results)
    });
});
//Daily
router.get('/avgProduct/daily', auth,(req, res) => {
    let dailyFirst = moment().subtract(14,'d').format('YYYY-M-D')
    let sql = `
        select first.daily period, ifnull(avg(sumq),0) amount
        from 
        (
        select ords.orderDate daily,ords.customerId, sum(ordd.quantity) sumQ
        from order_details ordd
        left join orders ords
        on ords.idOrders = ordd.idOrders
        group by daily,customerId
        ) as first
        group by first.daily
        having first.daily>${`"${dailyFirst}"`} 
        order by first.daily asc;`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        n =13
        var dateRange =[]
        while (n>=0){
            var day = moment().subtract(n,'d').format('YYYY-M-D')
            var info = results.filter(info=>moment(info.period).format('YYYY-M-D')===day)
            if(info.length===1){
                dateRange.push({period:day,amount:info[0].amount})
            }else if (info.length===0){
                dateRange.push({period:day,amount:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }      
    });
});

router.get('/avgCustomerOrder/daily', auth,(req, res) => {
    let dailyFirst = moment().subtract(14,'d').format('YYYY-M-D')
    let sql = `
        select first.daily period, ifnull(avg(sumA),0) as amount
        from 
        (
        select payDate daily,customerId, sum(totalPriceSold+ifnull(deliveryPrice,0)-ifnull(reduction,0)) sumA
        from orders 
        where payDate is not null
        group by daily,customerId
        ) as first
        group by first.daily
        having first.daily>${`"${dailyFirst}"`} 
        order by first.daily asc;`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        n =13
        var dateRange =[]
        while (n>=0){
            var day = moment().subtract(n,'d').format('YYYY-M-D')
            var info = results.filter(info=>moment(info.period).format('YYYY-M-D')===day)
            if(info.length===1){
                dateRange.push({period:day,amount:info[0].amount})
            }else if (info.length===0){
                dateRange.push({period:day,amount:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }
    });
});

router.get('/avgOrder/daily', auth,(req, res) => {
    let dailyFirst = moment().subtract(14,'d').format('YYYY-M-D')
    let sql = `
        select first.daily period, ifnull(avg(countOrders),0) amount
        from 
        (
        select orderDate daily,ords.customerId, count(ords.customerId) countOrders
        from orders ords
        group by daily,ords.customerId
        ) as first
        group by first.daily
        having first.daily>${`"${dailyFirst}"`} 
        order by first.daily asc;
        `;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        n =13
        var dateRange =[]
        while (n>=0){
            var day = moment().subtract(n,'d').format('YYYY-M-D')
            var info = results.filter(info=>moment(info.period).format('YYYY-M-D')===day)
            if(info.length===1){
                dateRange.push({period:day,amount:info[0].amount})
            }else if (info.length===0){
                dateRange.push({period:day,amount:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }
    });
});
//Weekly
router.get('/avgProduct/wk', auth,(req, res) => {
    let wkFirst = moment().format("WW")-10
    let sql = `
        select first.wk period, ifnull(avg(sumq),0) amount
        from 
        (
        select week(ords.orderDate) wk,ords.customerId, sum(ordd.quantity) sumQ
        from order_details ordd
        left join orders ords
        on ords.idOrders = ordd.idOrders
        group by wk,customerId
        ) as first
        group by first.wk
        having first.wk>${wkFirst} 
        order by first.wk asc;`;
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
        var dateRange =[]
        while (n>=0){
            var week = moment().format("WW")-n
            var info = results.filter(info=>info.period===week)
            if(info.length===1){
                dateRange.push({period:week,amount:info[0].amount})
            }else if (info.length===0){
                dateRange.push({period:week,amount:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }
    });
});

router.get('/avgCustomerOrder/wk', auth,(req, res) => {
    let wkFirst = moment().format("WW")-10
    let sql = `
        select first.wk period,ifnull(avg(sumA),0) as amount
        from 
        (
        select week(payDate) wk,customerId, sum(totalPriceSold+ifnull(deliveryPrice,0)-ifnull(reduction,0)) sumA
        from orders 
        where payDate is not null
        group by wk,customerId
        ) as first
        group by first.wk
        having first.wk>${wkFirst} 
        order by first.wk asc;`;
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
        var dateRange =[]
        while (n>=0){
            var week = moment().format("WW")-n
            var info = results.filter(info=>info.period===week)
            if(info.length===1){
                dateRange.push({period:week,amount:info[0].amount})
            }else if (info.length===0){
                dateRange.push({period:week,amount:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }
    });
});

router.get('/avgOrder/wk', auth,(req, res) => {
    let wkFirst = moment().format("WW")-10
    let sql = `
        select first.wk period, ifnull(avg(countOrders),0) amount
        from 
        (
        select week(ords.orderDate) wk,ords.customerId, count(ords.customerId) countOrders
        from orders ords
        group by wk,ords.customerId
        ) as first
        group by first.wk
        having first.wk>${wkFirst} 
        order by first.wk asc;
        `;
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
        var dateRange =[]
        while (n>=0){
            var week = moment().format("WW")-n
            var info = results.filter(info=>info.period===week)
            if(info.length===1){
                dateRange.push({period:week,amount:info[0].amount})
            }else if (info.length===0){
                dateRange.push({period:week,amount:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }    
    });
});
//Monthly
router.get('/avgProduct/mth', auth,(req, res) => {
    const mth = moment().subtract(24,'months').format('MM')
    const yr = moment().subtract(24,'months').format('YYYY')
    const mthFirst=`${String(yr)}${String(mth)}`    
    let sql = `
        select first.mth period, ifnull(avg(sumq),0) amount
        from 
        (
        select concat(month(ords.orderDate),year(ords.orderDate)) mth,ords.customerId, sum(ordd.quantity) sumQ
        from order_details ordd
        left join orders ords
        on ords.idOrders = ordd.idOrders
        group by mth,customerId
        ) as first
        group by first.mth
        having concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )>${`"${mthFirst}"`}
        order by first.mth asc;`;
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
        var dateRange =[]
        while (n>=0){
            var month = moment().subtract(n,'month').format('MM-YYYY')
            var info = results.filter(info=>
                `${String(info.period).slice(0,info.period.length-4)}-${String(info.period).slice(info.period.length-4,info.period.length)}`===month)
            if(info.length===1){
                dateRange.push({period:month,amount:info[0].amount})
            }else if (info.length===0){
                dateRange.push({period:month,amount:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }    });
});

router.get('/avgCustomerOrder/mth', auth,(req, res) => {
    const mth = moment().subtract(24,'months').format('MM')
    const yr = moment().subtract(24,'months').format('YYYY')
    const mthFirst=`${String(yr)}${String(mth)}`    
    let sql = `
        select first.mth period, ifnull(avg(sumA),0) as amount
        from 
        (
        select concat(month(payDate),year(payDate)) mth,customerId, sum(totalPriceSold+ifnull(deliveryPrice,0)-ifnull(reduction,0)) sumA
        from orders 
        where payDate is not null
        group by mth,customerId
        ) as first
        group by first.mth
        having concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )>${`"${mthFirst}"`}
        order by first.mth asc;`;
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
        var dateRange =[]
        while (n>=0){
            var month = moment().subtract(n,'month').format('MM-YYYY')
            var info = results.filter(info=>
                `${String(info.period).slice(0,info.period.length-4)}-${String(info.period).slice(info.period.length-4,info.period.length)}`===month)
            if(info.length===1){
                dateRange.push({period:month,amount:info[0].amount})
            }else if (info.length===0){
                dateRange.push({period:month,amount:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }    });
});

router.get('/avgOrder/mth', auth,(req, res) => {
    const mth = moment().subtract(24,'months').format('MM')
    const yr = moment().subtract(24,'months').format('YYYY')
    const mthFirst=`${String(yr)}${String(mth)}`    
    let sql = `
        select first.mth period, ifnull(avg(countOrders),0) amount
        from 
        (
        select concat(month(ords.orderDate),year(ords.orderDate)) mth,ords.customerId, count(ords.customerId) countOrders
        from orders ords
        group by mth,ords.customerId
        ) as first
        group by first.mth
        having concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )>${`"${mthFirst}"`}
        order by first.mth asc;
        `;
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
        var dateRange =[]
        while (n>=0){
            var month = moment().subtract(n,'month').format('MM-YYYY')
            var info = results.filter(info=>
                `${String(info.period).slice(0,info.period.length-4)}-${String(info.period).slice(info.period.length-4,info.period.length)}`===month)
            if(info.length===1){
                dateRange.push({period:month,amount:info[0].amount})
            }else if (info.length===0){
                dateRange.push({period:month,amount:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }  
    });
});

//Quarter
router.get('/avgProduct/qrt', auth,(req, res) => {
    const qrt = moment().subtract(8,'quarters').format('Q')
    const yr = moment().subtract(8,'quarters').format('YYYY')
    const qrtFirst=`${String(yr)}${String(qrt)}`         
    let sql = `
        select first.qrt period, ifnull(avg(sumq),0) amount
        from 
        (
        select concat(QUARTER(ords.orderDate),year(ords.orderDate)) qrt,ords.customerId, sum(ordd.quantity) sumQ
        from order_details ordd
        left join orders ords
        on ords.idOrders = ordd.idOrders
        group by qrt,customerId
        ) as first
        group by first.qrt
        having concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )>${`"${qrtFirst}"`}
        order by first.qrt asc;`;
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
        var dateRange =[]
        while (n>=0){
            var quarter = moment().subtract(n,'quarters').format('Q-YYYY')            
            var info = results.filter(info=>
                `${String(info.period).slice(0,info.period.length-4)}-${String(info.period).slice(info.period.length-4,info.period.length)}`===quarter)
            if(info.length===1){
                dateRange.push({period:quarter,amount:info[0].amount})
            }else if (info.length===0){
                dateRange.push({period:quarter,amount:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }    });
});

router.get('/avgCustomerOrder/qrt', auth,(req, res) => {
    const qrt = moment().subtract(8,'quarters').format('Q')
    const yr = moment().subtract(8,'quarters').format('YYYY')
    const qrtFirst=`${String(yr)}${String(qrt)}`      
    let sql = `
        select first.qrt period, ifnull(avg(sumA),0) as amount
        from 
        (
        select concat(QUARTER(payDate),year(payDate)) qrt,customerId, sum(totalPriceSold+ifnull(deliveryPrice,0)-ifnull(reduction,0)) sumA
        from orders 
        where payDate is not null
        group by qrt,customerId
        ) as first
        group by first.qrt
        having concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )>${`"${qrtFirst}"`}
        order by first.qrt asc;`;
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
        var dateRange =[]
        while (n>=0){
            var quarter = moment().subtract(n,'quarters').format('Q-YYYY')
            var info = results.filter(info=>
                `${String(info.period).slice(0,info.period.length-4)}-${String(info.period).slice(info.period.length-4,info.period.length)}`===quarter)
            if(info.length===1){
                dateRange.push({period:quarter,amount:info[0].amount})
            }else if (info.length===0){
                dateRange.push({period:quarter,amount:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }    });
});

router.get('/avgOrder/qrt', auth,(req, res) => {
    const qrt = moment().subtract(8,'quarters').format('Q')
    const yr = moment().subtract(8,'quarters').format('YYYY')
    const qrtFirst=`${String(yr)}${String(qrt)}`      
    let sql = `
        select first.qrt period, ifnull(avg(countOrders),0) amount
        from 
        (
        select concat(QUARTER(ords.orderDate),year(ords.orderDate)) qrt,ords.customerId, count(ords.customerId) countOrders
        from orders ords
        group by qrt,ords.customerId
        ) as first
        group by first.qrt
        having concat(substring(period,length(period)-4+1,length(period)), LEFT(period,length(period)-4) )>${`"${qrtFirst}"`}
        order by first.qrt asc;
        `;
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
        var dateRange =[]
        while (n>=0){
            var quarter = moment().subtract(n,'quarters').format('Q-YYYY')            
            var info = results.filter(info=>
                `${String(info.period).slice(0,info.period.length-4)}-${String(info.period).slice(info.period.length-4,info.period.length)}`===quarter)
            if(info.length===1){
                dateRange.push({period:quarter,amount:info[0].amount})
            }else if (info.length===0){
                dateRange.push({period:quarter,amount:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }  
    });
});
//Yearly
router.get('/avgProduct/yr', auth,(req, res) => {
    let yrFirst = moment().format("YYYY")-5
    let sql = `
        select first.yr period, ifnull(avg(sumq),0) amount
        from 
        (
        select year(ords.orderDate) yr,ords.customerId, sum(ordd.quantity) sumQ
        from order_details ordd
        left join orders ords
        on ords.idOrders = ordd.idOrders
        group by yr,customerId
        ) as first
        group by first.yr
        having first.yr>${yrFirst} 
        order by first.yr asc;`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        n =5
        var dateRange =[]
        while (n>=0){
            var year = moment().format("YYYY")-n
            var info = results.filter(info=>info.period===year)
            if(info.length===1){
                dateRange.push({period:year,amount:info[0].amount})
            }else if (info.length===0){
                dateRange.push({period:year,amount:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }
    });
});

router.get('/avgCustomerOrder/yr', auth,(req, res) => {
    let yrFirst = moment().format("YYYY")-5
    let sql = `
        select first.yr period, ifnull(avg(sumA),0) as amount
        from 
        (
        select year(payDate) yr,customerId, sum(totalPriceSold+ifnull(deliveryPrice,0)-ifnull(reduction,0)) sumA
        from orders 
        where payDate is not null
        group by yr,customerId
        ) as first
        group by first.yr
        having first.yr>${yrFirst} 
        order by first.yr asc;`;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        n =5
        var dateRange =[]
        while (n>=0){
            var year = moment().format("YYYY")-n
            var info = results.filter(info=>info.period===year)
            if(info.length===1){
                dateRange.push({period:year,amount:info[0].amount})
            }else if (info.length===0){
                dateRange.push({period:year,amount:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }
    });
});

router.get('/avgOrder/yr', auth,(req, res) => {
    let yrFirst = moment().format("YYYY")-5
    let sql = `
        select first.yr period, ifnull(avg(countOrders),0) amount
        from 
            (
            select year(ords.orderDate) yr,ords.customerId, count(ords.customerId) countOrders
            from orders ords
            group by yr,ords.customerId
            ) as first
        group by first.yr
        having first.yr>${yrFirst} 
        order by first.yr asc;
        `;
    let query = pool.query(sql, (err, results) => {
        if(err) throw err;
        n =5
        var dateRange =[]
        while (n>=0){
            var year = moment().format("YYYY")-n
            var info = results.filter(info=>info.period===year)
            if(info.length===1){
                dateRange.push({period:year,amount:info[0].amount})
            }else if (info.length===0){
                dateRange.push({period:year,amount:0})
            }
            n-=1
            if(n===-1){
                res.send(dateRange)
            }
        }
    });
});
module.exports =router