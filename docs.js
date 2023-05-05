
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
var Stream= require('stream');

const { google } = require('googleapis');
const {authenticate} = require('@google-cloud/local-auth');
const dotenv = require("dotenv");
dotenv.config();

let fileId = process.env.USERS_FILE_LIST;
let folder= process.env.COMMON_FOLDER;
const SCOPES = ['https://www.googleapis.com/auth/drive'];


class ReadableString extends Stream.Readable {
 
  
    constructor( str) {
      super();
      this.str = str;
      this.sent = false;
    }
  
    _read() {
      if (!this.sent) {
        this.push(Buffer.from(this.str));
        this.sent = true
      }
      else {
        this.push(null)
      }
    }
  }


  class Drive{
    constructor(file){
        this.setFile(file)
    }

    setFile(id){
        this.fileId=id;
        return this;
    }
    

    async init(){
        this.drive = await getAccountDriveService();
        return this;
    }

    async createDocs(text, name="file"){
        const s = new ReadableString(text);
        return await this.drive.files.create(
            {   
                fields: '*',
                media: {
                    mimeType: 'text/plain',
                    body: s,
                },
                requestBody: {
                    name: name,
                    mimeType: 'application/vnd.google-apps.document',
                    //file needs to be shared with service account address
                    parents: [folder],
                }}
                );
    }

    async readDocs(){
        const { data: prevContent } = await this.drive.files.export({
            fileId: this.fileId,
            mimeType: 'text/plain',
          });
     
        return prevContent;
    }

    async updateDocs(content){
        const media = {
            mimeType: 'text/plain',
            body: content,
          };
          
          return await this.drive.files.update({
            fileId: this.fileId,
            media,
          });
    }

    async setPermission(role, email){
       return  await this.drive.permissions.create({
            fileId: this.fileId,
            sendNotificationEmail: false,
            requestBody: {
            role: role,
            type: 'user',
            emailAddress: email
            },
        });
    }

    async createFolder(name){
        return await this.drive.files.create(
            {   
                fields: '*',
           
              requestBody: {
                name: name,
                mimeType: 'application/vnd.google-apps.folder',
                //file needs to be shared with service account address
                parents: [folder],
              }}
        )
    }
  }



async function  getAccountDriveService(){
    const credentialFilename = path.join(__dirname, "serviceAccountCredentials.json");
  
    const auth = new google.auth.GoogleAuth({keyFile: credentialFilename, scopes: SCOPES});
    const drive = google.drive({ version: "v3", auth });

    return drive;
  
  }


 


  

