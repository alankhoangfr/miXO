/*Expense Summary*/
/* Number of outstanding*/
select count(paymentStatus) as count, IFNULL(paymentStatus,"Not Paid") as status
from expenses
group by paymentStatus;


/* Amount of outstanding payments*/
select ifnull(sum(amount-ifnull(paid,0)),0) amount, "Outstanding Payments" as status
from expenses
where paymentStatus in ("Partially Paid", null)
union
 SELECT sum(paid) as amount, "Total Amount Paid" as status
 FROM expenses
 union
  SELECT avg(paid) as averageAmount, "Average Amount Paid per Expense" as status
FROM expenses;


select sum(amount), week(payDate) as wk
from expenses
where payDate between
"2019-09-01" and "2019-11-01"
group by wk;

select count(category), category, week(payDate) as wk, sum(paid)
from expenses
where payDate between
"2019-09-01" and "2019-11-01"
group by wk,category;


