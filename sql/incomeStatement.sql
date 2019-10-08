/*Profit and Loss over a period*/

/*Expenses */

/*Expense over period x and y*/
select * from IncomingOrders
where payDate between '2019/09/20' and '2019/10/25'
or paymentStatus is not null;

select * from Expenses
where payDate between '2019/09/20' and '2019/10/25';

/*Accounts payable over period x and y*/
select * from IncomingOrders
where orderDate between '2019/09/20' and '2019/10/25'
and not paymentStatus = 'Completely Paid';

/* Expenses payable over period x and y */
select * from Expenses
where payDate between '2019/09/20' and '2019/10/25'
and not paymentStatus = "Completely Paid";

/*Revenue */

/* revenue over period x and y*/
select * from Orders
where payDate between '2019/09/20' and '2019/10/25';

/* revenue	payable over period x and y */
select * from Orders
where payDate is null 
and not paymentStatus = "Cancelled";

/*Insights */

/*Accounts completely paid but not recieved over period x and y*/
select * from IncomingOrders
where orderDate between '2019/09/20' and '2019/10/25'
and paymentStatus = 'Completely Paid'
and (not status='Complete' or status is null) ;

/*Inventory recieved but not Completely Paid over period x and y*/
select * from IncomingOrders
where orderDate between '2019/09/20' and '2019/10/25'
and (not paymentStatus = 'Completely Paid' or paymentStatus is null)
and status='Complete' ;

/*revenue paid but not delivered over period x and y*/
select * from Orders
where payDate between '2019/09/20' and '2019/10/25'
and paymentStatus not in("Delivered","Cancelled") ;