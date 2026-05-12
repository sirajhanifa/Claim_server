const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const app = express();
const Academic = require('./models/academic')
const ClaimEntry = require('./models/claimEntries')
const User = require('./models/user');
const jwt = require('jsonwebtoken');

// -----------------------------------------------------------------------------------------------------------------

require('dotenv').config({ quiet: true });

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// -----------------------------------------------------------------------------------------------------------------

// mongoose.connection.once('open', async () => {
//   const Staff = require('./models/staffmanage');
//   await Staff.deleteMany({});
//   console.log("Staff records cleared");
// });

// -----------------------------------------------------------------------------------------------------------------

// Routes

const user = require('./routes/userRoutes')
const staffManage = require('./routes/staffManageRoutes')
const claimManage = require('./routes/claimManageRoutes')
const claimEntry = require('./routes/claimEntryRoutes')
const dashboard = require('./routes/dashboardRoutes')
const academicManage = require('./routes/academicRoutes')
const financeProcessing = require('./routes/financeProcessRoutes')
const dataDeletion = require('./routes/dataDeletionRoutes')
const claimSubmission = require('./routes/claimSubmissionRoutes')
const paymentProcess = require('./routes/paymentProcessRoutes')

// -----------------------------------------------------------------------------------------------------------------

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

// -----------------------------------------------------------------------------------------------------------------

// Routes

app.use('/api', user)
app.use('/api', claimManage)
app.use('/api/staff', staffManage)
app.use('/api', claimEntry)
app.use('/api', dashboard)
app.use('/api/finance', paymentProcess)
app.use('/api', academicManage);
app.use('/api', dataDeletion);
app.use('/api', claimSubmission);
app.use('/api', financeProcessing);

// -----------------------------------------------------------------------------------------------------------------

app.get('/claimDatas', async (req, res) => {
    try {
        const currAcademic = await Academic.findOne({ active_sem: true });
        const entries = await ClaimEntry.find({ academic_sem_label: currAcademic.academic_sem_label }).sort({ createdAt: -1 });
        res.json(entries);
    } catch (error) {
        console.error('Error fetching claim entries : ', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// -----------------------------------------------------------------------------------------------------------------


app.post('/api/login', async (req, res) => { 

    try {
        const { username, password } = req.body;
        const secretKey = process.env.JWT_SECRET;
        const user = await User.findOne({ username });
        if (!user) { return res.status(404).json({ message: 'User not found' }) }
        if (user.password !== password) { return res.status(401).json({ message: 'Incorrect password' }) }
        const token = jwt.sign({ username: user.username }, secretKey, { expiresIn: '1h' });
        return res.status(200).json({
            message: 'Login successful!',
            token, user: {
                id: user._id,
                username: user.username,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// -----------------------------------------------------------------------------------------------------------------


// Start server

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// -----------------------------------------------------------------------------------------------------------------
