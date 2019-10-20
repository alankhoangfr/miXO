
CREATE TABLE `category` (
  `idCategory` int(11) NOT NULL AUTO_INCREMENT,
  `sector` varchar(45) DEFAULT NULL,
  `category` varchar(45) DEFAULT NULL,
  `subcategory` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idCategory`)
);

CREATE TABLE `customers` (
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

CREATE TABLE `expenses` (
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


CREATE TABLE `user` (
  `idUser` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) DEFAULT NULL,
  `password` varchar(250) DEFAULT NULL,
  `email` varchar(250) NOT NULL,
  PRIMARY KEY (`idUser`),
  UNIQUE KEY `email` (`email`)
);
CREATE TABLE `variantcode` (
  `idVariantCode` int(11) NOT NULL AUTO_INCREMENT,
  `attributes` varchar(45) DEFAULT NULL,
  `category` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idVariantCode`),
  UNIQUE KEY `idVariantCode_UNIQUE` (`idVariantCode`)
);

CREATE TABLE `orders` (
  `idOrders` varchar(250) NOT NULL,
  `orderDate` date DEFAULT NULL,
  `customerId` int(11) NOT NULL,
  `totalBasePrice` decimal(10,2) DEFAULT NULL,
  `reduction` decimal(10,2) DEFAULT NULL,
  `status` varchar(45) DEFAULT NULL,
  `comment` longtext,
  `paid` decimal(10,2) DEFAULT NULL,
  `payDate` date DEFAULT NULL,
  `paymentStatus` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idOrders`),
  KEY `order_customer` (`customerId`),
  CONSTRAINT `order_customer` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`)
);

