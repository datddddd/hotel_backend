const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    let token = req.cookies.token;
    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Không có token, quyền truy cập bị từ chối" });
    }

    try {
        const secret = process.env.JWT_SECRET || 'SECRET_KEY';
        const verified = jwt.verify(token, secret);
        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
};