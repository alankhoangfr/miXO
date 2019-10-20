
CREATE TABLE `Category` (
  `idCategory` int(11) NOT NULL AUTO_INCREMENT,
  `sector` varchar(45) DEFAULT NULL,
  `category` varchar(45) DEFAULT NULL,
  `subcategory` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idCategory`)
);

CREATE TABLE `Customers` (
  `customerId` int(11) NOT NULL AUTO_INCREMENT,
  `facebookId` varchar(250) NOT NULL,
  `firstName` varchar(100) DEFAULT NULL,
  `lastName` varchar(100) DEFAULT NULL,
  `gender` varchar(45) DEFAULT NULL,
  `dateCreated` date DEFAULT NULL,
  `address1` varchar(100) DEFAULT NULL,
  `address2` varchar(100) DEFAULT NULL,
  `city` varchar(45) DEFAULT NULL,
  `postcode` varchar(45) DEFAULT NULL,
  `country` varchar(45) DEFAULT NULL,
  `telephone` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`customerId`),
  UNIQUE KEY `facebookId_UNIQUE` (`facebookId`)
) ;

CREATE TABLE `Expenses` (
  `idExpenses` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL,
  `category` varchar(45) DEFAULT NULL,
  `subCategory` varchar(45) DEFAULT NULL,
  `orderDate` date DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `paymentStatus` varchar(45) DEFAULT NULL,
  `paid` varchar(45) DEFAULT NULL,
  `payDate` date DEFAULT NULL,
  `comment` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`idExpenses`)
);


CREATE TABLE `User` (
  `idUser` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) DEFAULT NULL,
  `password` varchar(250) DEFAULT NULL,
  `email` varchar(250) NOT NULL,
  PRIMARY KEY (`idUser`),
  UNIQUE KEY `email` (`email`)
);
CREATE TABLE `VariantCode` (
  `idVariantCode` int(11) NOT NULL AUTO_INCREMENT,
  `attributes` varchar(45) DEFAULT NULL,
  `category` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idVariantCode`),
  UNIQUE KEY `idVariantCode_UNIQUE` (`idVariantCode`)
);

CREATE TABLE `Orders` (
  `idOrders` varchar(250) NOT NULL,
  `orderDate` date DEFAULT NULL,
  `customerId` int(11) NOT NULL,
  `totalBasePrice` decimal(10,2) DEFAULT NULL,
  `reduction` decimal(10,2) DEFAULT NULL,
  `totalPaid` decimal(10,2) DEFAULT NULL,
  `payDate` date DEFAULT NULL,
  `paymentStatus` varchar(45) DEFAULT NULL,
  `comment` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`idOrders`),
  KEY `order_customer` (`customerId`),
  CONSTRAINT `order_customer` FOREIGN KEY (`customerId`) REFERENCES `Customers` (`customerId`)
);

