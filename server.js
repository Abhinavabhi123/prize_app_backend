require("dotenv").config();
const http = require("http");
const socketIo = require("socket.io");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const helmet = require("helmet");
const path = require("path");

const connectDB = require("./database/db");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const scheduleEliminations = require("./utils/eliminationScheduler");
const schedulePickWinner = require("./utils/pickWinnerScheduler");
const scheduleLuckyDrawStart = require("./utils/startLuckyDrawScheduler");

const initializeSocket  = require("./socket");

const app = express();

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

// Initialize socket connection

connectDB();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: process.env.CORS_METHODS,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static("./uploads"));
app.use(express.static(path.join(__dirname, "uploads")));
app.use(cookieParser());

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(morgan("dev"));

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.use("/admin/", adminRoutes);
app.use("/", userRoutes);


server.listen(PORT, () => {
  scheduleLuckyDrawStart();
  scheduleEliminations();
  schedulePickWinner();
  console.log(`Server running at port ${PORT} ⚡⚡`);
});


const io = initializeSocket(server);