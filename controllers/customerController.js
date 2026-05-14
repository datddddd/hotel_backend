const customerService = require("../services/customerService");

// GET ALL
exports.getAllCustomers = async (req, res) => {
    try {
        const result = await customerService.getAllCustomers(req.query);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCustomerById = async (req, res) => {
    try {
        const customer = await customerService.getCustomerById(req.params.id);
        if (!customer)
            return res.status(404).json({ message: "Không tìm thấy khách hàng" });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createCustomer = async (req, res) => {
    try {
        await customerService.createCustomer(req.body);
        res.status(201).json({ message: "Khách hàng đã được tạo thành công" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        await customerService.updateCustomer({ ...req.body, id: req.params.id });
        res.json({ message: "Khách hàng đã được cập nhật thành công" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        await customerService.deleteCustomer(id);
        res.json({ message: "Xóa khách hàng thành công" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

