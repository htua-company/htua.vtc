const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

app.use("/css", express.static(path.join(__dirname, "../css")));
app.use("/js", express.static(path.join(__dirname, "../js")));
app.use("/images", express.static(path.join(__dirname, "../images")));
app.use("/favicon.ico", express.static(path.join(__dirname, "../favicon.ico")));

app.use(express.static(path.join(__dirname, "../"), { extensions: ["html"] }));

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "../", "404.html"));
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});