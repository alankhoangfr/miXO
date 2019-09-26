
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const mysql = require('mysql')
const fileUpload = require('express-fileupload');

const app = express()

const customers = require("./Routes/customers")
const variantCode = require("./Routes/variantCode")
const parentProduct = require("./Routes/parentProduct")
const variantProduct = require("./Routes/variantProduct")
const order_details = require("./Routes/order_details")
const orders = require("./Routes/orders")
const suppliers = require("./Routes/suppliers")
const user = require("./Routes/user")
const incomingOrders = require("./Routes/incomingOrders")
const incomingOrderProduct = require("./Routes/incomingOrderProduct")


//Bodyparser Middleware
app.use("/uploads",express.static("uploads"))
app.use(bodyParser.json())
app.use(fileUpload());


//production
app.use(express.static('client/build'));


app.use("/api/customers",customers)
app.use("/api/variantCode",variantCode)
app.use("/api/parentProduct",parentProduct)
app.use("/api/variantProduct",variantProduct)
app.use("/api/order_details",order_details)
app.use("/api/orders",orders)
app.use("/api/suppliers",suppliers)
app.use("/api/user",user)
app.use("/api/incomingOrders",incomingOrders)
app.use("/api/incomingOrderProduct",incomingOrderProduct)


//production

app.get('*', (req, res) => {
	res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
	});



//const PORT = process.env.PORT || 5000;


//Production
const PORT = process.env.PORT || 8080;

app.listen(PORT, ()=>console.log(`Server started on port ${PORT}`))

		