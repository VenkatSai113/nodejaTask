const express = require("express");
const path = require("path");
var bodyParser = require('body-parser');
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const cors = require('cors');
var jsonParser = bodyParser.json();
const dbPath = path.join(__dirname, "userDetails.db");
app.use(cors());
let db = null;
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(9000, () => {
      console.log("Server Running at http://localhost:9000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
// Middleware function
const jwtAuthenticateToken=(request,response,next)=>{
  let jwtToken;
 
  const authHead=request.headers["authorization"]
  if(authHead!== undefined){
  jwtToken=authHead.split(" ") [1];
  }
  if(jwtToken===undefined){
    response.status(401)
    response.send(JSON.stringify("Unauthorized User"))
  }
  else{
    jwt.verify(jwtToken,"userLogin",(error,payload)=>{
      if(error){
        response.status(401)
        response.send(JSON.stringify("Invalid Access Token"))
      }
      else{
        request.userName=payload.username       
        next()
      }
    })
  }
}
// signup Api
app.post("/signup",jsonParser, async (request, response) => {
   const { userName, password } = request.body;
   const hashedPassword = await bcrypt.hash(request.body.password, 10);
   const selectUserQuery = `SELECT * FROM userInfo WHERE username = '${userName}';`;
   const dbUser = await db.get(selectUserQuery);
   if (dbUser === undefined) {
     const createUserQuery = `
       INSERT INTO 
         userInfo (userName, password) 
       VALUES 
         (
           '${userName}', 
           '${hashedPassword}'
         );`;
     const dbResponse = await db.run(createUserQuery);
     const newUserId = dbResponse.lastID;
     response.send(JSON.stringify(`user is signup Successfully`));
   } else {
      response.status(400)
     response.send(JSON.stringify("User already exists"));
   }
 });
 //login api
app.post("/login",jsonParser, async (request, response) => {
      const { userName, password } = request.body;
      const selectUserQuery = `SELECT * FROM userInfo WHERE username = '${userName}'`;
      const dbUser = await db.get(selectUserQuery);
      if (dbUser === undefined) {
        response.status(400);
        response.send(JSON.stringify("Invalid User"));
      } else {
        const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
        if (isPasswordMatched === true) {
          const payload = {
            username: userName,
          };
          const jwtToken = jwt.sign(payload, "userLogin",{ expiresIn: '10m' });
          response.send({ jwtToken });
        } else {
          response.status(400);
          response.send(JSON.stringify("Invalid Password"));
        }
      }
    

})
let squareState = Array(60).fill('black');

//current status which is black

app.post('/blackBox',jwtAuthenticateToken,jsonParser,async(request,response)=>{
  
  const {randomValue,black}=request.body
  const {userName}=request
  const getUserQuery=`SELECT userId FROM userInfo WHERE userName='${userName}';`;
  const dbResponse=await db.get(getUserQuery);

    const insertColorQuery=`INSERT INTO colorStatus (userId,randomBlock,boxColor)
    VALUEs ('${dbResponse.userId}','${randomValue}','${black}');`;
    const insertResponse=await db.run(insertColorQuery)
   
  
  response.send(JSON.stringify('success'))
})
//current status which is white
app.post('/whiteBox',jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {randomValue,black}=request.body
  const {userName}=request
  const getUserQuery=`SELECT userId FROM userInfo WHERE userName='${userName}';`;
  const dbResponse=await db.get(getUserQuery);
  
    const insertColorQuery=`INSERT INTO colorStatus (userId,randomBlock,boxColor)
    VALUES ('${dbResponse.userId}','${randomValue}','${black}');`;
    const insertResponse=await db.run(insertColorQuery)
    console.log(insertResponse)
  
  response.send(JSON.stringify('success'))
})
// reset the color
app.post('/repeteCycle',jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userName}=request
  const getUserQuery=`SELECT userId FROM userInfo WHERE userName='${userName}';`;
  const dbResponse=await db.get(getUserQuery);
  const cleareBoxColors=`DELETE FROM colorStatus WHERE userId='${dbResponse.userId}';`;
  const dbResponseboxColor=await db.run(cleareBoxColors);
  const cycleUpdation=`INSERT INTO patrenStatus (userId,cycleStatus)
  VALUES ('${dbResponse.userId}','completed');`;
  const updation=await db.run(cycleUpdation)
  console.log(updation)

})