const OrderList = require ('../models/index').order_list;
const OrderDetail = require ('../models/index').order_detail;

// Fungsi untuk menambahkan transaksi baru
exports.createOrder = async (req, res) => {
    try {
        const { customer_name, table_number, order_date, order_detail } = req.body;

        // Buat transaksi baru di tabel "order list"
        const orderList = await OrderList.create({
            customer_name,
            table_number,
            order_date
        });

        // Simpan detail transaksi ke dalam tabel "order detail"
        await Promise.all(order_detail.map(async (detail) => {
            await OrderDetail.create({
                id_food: detail.id_food,
                price: detail.price,
                quantity: detail.quantity
            });
        }));

        res.status(201).json({
            status: true,
            data: {
                id_order: orderList.id_order,
                customer_name: orderList.customer_name,
                table_number: orderList.table_number,
                order_date: orderList.order_date,
                createdAt: orderList.createdAt,
                updatedAt: orderList.updatedAt
            },
            message: 'Order list has been created'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ status: false, message: 'Failed to create order list' });
    }
};

exports.getAllOrder = async (req, res) => {
    try {
        // Ambil semua data dari tabel "order list"
        const orders = await OrderList.findAll();

        // Ambil semua data dari tabel "order detail"
        const orderDetails = await OrderDetail.findAll();

        // Gabungkan data dari kedua tabel berdasarkan order_id
        const mergedOrders = orders.map(order => {
            const details = orderDetails.filter(detail => detail.order_id === order.id_order_detail); // Sesuaikan id_order dengan field yang digunakan dalam model Anda
            return {
                id_order: order.id_order,
                customer_name: order.customer_name,
                table_number: order.table_number,
                order_date: order.order_date,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                order_detail: details.map(detail => ({
                    id_order_detail: detail.id_order_detail,
                    id_food: detail.id_food,
                    quantity: detail.quantity,
                    price: detail.price,
                    createdAt: detail.createdAt,
                    updatedAt: detail.updatedAt
                }))
            };
        });

        res.json({
            status: true,
            data: mergedOrders
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ status: false, message: 'Gagal mengambil daftar pesanan' });
    }
};