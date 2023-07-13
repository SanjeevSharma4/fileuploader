const express = require('express');
const app = express();
const port = 8989;
const path = require('path');
const multer = require('multer');
const fs = require('fs-extra');
const bodyParser = require('body-parser');


const cors = require('cors');
app.use(cors());
app.use(express.json());
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.use(bodyParser.json());

const getFinalChunk = (req) => {
  return req.body.finalchunk === 'true';
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // console.log(typeof(getFinalChunk(req)),getFinalChunk(req)
    if (getFinalChunk(req)) {
      //cb(null, 'uploads/');
    } else {

      // cb(null, 'temp/');
    }
  },
  filename: function (req, file, cb) {
    if (req.body.finalchunk) {
      cb(null, req.body.name);
    } else {
      cb(null, Date.now() + '-' + file.originalname);
    }
  }
});
//const upload = multer({ storage: storage });
const upload = multer();

app.post('/upload_File', upload.single('file'), async (req, res) => {
  //console.log(req.file, '|   -   |',req.body.finalchunk)
  if (fs.existsSync(`./temp/${req.body.name}`) && parseInt(req.body.counter)===1) {
    const stats = fs.statSync(`./temp/${req.body.name}`);
    res.send({ Uploaded: true, File_Size: stats.size });

  } else {
       let _Is_Final_Chnuk = req.body.finalchunk;
    if (_Is_Final_Chnuk === 'true') {
      let returnValue = await _Read_Write_File(true, 'uploads', req.file, req.body);
      if (returnValue) {
        res.send({ Uploaded: true, File_Size: 0 }); // in if send 0 for next file because buffer will start from 0;
      }
    } else {
      let returnValue = await _Read_Write_File(false, 'temp', req.file, req.body);
      if (returnValue) { //send Object 
        const stats = fs.statSync(`./temp/${req.body.name}`);
        res.send({ Uploaded: true, File_Size: stats.size });
        // in else send file size to read next chunk in frontend
      }
    }
}

});
async function _Read_Write_File(_Last_Chunck, path, file, Chunk_Info) { // 1. send chunck 2.>> finalChunk or just_ _Chunk ?
  // console.log(boolan, path, file, Chunk_Info)
  return await new Promise((resolve, reject) => {
    let _File_In_Temp = `./temp/${Chunk_Info.name}`;
    if (fs.existsSync(_File_In_Temp)) {
      fs.readFile(_File_In_Temp, (err, data) => {
        if (err) {
          console.error('_____------>>>> ||||  Error reading chunk file:', err);
          reject(err);
          return;
        }
        // Get the size of the chunk file
        const updatedData = Buffer.concat([data, file.buffer]); // data from file buffer from file added in updatedDAta
        // Save the chunk file  _Agian_
        fs.writeFile(`./${path}/${Chunk_Info.name}`, updatedData, (err) => { // save new file ,Accordingly given path
          if (err) {
            console.error('Error saving chunk file >>>>>>>>_______>>>>>>>:');
            reject(err);
            return;
          }
          console.log('Chunk saved successfully with buffer', _Last_Chunck);//E:\React Assignments\Upload Video\temp
          if (_Last_Chunck) {// Check if it is last part of file than delete that name file form temp
            console.log('Inside_Last Chunk', _Last_Chunck);
            _Delete_Temp_File(`./temp/${Chunk_Info.name}`);  // call function to  Delete file from temp if that was the last chunk of file
          }
          resolve(true);
        });
      });


    } else {

      fs.writeFile(`./temp/${Chunk_Info.name}`, file.buffer, (err) => {  // if file is not in temp , it is first buffer of file

        if (err) {
          console.error(' >>> New or First Chunk Error saving chunk file:');
          reject(err);
          return;
        }
        console.log(`/temp/}/${Chunk_Info.name},' first  chunk saved '`);   
        resolve(true); // first buffer is saved
      });

    }
  });
}

function _Delete_Temp_File(File_Name_Path) { 
  fs.unlink(File_Name_Path, (err) => { //  deleteing using  unlink from temp 
    console.log('File_Name_Path Chunk', File_Name_Path, "<> <> ----");
    if (err) {
      console.error('Error deleting file:', err);
      return;
    }
    console.log('File deleted successfully');
  });
}

app.get('/All_Videos_req', (req, res) => {
 // console.log(req.body.Video_Url_," Req comes from -> -> ")
  const uploadPath = path.join(__dirname, 'uploads');
  fs.readdir(uploadPath, (err, files) => {
    if (err) {
      console.error('Error reading upload folder:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    const videos = [];
    files.forEach((file) => {
      const filePath = path.join(uploadPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        const video = {
          name: file,
          path: filePath,
          size: stats.size,
        };
 videos.push(video);
      }
    });
    res.json(videos);
  });
});

app.post('/_Stream_Video_req', (req, res) => {
 const videoFilePath = req.body.url;

 const range = req.headers.range
    const videoPath = videoFilePath;
    const videoSize = fs.statSync(videoPath).size
    const chunkSize = 1 * 1e6;
    const start = Number(range.replace(/\D/g, ""))
    const end = Math.min(start + chunkSize, videoSize - 1)
    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4"
    }
    res.writeHead(206, headers)
    const stream = fs.createReadStream(videoPath, {
        start,
        end
    })
    stream.pipe(res)
});

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'home.html'));
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});