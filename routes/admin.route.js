const express = require (`express`);
const app = express();
const adminController = require (`../controllers/admin.controller`);
const auth = require (`../auth/auth`);

app.use(express.json());

app.post('/registerAdmin', adminController.registerAdmin);
app.post('/login', adminController.loginAdmin);

// Admin
app.get('/getAdmin', auth.authVerify, adminController.getAllAdmin)
app.put('/updateAdmin/:id', auth.authVerify, adminController.updateAdmin)
app.delete('/deleteAdmin/:id', auth.authVerify, adminController.deleteAdmin)

module.exports = app;