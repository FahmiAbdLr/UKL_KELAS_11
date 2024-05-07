const express = require (`express`);
const app = express();
const foodController = require(`../controllers/food.controller`)
const auth = require (`../auth/auth`);

app.use(express.json());

// Admin
app.post('/addFood', auth.authVerify, foodController.addFood)
app.put('/updateFood/:id', auth.authVerify, foodController.updateFood)
app.delete('/deleteFood/:id', auth.authVerify, foodController.deleteFood)

app.get('/getFood', foodController.getAllFood)
app.get('/:search', foodController.searchFood)

module.exports = app;