CREATE TABLE `Suppliers` (
  `idSuppliers` int(11) NOT NULL AUTO_INCREMENT,
  `supplierName` varchar(45) DEFAULT NULL,
  `address1` varchar(45) DEFAULT NULL,
  `address2` varchar(45) DEFAULT NULL,
  `city` varchar(45) DEFAULT NULL,
  `postcode` varchar(45) DEFAULT NULL,
  `dateCreated` date DEFAULT NULL,
  `country` varchar(45) DEFAULT NULL,
  `telephone` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idSuppliers`)
) ;

CREATE TABLE `ParentProduct` (
  `idParentProduct` int(11) NOT NULL AUTO_INCREMENT,
  `productName` varchar(45) DEFAULT NULL,
  `category` varchar(45) DEFAULT NULL,
  `subCategory` varchar(45) DEFAULT NULL,
  `idSuppliers` int(11) NOT NULL,
  `wholeSalePrice` decimal(10,2) DEFAULT NULL,
  `basePrice` decimal(10,2) DEFAULT NULL,
  `dateCreated` date DEFAULT NULL,
  `productImage` longblob,
  PRIMARY KEY (`idParentProduct`),
  KEY `PP_SupplierID` (`idSuppliers`),
  CONSTRAINT `PP_SupplierID` FOREIGN KEY (`idSuppliers`) REFERENCES `Suppliers` (`idSuppliers`)
);

CREATE TABLE `VariantProduct` (
  `idProducts` int(11) NOT NULL AUTO_INCREMENT,
  `sku` varchar(250) NOT NULL,
  `idParentProduct` int(11) NOT NULL,
  `size` varchar(50) DEFAULT NULL,
  `colour` varchar(45) DEFAULT NULL,
  `quantityInStock` int(11) DEFAULT NULL,
  `productDescription` longtext,
  `wholeSalePrice` decimal(10,2) DEFAULT NULL,
  `priceAdjustment` decimal(10,2) DEFAULT NULL,
  `dateCreated` date DEFAULT NULL,
  `productImage` longblob,
  `accumulation` int(11) DEFAULT NULL,
  PRIMARY KEY (`idProducts`),
  UNIQUE KEY `idProducts_UNIQUE` (`idProducts`),
  UNIQUE KEY `sku_UNIQUE` (`sku`),
  KEY `VP_ParentID` (`idParentProduct`),
  CONSTRAINT `VP_ParentID` FOREIGN KEY (`idParentProduct`) REFERENCES `ParentProduct` (`idParentProduct`)
);
CREATE TABLE `IncomingOrders` (
  `idIncomingOrders` varchar(250) NOT NULL,
  `supplierOrderNumber` varchar(250) NOT NULL,
  `orderDate` date DEFAULT NULL,
  `idSuppliers` int(11) NOT NULL,
  `totalAmount` decimal(10,2) DEFAULT NULL,
  `supplierDiscount` decimal(10,2) DEFAULT NULL,
  `status` varchar(45) DEFAULT NULL,
  `comment` longtext,
  `paymentStatus` varchar(45) DEFAULT NULL,
  `paid` decimal(10,2) DEFAULT NULL,
  `payDate` date DEFAULT NULL,
  PRIMARY KEY (`idIncomingOrders`),
  KEY `IncomingOrders_suppliers` (`idSuppliers`),
  CONSTRAINT `IncomingOrders_suppliers` FOREIGN KEY (`idSuppliers`) REFERENCES `Suppliers` (`idSuppliers`)
)

CREATE TABLE `Order_Details` (
  `idOrder_Details` int(11) NOT NULL AUTO_INCREMENT,
  `idOrders` varchar(250) NOT NULL,
  `sku` varchar(250) NOT NULL,
  `quantity` int(11) DEFAULT NULL,
  `priceEach` decimal(10,2) DEFAULT NULL,
  `status` varchar(45) DEFAULT NULL,
  `comment` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`idOrder_Details`),
  KEY `orderDetails_SKU` (`sku`),
  KEY `orderDetails_order` (`idOrders`),
  CONSTRAINT `orderDetails_SKU` FOREIGN KEY (`sku`) REFERENCES `VariantProduct` (`sku`),
  CONSTRAINT `orderDetails_order` FOREIGN KEY (`idOrders`) REFERENCES `Orders` (`idOrders`)
) 




CREATE TABLE `IncomingOrderProducts` (
  `idIncomingOrderProducts` int(11) NOT NULL AUTO_INCREMENT,
  `idIncomingOrders` varchar(250) NOT NULL,
  `predictedParentId` varchar(250) DEFAULT NULL,
  `sku` varchar(250) DEFAULT NULL,
  `wholeSalePrice` decimal(10,2) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `retailPrice` decimal(10,2) DEFAULT NULL,
  `productDescription` varchar(250) DEFAULT NULL,
  `category` varchar(45) DEFAULT NULL,
  `subCategory` varchar(45) DEFAULT NULL,
  `colour` varchar(45) DEFAULT NULL,
  `size` varchar(45) DEFAULT NULL,
  `productImage` longblob,
  `status` varchar(45) DEFAULT NULL,
  `comment` varchar(45) DEFAULT NULL,
  `arrivedToday` int(11) DEFAULT NULL,
  PRIMARY KEY (`idIncomingOrderProducts`),
  KEY `IncomingOrderProducts_sku` (`sku`),
  KEY `incomingOrderProduct_orderId` (`idIncomingOrders`),
  CONSTRAINT `incomingOrderProduct_orderId` FOREIGN KEY (`idIncomingOrders`) REFERENCES `IncomingOrders` (`idIncomingOrders`)
);


