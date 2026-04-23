const db = require("../db");

const getCustomers = async ({ whereClause, whereParams, limit, offset }) => {
    const [rows] = await db.query(`
    SELECT c.*, COUNT(b.id) as total_bookings
    FROM customers c
    LEFT JOIN bookings b ON c.id = b.customer_id
    ${whereClause}
    GROUP BY c.id
    ORDER BY c.id DESC
    LIMIT ? OFFSET ?`,
        [...whereParams, limit, offset]
    );
    return rows;
};

const getCustomerById = async (id) => {
    const [rows] = await db.query("Select * from Customers where id = ?", [id]);
    return rows[0] || null;
};

const createCustomer = async ({ full_name, phone, id_card, email }) => {
    await db.query(
        `
        insert into customers (full_name, phone, id_card, email)
        values (?, ?, ?, ?)
        `,
        [full_name, phone, id_card, email]
    );
};


const updateCustomer = async ({ id, full_name, phone, id_card, email }) => {
    await db.query(
        `update customers
        set full_name=?, phone=?, id_card=?, email=?
        where id=?`,
        [full_name, phone, id_card, email, id]
    );
};

const countCustomers = async (whereClause, whereParams) => {
    const [[{ total }]] = await db.query(
        `SELECT COUNT(*) as total FROM customers c
      ${whereClause}`,
        whereParams
    );
    return total;
};

module.exports = {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    countCustomers,
};