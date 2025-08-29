import express from "express";
import dotenv from "dotenv";
dotenv.config({ debug: false });
import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import geminiResponse from "./gemini.js";

const app = express();
const allowedOrigins = [
  "http://localhost:5173",  
  "https://virtual-assistant-c7tk.onrender.com"];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

const port = process.env.PORT || 5000;


const startServer = async () => {
  try {
    await connectDb();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect DB", err);
    process.exit(1);
  }
};

startServer();

// (Optional) Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something broke!" });
});