CREATE TABLE `suppliers` (
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

CREATE TABLE `parentproduct` (
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
  CONSTRAINT `PP_SupplierID` FOREIGN KEY (`idSuppliers`) REFERENCES `suppliers` (`idSuppliers`)
);

CREATE TABLE `variantproduct` (
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
  CONSTRAINT `VP_ParentID` FOREIGN KEY (`idParentProduct`) REFERENCES `parentproduct` (`idParentProduct`)
);
CREATE TABLE `incomingorders` (
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
  CONSTRAINT `IncomingOrders_suppliers` FOREIGN KEY (`idSuppliers`) REFERENCES `suppliers` (`idSuppliers`)
);

CREATE TABLE `order_details` (
  `idOrder_Details` int(11) NOT NULL AUTO_INCREMENT,
  `idOrders` varchar(250) NOT NULL,
  `sku` varchar(250) NOT NULL,
  `quantity` int(11) DEFAULT NULL,
  `priceEach` decimal(10,2) DEFAULT NULL,
  `status` varchar(45)  DEFAULT NULL,
  `comment` varchar(250) DEFAULT NULL,
  `arrivedToday` int(11) DEFAULT NULL,
  PRIMARY KEY (`idOrder_Details`),
  KEY `orderDetails_SKU` (`sku`),
  KEY `orderDetails_order` (`idOrders`),
  CONSTRAINT `orderDetails_SKU` FOREIGN KEY (`sku`) REFERENCES `variantproduct` (`sku`),
  CONSTRAINT `orderDetails_order` FOREIGN KEY (`idOrders`) REFERENCES `orders` (`idOrders`)
);



CREATE TABLE `incomingorderproducts` (
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
  CONSTRAINT `incomingOrderProduct_orderId` FOREIGN KEY (`idIncomingOrders`) REFERENCES `incomingorders` (`idIncomingOrders`)
);

INSERT INTO `officaldb`.`variantcode` (`idVariantCode`, `attributes`, `category`) VALUES ('1', 'medium', 'size');
INSERT INTO `officaldb`.`variantcode` (`idVariantCode`, `attributes`, `category`) VALUES ('2', 'red', 'colour');
INSERT INTO `officaldb`.`variantcode` (`idVariantCode`, `attributes`, `category`) VALUES ('3', 'blue', 'colour');
INSERT INTO `officaldb`.`variantcode` (`idVariantCode`, `attributes`, `category`) VALUES ('4', 'small', 'size');
INSERT INTO `officaldb`.`variantcode` (`idVariantCode`, `attributes`, `category`) VALUES ('5', 'x-small', 'size');
INSERT INTO `officaldb`.`variantcode` (`idVariantCode`, `attributes`, `category`) VALUES ('6', 'large', 'size');
INSERT INTO `officaldb`.`variantcode` (`idVariantCode`, `attributes`, `category`) VALUES ('7', 'white', 'colour');
INSERT INTO `officaldb`.`variantcode` (`idVariantCode`, `attributes`, `category`) VALUES ('8', 'black', 'colour');
INSERT INTO `officaldb`.`variantcode` (`idVariantCode`, `attributes`, `category`) VALUES ('9', '35', 'size');
INSERT INTO `officaldb`.`variantcode` (`idVariantCode`, `attributes`, `category`) VALUES ('10', '36', 'size');
INSERT INTO `officaldb`.`variantcode` (`idVariantCode`, `attributes`, `category`) VALUES ('11', '37', 'size');
INSERT INTO `officaldb`.`variantcode` (`idVariantCode`, `attributes`, `category`) VALUES ('12', '38', 'size');
INSERT INTO `officaldb`.`variantcode` (`idVariantCode`, `attributes`, `category`) VALUES ('13', '39', 'size');
INSERT INTO `officaldb`.`variantcode` (`idVariantCode`, `attributes`, `category`) VALUES ('14', 'Free Size', 'size');
INSERT INTO `officaldb`.`variantcode` (`idVariantCode`, `attributes`, `category`) VALUES ('15', 'brown', 'colour');
INSERT INTO `officaldb`.`variantcode` (`idVariantCode`, `attributes`, `category`) VALUES ('16', 'nude', 'colour');
INSERT INTO `officaldb`.`variantcode` (`idVariantCode`, `attributes`, `category`) VALUES ('17', 'orange', 'colour');


INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('1', 'clothes', 'Socks & Hosiery', 'Casual Socks');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('2', 'clothes', 'Socks & Hosiery', 'Atheletic Socks');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('3', 'clothes', 'Socks & Hosiery', 'Sheers');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('4', 'clothes', 'Dressses', 'Casual');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('5', 'clothes', 'Dressses', 'Formal');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('6', 'clothes', 'Dressses', 'Cocktail');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('7', 'clothes', 'Tops, Tees & Blouses', 'Blouse & Bottom down shirts');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('8', 'clothes', 'Tops, Tees & Blouses', 'T-shirts');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('9', 'clothes', 'Tops, Tees & Blouses', 'Tanks & Camis');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('10', 'clothes', 'Jeans', 'Jeans');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('11', 'clothes', 'Pants', 'Wear to work');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('12', 'clothes', 'Pants', 'Casual');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('13', 'clothes', 'Pants', 'Night Out');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('14', 'clothes', 'Active', 'Active Shirts & Tees');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('15', 'clothes', 'Active', 'Active Shorts');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('16', 'clothes', 'Active', 'Sports Bra');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('17', 'clothes', 'Skirts', 'Casual');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('18', 'clothes', 'Skirts', 'Work');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('19', 'clothes', 'Skirts', 'Night out');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('20', 'clothes', 'Coats,Jakets & Vest', 'Leather & Faux Leather');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('21', 'clothes', 'Coats,Jakets & Vest', 'Casual');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('22', 'clothes', 'Coats,Jakets & Vest', 'Down Jackets & Parkas');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('23', 'clothes', 'Shorts', 'Casual');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('24', 'clothes', 'Shorts', 'Denim');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('25', 'clothes', 'Jumpsuits, Rompers & Overalls', 'Jumpsuits, Rompers & Overalls');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('26', 'clothes', 'Shoes', 'Sandals');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('27', 'clothes', 'Shoes', 'Pumps');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('28', 'clothes', 'Shoes', 'Flats');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('29', 'clothes', 'Shoes', 'Fashion Sneakers');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('30', 'clothes', 'Shoes', 'Boots');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('31', 'clothes', 'Shoes', 'Loafers & Slip-Ons');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('32', 'clothes', 'Shoes', 'Athletic');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('33', 'clothes', 'Shoes', 'Slippers');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('34', 'clothes', 'Shoes', 'Mules & Clogs');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('35', 'clothes', 'Shoes', 'Oxfords');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('36', 'clothes', 'Shoes', 'Heels');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('37', 'clothes', 'Handbag', 'Tote Bag');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('38', 'clothes', 'Handbag', 'Satchel');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('39', 'clothes', 'Handbag', 'Baguette');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('40', 'clothes', 'Handbag', 'Backpack');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('41', 'clothes', 'Handbag', 'Hobo Bag');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('42', 'clothes', 'Handbag', 'Shoulder Bag');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('43', 'clothes', 'Handbag', 'Sling Bag');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('44', 'clothes', 'Handbag', 'Wristlet');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('45', 'clothes', 'Handbag', 'Beach Bag');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('46', 'clothes', 'Handbag', 'Wallet');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('47', 'expenses', 'Employee Wages', 'Employee Wages');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('48', 'expenses', 'Employee Education Expenses', 'Employee Education Expenses');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('49', 'expenses', 'Employee Benefits', 'Employee Benefits');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('50', 'expenses', 'Rent Expense', 'Rent Expense');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('52', 'expenses', 'Personal Property Taxes', 'Personal Property Taxes');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('53', 'expenses', 'Insurance Premiums', 'Insurance Premiums');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('54', 'expenses', 'Self-Employed Health Insurance', 'Self-Employed Health Insurance');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('56', 'expenses', 'Business Bad Debts', 'Business Bad Debts');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('58', 'expenses', 'Advertising/Marketing Costs', 'Advertising/Marketing Costs');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('59', 'expenses', 'Car and Truck Expenses', 'Car and Truck Expenses');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('60', 'expenses', 'Charitable Contributions', 'Charitable Contributions');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('61', 'expenses', 'Club Dues and Membership Fees', 'Club Dues and Membership Fees');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('62', 'expenses', 'Franchise, Trademark, Trade name', 'Franchise, Trademark, Trade name');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('63', 'expenses', 'Interview expense allowances', 'Interview expense allowances');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('64', 'expenses', 'Legal and professional fees', 'Legal and professional fees');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('65', 'expenses', 'Tax preparation fees', 'Tax preparation fees');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('66', 'expenses', 'License and Permits', 'License and Permits');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('67', 'expenses', 'Penalties and fines', 'Penalties and fines');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('68', 'expenses', 'Repairs', 'Repairs');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('69', 'expenses', 'Subscriptions', 'Subscriptions');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('70', 'expenses', 'Supplies and Materials', 'Supplies and Materials');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('71', 'expenses', 'Utilities', 'Utilities');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('72', 'expenses', 'Telephone', 'Telephone');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('73', 'expenses', 'Depreciable Assets', 'Depreciable Assets');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('74', 'expenses', 'Home Office', 'Home Office');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('75', 'expenses', 'Pension', 'Pension');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('76', 'expenses', 'Client Gifts', 'Client Gifts');
INSERT INTO `officaldb`.`category` (`idCategory`, `sector`, `category`, `subcategory`) VALUES ('77', 'expenses', 'Continuing Education', 'Continuing Education');

