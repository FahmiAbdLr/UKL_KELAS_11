const jwt = require(`jsonwebtoken`);
const SECRET_KEY = 'jualmakanan';

const authVerify = async(req, res, next) => {
    try{
        const header = req.headers.authorization; // minta token
        if(header == null){  // kalo ga ada token
            return res.status(400).json({
                status: false,
                message: "Unauthorized. Token is not provided"
            })
        } 
        let token = header.split(" ")[1]; // ambil token dari bearer token, ambil elemen kedua
        try {
            let decodedToken;
            decodedToken = jwt.verify(token, SECRET_KEY); // verifikasi token pake secret key
        }

        catch(error){
            if (error instanceof jwt.TokenExpiredError){ // kalau tokennya kadaluwarsa
                return res.status(400).json({
                    status: false,
                    message: "Expired Token",
                    message: error.message,
                });
            }
            return res.status(400).json({ // kalau tokennya salah
                status: false,
                message: "Invalid Token",
                message: error.message,
            });
        }
        next();
    }
    catch(error){
        console.log(error);
        return res.status(400).json({
            status: false,
            message: error.message
        })
    }
}
module.exports = {authVerify};