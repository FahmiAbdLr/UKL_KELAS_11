const foodModel = require (`../models/index`).food;
const Op = require(`sequelize`).Op;
const path = require(`path`);
const fs = require(`fs`);
const upload = require(`./upload-image`).single(`image`);

// Menambah menu makanan
exports.addFood = (request, response) => {
    upload(request, response, async(error) => {
        if (error) { // proses uplaod gagal
            return response.status(400).send({ 
                success: "false", 
                message: error.message  
            });
        }    
        if (!request.file) { // saat tidak ada file yang dimasukkan
            return response.status(400).json({
                success : "false",
                message : "No image provided"
            })
        }
        let newFood = {
            name: request.body.name,
            spicy_level: request.body.spicy_level,
            price: request.body.price,
            image: request.file.filename
        };
        let food = await foodModel.findAll({
            where: {
                [Op.or]: [
                    { name: newFood.name }
                ],
            },
        });
        if ( newFood.name === "" || newFood.spicy_level === "" || newFood.price === "") {
            const oldFoto = newFood.image;
            const patchFoto = path.join(__dirname, `../image`, oldFoto);
            if (fs.existsSync(patchFoto)) { // kalau semua data belum diisi akan error dan image tidak akan di upload
                fs.unlink(patchFoto, (error) => console.log(error.message));
            }
            return response.status(400).json({
                success: false,
                message: "Harap untuk mengisi semua data",
            });
        } else { // membuat akun baru dengan data yang sudah digunakan
            if (food.length > 0) {
                const oldFoto = newFood.image;
                const patchFoto = path.join(__dirname, `../image`, oldFoto);
                if (fs.existsSync(patchFoto)) {
                    fs.unlink(patchFoto, (error) => console.log(error));
                }
                return response.status(400).json({
                    success: false,
                    message: "Nama dan Email sudah digunakan",
                });
            } else { // proses membuat akun baru
                foodModel.create(newFood)
                    .then((result) => {
                        return response.json({
                            success: true,
                            data: result,
                            message: `Data Admin baru berhasil ditambahkan`,
                        });
                    })
                    .catch((error) => {
                        return response.status(400).json({
                            success: false,
                            message: error.message,
                        });
                    });
            }
        }
    })
}

// Menampilkan menu
exports.getAllFood = async (request, response) => {
    let food = await foodModel.findAll()
    if (food.length === 0) {
        return response.status(400).json({
            success: false,
            message: "Tidak ada data food untuk ditampilkan",
        });
    }
    return response.json({
        success: true,
        data: food,
        message: `Semua data food berhasil ditampilkan`
    })
}

// search nama food
exports.searchFood = async (req, res) => {
    foodModel.findAll({ // query untuk mencari data food berdasarkan nama user
        where: {
            [Op.or]: [ // query untuk mencari data food berdasarkan nama user
                { name: { [Op.like]: "%" + req.params.search + "%" } },
                { spicy_level: { [Op.like]: "%" + req.params.search + "%" } },
                { id_food: { [Op.like]: "%" + req.params.id + "%" } }
            ],
        },
    })
        .then((result) => { // jika berhasil
            if (result.length > 0) { // jika data user ditemukan
                res.status(200).json({ // mengembalikan response dengan status code 200 dan data user
                    success: true,
                    message: "Data Food berhasil ditemukan",
                    data: result,
                });
            } else { // jika data user tidak ditemukan
                res.status(400).json({ // mengembalikan response dengan status code 400 dan pesan error
                    success: false,
                    message: "Data Food tidak ditemukan",
                });
            }
        })
        .catch((error) => { // jika gagal
            res.status(400).json({ // mengembalikan response dengan status code 400 dan pesan error
                success: false,
                message: error.message,
            });
        });
}

exports.updateFood = (request, response) => {
    upload(request, response, async (error) => {
        if (error) {
            return response.status(400).json({ message: error });
        }
        let foodID = request.params.id; //user mana yang mau di update
        let getId = await foodModel.findAll({ // dicari usernya
            where: {
                [Op.and]: [{ id_food: foodID }],
            },
        });

        if (getId.length === 0) { // klo ga nemu
            return response.status(400).json({
                success: false,
                message: "Food dengan id tersebut tidak ada",
            });
        }

        let dataFood = { // data terbaru yang udah di update
            name: request.body.name,
            price: request.body.price,
            spicy_level: request.body.spicy_level,
            image: getId.image, // sementara fotonya tetep
        };

        if (request.file) { // klo ternyata ganti foto
            const food = await foodModel.findOne({ //dicari yag mau ganti foto
                where: { id_food: foodID },
            });

            const oldFoto = food.image;
            const patchFoto = path.join(__dirname, `../image`, oldFoto);

            if (fs.existsSync(patchFoto)) {
                fs.unlink(patchFoto, (error) => console.log(error));
            }

            dataFood.image = request.file.filename; //fotonya udah ke update
        }

        if ( dataFood.name === "" || dataFood.price === "" || dataFood.spicy_level === "" ) {
            return response.status(400).json({
                status: false,
                message:
                    "Harap untuk mengisi semua data. Apabila tidak ingin merubah, isi dengan value sebelumnya",
            });
        }

        let food = await foodModel.findAll({
            where: {
                [Op.and]: [
                    { id_food: { [Op.ne]: foodID } },
                    {
                        [Op.or]: [
                            {  name: { [Op.like]: "%" + request.params.search + "%" } }, // cek, nama sama emailnya udah dipake orang lain apa belum
                        ],
                    },
                ],
            },
        });

        if (food.length > 0) { // kalo ternyata udah dipake
            return response.status(400).json({
                status: false,
                message: "Salah satu data food sudah digunakan",
            });
        }

        foodModel.update(dataFood, { where: { id_food: foodID } })
            .then((result) => {
                return response.json({
                    status: true,
                    message: `Data Food berhasil di update`,
                });
            })
            .catch((error) => {
                return response.status(400).json({
                    success: false,
                    message: error.message,
                });
            });
    });
}

exports.deleteFood = async (request, response) => {
    let foodID = request.params.id; //cari user berdasarkan ID

    const food = await foodModel.findOne({ where: { id_food: foodID } }); //data sesuai id nya
    const oldFoto = food.image; //foto lama
    const patchFoto = path.join(__dirname, `../image`, oldFoto); //dicari direktorinya dimana

    if (fs.existsSync(patchFoto)) {
        fs.unlink(patchFoto, (error) => console.log(error));
    }

    foodModel.destroy({ where: { id_food: foodID } })
        .then((result) => {
            return response.json({
                success: true,
                message: `Data Food dengan ID : ` + foodID + ' berhasil dihapus'
            });
        })
        .catch((error) => {
            return response.status(400).json({
                success: false,
                message: error.message,
            });
        });
}