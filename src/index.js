require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");


const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const verifyRoutes = require("./routes/verification");
const walletRoutes = require("./routes/wallet");
const bookingsRoute = require("./routes/bookings");
const paymentsRoute = require("./routes/payments");


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Make io available to routes via app.locals
app.locals.io = io;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.get("/", (_req, res) => {
  res.send("911Command Backend Running");
});

app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/verify", verifyRoutes);
app.use("/wallet", walletRoutes);
app.use("/bookings", bookingsRoute);
app.use("/payments", paymentsRoute);

// admin routes...
app.use("/admin/invite", require("./routes/adminInviteRoutes"));
app.use("/admin", require("./routes/adminResponders"));
app.use("/admin", require("./routes/adminVerification"));
app.use("/admin/wallet", require("./routes/adminWallet"));
app.use("/admin/bookings", require("./routes/adminBookings"));

// responder routes...
app.use("/responder/invite", require("./routes/responderInvite"));
app.use("/responder/onboarding", require("./routes/responderOnboarding"));
app.use("/responder", require("./routes/responderStatus"));
app.use("/responder", require("./routes/responderAuth"));


const PORT = process.env.PORT || 8080;

// IMPORTANT: use server.listen, NOT app.listen
server.listen(PORT, "0.0.0.0", () =>
  console.log("Server running on port " + PORT)
);

io.on("connection", (socket) => {
  console.log("Mobile or Admin connected:", socket.id);

  socket.on("identify", (payload) => {
    try {
      const { type, id } = payload || {};

      if (!type) return;

      if (type === "admin") {
        // admin has global room
        socket.join("admin");
        console.log(`Admin connected → joined room: admin`);
        return;
      }

      if (!id) return; // responders/users must have an ID

      const room = `${type}:${id}`;
      socket.join(room);

      console.log(`Socket ${socket.id} joined room ${room}`);
    } catch (e) {
      console.error("identify error", e);
    }
  });

  socket.on("disconnect", () =>
    console.log("socket disconnected:", socket.id)
  );
});
