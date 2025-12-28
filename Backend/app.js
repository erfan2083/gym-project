import express from "express";
import authRouter from "./routes/authRoutes.js";
import trainerRoutes from "./routes/trainerRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chatRouter from "./routes/chatRoutes.js";


const app = express();

app.use(express.json());
app.use('/api/auth', authRouter);
app.use("/api/trainer", trainerRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRouter);


export default app;