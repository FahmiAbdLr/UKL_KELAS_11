const express = require(`express`)
const app = express()
const cors = require(`cors`)

app.use(cors())

const adminRoute = require (`./routes/admin.route`);
const foodRoute = require (`./routes/food.route`);
const orderListRoute = require (`./routes/order.route`)

app.use(`/admin`, adminRoute)
app.use(`/food`, foodRoute)
app.use(`/order`, orderListRoute)
    
app.listen(8000, () => {
    console.log("Server run on port 8000");
})