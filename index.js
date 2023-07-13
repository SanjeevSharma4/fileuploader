const express = require("express")
const multer = require("multer")
const app = express()
const port = 8989;
const path = require('path');

// controllers
const { uploadFileController } = require("./controller")

app.use(express.json());
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
const upload = multer()
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'home.html'));
});

app.post('/upload_File', upload.single("file"), uploadFileController);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
