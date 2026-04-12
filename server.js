const express = require('express');
const cors = require('cors');
const verifyToken = require('./middleware/auth');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');


const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api', authRoutes);

// route khác
app.get('/api/rooms', verifyToken, (req, res) => {
    res.json({ message: "test" });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});