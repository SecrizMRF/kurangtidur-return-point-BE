const ctrl = require("../services/rpServices")

async function getItemsByType(req, res) {
    try {
        const { type } = req.query;
        let items;
        
        if (type === 'found') {
            items = await ctrl.getFoundItems();
        } else if (type === 'lost') {
            items = await ctrl.getLostItems();
        } else {
            return res.status(400).json({
                status: "error",
                code: 400,
                message: "Invalid type parameter. Use 'found' or 'lost'"
            });
        }
        
        res.status(200).json({
            status: "success",
            code: 200,
            message: "ok jalan",
            data: items
        });
    } catch (err) {
        res.status(500).json({
            status: "gagal",
            code: 500,
            message: err.message
        });
    }
}

async function getFoundItems(req, res) {
    try {
        const items = await ctrl.getFoundItems()
        res.status(200).json({
            status: "success",
            code: 200,
            message: "ok jalan",
            data: items
        })
    } catch (err) {
        res.status(500).json({
            status: "gagal",
            code: 500,
            message: err.message
        })
    }
}

async function getLostItems(req, res) {
    try {
        const items = await ctrl.getLostItems()
        res.status(200).json({
            status: "success",
            code: 200,
            message: "ok jalan",
            data: items
        })
    } catch (err) {
        res.status(500).json({
            status: "gagal",
            code: 500,
            message: err.message
        })
    }
}

async function addItem(req, res) {
    try {
        const newItem = await ctrl.addItem(req.body)
        res.status(201).json({
            status: "success",
            code: 201,
            message: "ok jalan",
            data: newItem
        })
    } catch (err) {
        res.status(500).json({
            status: "gagal",
            code: 500,
            message: err.message
        })
    }
}

async function updateItem(req, res) {
    try {
        const updatedItem = await ctrl.updateItem(req.params.id, req.body)
        if(!updatedItem) return res.status(404).json({status: 'error', message: 'Barang tidak ditemukan'})
        res.json({status: 'sukses', data: updatedItem})
    } catch (err) {
        res.status(500).json({
            status: 'gagal',
            code: 500,
            message: err.message
        })
    }
}

async function deleteItem(req, res){
    try {
        const deletedItem = await ctrl.deleteItem(req.params.id)
        if(!deletedItem) return res.status(404).json({status: 'error', message: 'Barang tidak ditemukan'})
        res.json({status: 'sukses', data: deletedItem})
    } catch (err) {
        res.status(500).json({
            status: 'gagal',
            code: 500,
            message: err.message
        })
    }
}

module.exports = {getFoundItems, getLostItems, addItem, updateItem, deleteItem, getItemsByType }