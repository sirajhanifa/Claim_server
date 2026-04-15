const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const app = express();

// -----------------------------------------------------------------------------------------------------------------

require('dotenv').config({ quiet: true });

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// -----------------------------------------------------------------------------------------------------------------

// Models

require('./models/user')
require('./models/claimtype')
require('./models/staffmanage')
require('./models/claimEntry')

// -----------------------------------------------------------------------------------------------------------------

// mongoose.connection.once('open', async () => {
//   const Staff = require('./models/staffmanage');
//   await Staff.deleteMany({});
//   console.log("Staff records cleared");
// });

// -----------------------------------------------------------------------------------------------------------------

// Routes

const login = require('./routes/userRoutes')
const staffmanage = require('./routes/staffRoutes')
const claimmanage = require('./routes/claimManageRoute')
const claimentry = require('./routes/claimEntryRoute')
const cliamReport = require('./routes/claimReport')
const Setting = require('./routes/settingRoute')
const Dashboard = require('./routes/dashboardRoute')
const PaymentProcess = require('./routes/paymentProcess')
const adminPaymentStatusRoutes = require("./routes/adminPaymentStatus")
const adminMaintenanceRoutes = require("./routes/adminMaintenanceRoutes")

// -----------------------------------------------------------------------------------------------------------------

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

// -----------------------------------------------------------------------------------------------------------------

// Routes

app.use('/api', login)
app.use('/api', claimmanage)
app.use('/api/staff', staffmanage)
app.use('/api', claimentry)
app.use('/api', cliamReport)
app.use('/api', Setting)
app.use('/api', Dashboard)
app.use('/api/finance', PaymentProcess)
app.use('/api/admin/payment-status', adminPaymentStatusRoutes);
app.use("/api/admin/maintenance", adminMaintenanceRoutes);

// -----------------------------------------------------------------------------------------------------------------

// Start server

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
 
// -----------------------------------------------------------------------------------------------------------------
