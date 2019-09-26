/*post suppliers info*/
/*
INSERT INTO Suppliers (supplierName ,address1 ,address2 ,city ,postcode,dateCreated)
Values ("VietSupply","31 Tim Street",null,"Saigon","1525","2019-08-05")
*/
/*Post attributes for variations*/

/*INSERT INTO VariantCode (attributes,category)
Values ("medium","size");
INSERT INTO VariantCode (attributes,category)
Values ("red","colour");
INSERT INTO VariantCode (attributes,category)
Values ("small","size");
INSERT INTO VariantCode (attributes,category)
Values ("blue","colour");


*/


/*post VariantProduct info*/

/*
INSERT INTO VariantProduct (productName ,category,subCategory, idSuppliers ,wholesalePrice ,basePrice ,dateCreated, comment)
Values ("Running shorts","sports","shorts",1,9.85,20.50,"2019-08-05",null);
*/
/*post VariantProduct info
the sku is maede up of idParentProduct-size-colour
need to check the VariantCode for the colour and size code

INSERT INTO VariantProduct (sku,idParentProduct
 ,size,colour, quantityInStock ,poductDescription ,priceAdjustment ,dateCreated, image)
Values ("1-1-2",1,"medium","red",30,null,18.5,CURDATE(),null);
INSERT INTO VariantProduct (sku,idParentProduct
 ,size,colour, quantityInStock ,productDescription ,priceAdjustment ,dateCreated, image)
Values ("2-4-2",2,"small","red",30,null,18.5,CURDATE(),null);
INSERT INTO VariantProduct (sku,idParentProduct
 ,size,colour, quantityInStock ,productDescription ,priceAdjustment ,dateCreated, image)
Values ("3-1-3",3,"medium","blue",30,null,18.5,CURDATE(),null);
*/

/*Posting orders
Pending — your payment has not yet been sent to the bank or credit card processor.
Success — your credit or debit card payment has been processed and accepted.
Complete — your checking, savings or other bank account payment has been processed and accepted.
Canceled — you stopped the payment before it was processed. For automatic recurring payments, all remaining payments were canceled.
Rejected — your payment was not accepted when it was processed by the bank or credit card company. For information, contact the bank or credit card company. Do not contact Pay.gov.

Insert into Orders(orderDate,customerId,totalBasePrice,reduction,totalPaid,payDate,paymentStatus)
Values (Curdate(),1,92.5,10,82.5,"2019-08-08","Pending")
*/

/* Posting order details
Need to make sure if we group by idOrders, the total price is equal to the totalPaid in that idOrder
*/
/*Insert into Order_Details (idOrders,sku,quantity,priceEach)
values (2,"3-1-3",3,16.5)
Insert into Order_Details (idOrders,sku,quantity,priceEach)
values (2,"2-4-2",1,18.5);
Insert into Order_Details (idOrders,sku,quantity,priceEach)
values (2,"1-1-2",1,14.5);
*/
/*post Customers*/
/*
Insert into Customers (facebookId, firstName, 
lastName, gender, dateCreated, address1, address2, city, postcode, country ,telephone)
values ("10155237263494493","Alan","Hoang","Male",CURDATE(),"21 Timaru Grove",null,"South Penrith","2750","Australia","+61247361026")
Insert into Customers (facebookId, firstName, 
lastName, gender, dateCreated, address1, address2, city, postcode, telephone)
values ("2019664488098490","Jackie","Do","Female",CURDATE(),"13 Charlton Street",null,"Yagoona","2199","Australia",null)
*/
