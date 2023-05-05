let http = require('http');
let crypto = require('crypto');
let  { exec } = require('child_process');
const express = require('express');
const {createUserFiles} = require("./docs.js");
const app = express();
const dotenv = require("dotenv");
dotenv.config();



const SECRET = process.env.SECRET?process.env.SECRET:'LEOPOLD';

app.use(express.static('public'))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");




app.post("/", (req, res) => {
    req.on("data", chunk=>{
        console.log(chunk)
    })
   
   
      const signature = `sha1=${crypto
        .createHmac('sha1', SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex')}`;

      const isAllowed = req.headers['x-hub-signature'] === signature;
      console.log("allowed : ", isAllowed)
      
        
      const body = req.body;
      //console.log(req.headers)

      const isMaster = body?.ref === 'refs/heads/main';

      if (isAllowed && isMaster) {
        console.log("allowed")
        const { exec } = require('child_process');

        exec('../launch.sh', (error, stdout, stderr) => {
        if (error) {
            console.error(`error: ${error.message}`);
            return;
        }

        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }

        console.log(`stdout:\n${stdout}`);
        });
      }
     
      res.end();

    });

app.get("/register", (req, res)=>{
    res.render("index", {message: null});
})


app.post("/register", async(req, res)=>{
    if(!!req.body.email==false)res.json({message: "no email"});
    let m  = await createUserFiles(req.body.email);
    res.render('index', {message: m.message});
    //res.json({message: "done"});
})

app.get("/docs", async(req, res)=>{
  
  res.render('docs');
 
})

 app.listen(4000, ()=>console.log("webhook listens on port 4000..."));