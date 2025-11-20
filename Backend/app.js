import express from "express";
import authRouter from "./routes/authRoutes.js";
import trainerRoutes from "./routes/trainerRoutes.js";


const app = express();

app.use(express.json());
app.use('/api/auth', authRouter);
app.use("/api/trainer", trainerRoutes);

export default app;