async function addUser(obj){
    let drive = await getAccountDriveService();
    const { data: prevContent } = await drive.files.export({
        fileId: this.fileId,
        mimeType: 'text/plain',
        });
    
    let e = JSON.parse(prevContent.trim());

    if(e.users.filter(u=>u.EMAIL==obj.EMAIL)){
        return "user already exists";
    }
    e.users.push(obj);


    const media = {
        mimeType: 'text/plain',
        body: JSON.stringify(e),
      };
      
      await drive.files.update({
        fileId,
        media,
      });

      return "user added";
        
  }



  async function createUserFiles(email="leopoldbiomen@gmail.com"){
    //CATALOGUE_BIO_TRASH
    //ID_SERVER_FILE
    //ID_FIELDS_FILE
    //CATALOGUE_BIO
    console.log("createUserFiles");
    let drive = new Drive();
    await drive.init();
    drive.setFile(fileId);
    let content = await drive.readDocs();
    content = JSON.parse(content.trim());

    if(content.users.filter(u=>u.EMAIL==email).length>0){
        console.log("user already exists");
        return {message: "user already exists"};
       
    }
    


    let CATALOGUE_BIO_TRASH = await drive.createFolder("CATALOGUE_BIO_TRASH");
    

    let CATALOGUE_BIO = await drive.createFolder("CATALOGUE_BIO");
    

    let ID_SERVER_FILE = await drive.createDocs("http://64.226.73.130:10000/", "server_name");
    console.log(ID_SERVER_FILE);
    

    //console.log(JSON.stringify({fields: [{"name":"GOOGLE","value":"Étymologie. Le terme soupe vient du latin tardif suppa, « tranche de pain sur laquelle on verse le bouillon », sens que le mot avait jusqu'au XVI e siècle et que l'on retrouve dans des expressions archaïques comme « tailler la soupe », « tremper la soupe » ou « trempé comme une soupe »"},{"value":"ingrédients issus de l'agriculture biologique","name":"IMPORTANT"},{"value":"phrase d'accroche sur le produit\nfabrication (si pertinent)\nutilisation\nOrigine\nbienfaits sous forme de liste à puces\nconclusion sympathique\nPrésentation de la Marque à la troisième personne","name":"SCHEMA"},{"value":"Soupe onctueuse","name":"GOUT"},{"name":"DESCRIPTION_MARQUE","value":"Pour atteindre notre finalité, nous nous sommes constitués en une coopérative de salariés. Notre engagement dans l’économie sociale facilite les liens avec les producteurs : nous partageons les mêmes valeurs coopératives. C’est une entreprise où les personnes et le travail priment sur le capital. Ce modèle permet aux salariés de détenir un po"}], suggestions: [], promptTemplate: "Produit : {\nTitre : [DESIGNATION]\nListe des ingrédients : [INGREDIENTS]\nOrigine:[GOOGLE]\nMarque : [MARQUE]}\n\n\nRôle : Imagine que tu es un expert en SEO depuis plus de 20 ans. Tu es spécialisé dans les fiches produits pour les commerces alimentaires.\n\n\nPour chacun des produits, rédige une Description du produit à partir des informations données avec un style convivial et adapté au SEO. Maximum 500 tokens. Insiste sur [IMPORTANT] Adopte le point de vue du vendeur sans jamais le citer. Parle de la marque uniquement dans la partie Description de la [MARQUE].  N'utilise pas pas \"notre\" mais \"ce\". \nUtilise une lettre majuscule à chaque début de phrase.\nParle de la [GOUT].\nSuis la structure suivante :\n[SCHEMA]" }));
    let ID_FIELDS_FILE = await drive.createDocs(JSON.stringify({fields: [{"name":"GOOGLE","value":"Étymologie. Le terme soupe vient du latin tardif suppa, « tranche de pain sur laquelle on verse le bouillon », sens que le mot avait jusqu'au XVI e siècle et que l'on retrouve dans des expressions archaïques comme « tailler la soupe », « tremper la soupe » ou « trempé comme une soupe »"},{"value":"ingrédients issus de l'agriculture biologique","name":"IMPORTANT"},{"value":"phrase d'accroche sur le produit\nfabrication (si pertinent)\nutilisation\nOrigine\nbienfaits sous forme de liste à puces\nconclusion sympathique\nPrésentation de la Marque à la troisième personne","name":"SCHEMA"},{"value":"Soupe onctueuse","name":"GOUT"},{"name":"DESCRIPTION_MARQUE","value":"Pour atteindre notre finalité, nous nous sommes constitués en une coopérative de salariés. Notre engagement dans l’économie sociale facilite les liens avec les producteurs : nous partageons les mêmes valeurs coopératives. C’est une entreprise où les personnes et le travail priment sur le capital. Ce modèle permet aux salariés de détenir un po"}], suggestions: [], promptTemplate: "Produit : {\nTitre : [DESIGNATION]\nListe des ingrédients : [INGREDIENTS]\nOrigine:[GOOGLE]\nMarque : [MARQUE]}\n\n\nRôle : Imagine que tu es un expert en SEO depuis plus de 20 ans. Tu es spécialisé dans les fiches produits pour les commerces alimentaires.\n\n\nPour chacun des produits, rédige une Description du produit à partir des informations données avec un style convivial et adapté au SEO. Maximum 500 tokens. Insiste sur [IMPORTANT] Adopte le point de vue du vendeur sans jamais le citer. Parle de la marque uniquement dans la partie Description de la [MARQUE].  N'utilise pas pas \"notre\" mais \"ce\". \nUtilise une lettre majuscule à chaque début de phrase.\nParle de la [GOUT].\nSuis la structure suivante :\n[SCHEMA]" }), "fields");
   


    
    content.users.push(
        {
            EMAIL: email,
            CATALOGUE_BIO_TRASH: CATALOGUE_BIO_TRASH.data.id,
            ID_SERVER_FILE: ID_SERVER_FILE.data.id,
            ID_FIELDS_FILE: ID_FIELDS_FILE.data.id,
            CATALOGUE_BIO: CATALOGUE_BIO.data.id

        }
    );

    drive.setFile(fileId);
    await drive.updateDocs(JSON.stringify(content));

    

    drive.setFile(CATALOGUE_BIO.data.id);
    await drive.setPermission("writer", email);
    console.log("permission given for CATALOGUE_BIO_TRASH");


    drive.setFile(CATALOGUE_BIO_TRASH.data.id);
    await drive.setPermission("writer", email);
    console.log("permission given for CATALOGUE_BIO_TRASH");

    drive.setFile(ID_SERVER_FILE.data.id);
    await drive.setPermission("writer", email);
    console.log("permission given for ID_SERVER_FILE");

    drive.setFile(ID_FIELDS_FILE.data.id);
    await drive.setPermission("writer", email);
    console.log("permission given for ID_FIELDS_FILE");

    //USER_LIST
    drive.setFile("13akfxRFwXLjmx3lXvhIkyrmggb6sZUZ2cx1q3Bqk9Hc");
    await drive.setPermission("writer", email);
    console.log("permission given for users list");
        
 

    return {message: "done"};
  }

  module.exports = {createUserFiles}