const adminModel = require (`../models/index`).admin;
const md5 = require (`md5`);
const jwt = require (`jsonwebtoken`);
const SECRET_KEY = 'jualmakanan';
const Op = require(`sequelize`).Op;
const path = require(`path`);
const fs = require(`fs`);
const upload = require(`./upload-image`).single(`image`);

// registrasi admin jika belum punya akun
exports.registerAdmin = async (request, response) => {
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
        let newAdmin = {
            image: request.file.filename,
            name: request.body.name,
            email: request.body.email,
            password: md5(request.body.password)
        };
        let admin = await adminModel.findAll({
            where: {
                [Op.or]: [
                    { name: newAdmin.name }, 
                    { email: newAdmin.email }
                ],
            },
        });
        if ( newAdmin.name === "" || newAdmin.email === "" || newAdmin.password === "") {
            const oldFoto = newAdmin.image;
            const patchFoto = path.join(__dirname, `../image`, oldFoto);
            if (fs.existsSync(patchFoto)) { // kalau semua data belum diisi akan error dan image tidak akan di upload
                fs.unlink(patchFoto, (error) => console.log(error.message));
            }
            return response.status(400).json({
                success: false,
                message: "Harap untuk mengisi semua data",
            });
        } else { // membuat akun baru dengan data yang sudah digunakan
            if (admin.length > 0) {
                const oldFoto = newAdmin.image;
                const patchFoto = path.join(__dirname, `../image`, oldFoto);
                if (fs.existsSync(patchFoto)) {
                    fs.unlink(patchFoto, (error) => console.log(error));
                }
                return response.status(400).json({
                    success: false,
                    message: "Nama dan Email sudah digunakan",
                });
            } else { // proses membuat akun baru
                adminModel.create(newAdmin)
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

exports.loginAdmin = async (request, response) => {
    try {
        const {email, password} = request.body;
        if (!email || !password) { // jika email dan password tidak diisi
            return response.status(400).json({
                message: "Mohon untuk mengisi email dan password"
            });
        }
        const hashedPassword = md5(password); // mengubah format password
        const findData = await adminModel.findOne({ where: {
            email: email, 
            password: hashedPassword
        }});
        if (!findData) { // jika data tidak ditemukan
            return response.status(400).json({
                message: "Gagal untuk login"
            });
        }
        let createToken = {
            id_admin: findData.id_admin,
            name: findData.name,
            email: findData.email
        }
        createToken = JSON.stringify(createToken);
        var token = jwt.sign(createToken, SECRET_KEY);
        return response.status(200).json({
            success: true,
            message: 'Anda berhasil login sebagai admin',
            data: {
                id_admin: findData.id_admin,
                name: findData.name,
                email: findData.email,
                token: token
            }
        });
    } catch (error) {
        return response.status(400).json({
            success: false,
            status: 'Kesalahan saat proses login',
            message: error.message
        })
    }
}

exports.getAllAdmin = async (request, response) => {
    let admin = await adminModel.findAll()
    if (admin.length === 0) {
        return response.status(400).json({
            success: false,
            message: "Tidak ada data admin untuk ditampilkan",
        });
    }
    return response.json({
        success: true,
        data: admin,
        message: `Semua data admin berhasil ditampilkan`
    })
}

exports.updateAdmin = (request, response) => {
    upload(request, response, async (error) => {
        if (error) {
            return response.status(400).json({ message: error });
        }
        let adminID = request.params.id; //user mana yang mau di update
        let getId = await adminModel.findAll({ // dicari usernya
            where: {
                [Op.and]: [{ id_admin: adminID }],
            },
        });

        if (getId.length === 0) { // klo ga nemu
            return response.status(400).json({
                success: false,
                message: "Admin dengan id tersebut tidak ada",
            });
        }

        let dataAdmin = { // data terbaru yang udah di update
            name: request.body.name,
            email: request.body.email,
            image: getId.image, // sementara fotonya tetep
        };

        if (request.file) { // klo ternyata ganti foto
            const selectedAdmin = await adminModel.findOne({ //dicari yag mau ganti foto
                where: { id_admin: adminID },
            });

            const oldFotoAdmin = selectedAdmin.image;
            const patchFoto = path.join(__dirname, `../image`, oldFotoAdmin);

            if (fs.existsSync(patchFoto)) {
                fs.unlink(patchFoto, (error) => console.log(error));
            }

            dataAdmin.image = request.file.filename; //fotonya udah ke update
        }

        if ( dataAdmin.name === "" || dataAdmin.email === "" || dataAdmin.password === "" ) {
            return response.status(400).json({
                status: false,
                message:
                    "Harap untuk mengisi semua data. Apabila tidak ingin merubah, isi dengan value sebelumnya",
            });
        }

        let admin = await adminModel.findAll({
            where: {
                [Op.and]: [
                    { id_admin: { [Op.ne]: adminID } },
                    {
                        [Op.or]: [
                            { name: dataAdmin.name }, // cek, nama sama emailnya udah dipake orang lain apa belum
                            { email: dataAdmin.email },
                        ],
                    },
                ],
            },
        });

        if (admin.length > 0) { // kalo ternyata udah dipake
            return response.status(400).json({
                status: false,
                message: "Nama dan Email pengguna sudah digunakan",
            });
        }

        adminModel.update(dataAdmin, { where: { id_admin: adminID } })
            .then((result) => {
                return response.json({
                    status: true,
                    message: `Data Pengguna berhasil di update`,
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

exports.deleteAdmin = async (request, response) => {
    let adminID = request.params.id; //cari user berdasarkan ID

    const admin = await adminModel.findOne({ where: { id_admin: adminID } }); //data sesuai id nya
    const oldFotoAdmin = admin.image; //foto lama
    const patchFoto = path.join(__dirname, `../image`, oldFotoAdmin); //dicari direktorinya dimana

    if (fs.existsSync(patchFoto)) {
        fs.unlink(patchFoto, (error) => console.log(error));
    }

    adminModel.destroy({ where: { id_admin: adminID } })
        .then((result) => {
            return response.json({
                success: true,
                message: `Data Admin dengan ID : ` + adminID + ' berhasil dihapus'
            });
        })
        .catch((error) => {
            return response.status(400).json({
                success: false,
                message: error.message,
            });
        });
}