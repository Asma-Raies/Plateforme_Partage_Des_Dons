import express   from "express";
import http      from "http";
import cors      from "cors";
import mongoose  from "mongoose";
import dotenv    from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
// Routes
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import donationRoutes from './routes/donationRoutes.js';  // ← corrigé
import associationRoutes from './routes/associationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import reviewRoutes from "./routes/ReviewRoutes.js";
import claimRoutes from "./routes/claimRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { setupSocket, setIO } from "./models/Socket.js";
dotenv.config();

connectDB();

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
const httpServer = http.createServer(app);
const io = setupSocket(httpServer);
setIO(io); 
// ⚠️ RAW BODY en premier — obligatoire pour Stripe webhook
app.use('/api/donations/webhook', express.raw({ type: 'application/json' }));



app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/donations', donationRoutes);  // ← corrigé
app.use('/api/associations', associationRoutes);
app.use('/api/messages', messageRoutes);
app.use("/api/notifications", notificationRoutes);

app.use('/api/reviews', reviewRoutes);
app.use("/api/claims", claimRoutes);
app.get('/', (req, res) => {
  res.json({ message: 'DonationConnect API - 2025' });
});

app.use('/api/users', userRoutes);


mongoose.connect(process.env.MONGO_URI).then(() => {
  httpServer.listen(process.env.PORT || 5000, () => {
    console.log(`✅ Server + WebSocket running on port ${process.env.PORT || 5000}`);
  });
});