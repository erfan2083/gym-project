import app from "./app.js";

const PORT = process.env.PORT;

app.get("/ping", (req, res) => {
  res.status(200).json({
    message: "✅ Server is reachable!",
    time: new Date().toISOString(),
    ip: req.ip,
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
