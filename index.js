console.log("node.js started");

const express = require('express');
const app = express();
const PORT = 3000;

const listener = app.listen(PORT, () => {
    console.log("port: %d", listener.address().port);
});

app.use(express.static('build'));
app.get("/test", (req, res) => {
    res.contentType('html');
    res.status(200).sendFile(__dirname + '/test/index.html');
    console.log("GET: test/index.html is released");
});
