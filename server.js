
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const mysql = require('mysql')
const fileUpload = require('express-fileupload');
const config = require('config');

const app = express()

const customers = require("./Routes/customers")
const expenses = require("./Routes/expenses")
const category = require("./Routes/category")
const variantCode = require("./Routes/variantCode")
const parentProduct = require("./Routes/parentProduct")
const variantProduct = require("./Routes/variantProduct")
const order_details = require("./Routes/order_details")
const orders = require("./Routes/orders")
const suppliers = require("./Routes/suppliers")
const user = require("./Routes/user")
const incomingOrders = require("./Routes/incomingOrders")
const incomingOrderProduct = require("./Routes/incomingOrderProduct")
const orderAnalysis = require("./Routes/Analysis/orderAnalysis")
const productAnalysis = require("./Routes/Analysis/productAnalysis")
const incomingOrderAnalysis = require("./Routes/Analysis/incomingOrderAnalysis")
const customerAnalysis = require("./Routes/Analysis/customerAnalysis")
const financialAnalysis = require("./Routes/Analysis/financialAnalysis")
const auth = require("./Routes/auth")
//Bodyparser Middleware
app.use("/uploads",express.static("uploads"))
app.use(bodyParser.json())
app.use(fileUpload());


//production
app.use(express.static('client/build'));


app.use("/api/customers",customers)
app.use("/api/expenses",expenses)
app.use("/api/category",category)
app.use("/api/variantCode",variantCode)
app.use("/api/parentProduct",parentProduct)
app.use("/api/variantProduct",variantProduct)
app.use("/api/order_details",order_details)
app.use("/api/orders",orders)
app.use("/api/suppliers",suppliers)
app.use("/api/user",user)
app.use("/api/incomingOrders",incomingOrders)
app.use("/api/incomingOrderProduct",incomingOrderProduct)
app.use("/api/analysis/products",productAnalysis)
app.use("/api/analysis/orders",orderAnalysis)
app.use("/api/analysis/incomingOrders",incomingOrderAnalysis)
app.use("/api/analysis/customers",customerAnalysis)
app.use("/api/analysis/financial",financialAnalysis)
app.use("/api/auth",auth)

//production

app.get('*', (req, res) => {
	res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
	});



//const PORT = process.env.PORT || 5000;

const PORT = process.env.PORT || 8080;

app.listen(PORT, ()=>console.log(`Server started on port ${PORT}`))

		