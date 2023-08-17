// Import the MongoDB driver
const MongoClient = require("mongodb").MongoClient;
const https = require('https');
const AWS = require("aws-sdk");
const querystring = require('querystring');

// Define our connection string. 
//Info on where to get this will be described below.
// In a real world application you'd want to get this string from a key vault like AWS Key Management, 
//but for brevity, we'll hardcode it in our serverless function here.
const MONGODB_URI =
  "mongodb+srv://stack-user:rqENFZDT9tfVJFYJ@cluster-stack.r5zsn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

// Once we connect to the database once, we'll store that connection and reuse it so that we don't have to connect to the database on every request.
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  // Connect to our MongoDB database hosted on MongoDB Atlas
  const client = await MongoClient.connect(MONGODB_URI);

  // Specify which database we want to use
  const db = await client.db("stack");

  cachedDb = db;
  return db;
}

exports.handler = async (event, context) => {
  // Read form data.
  let _parentid = 0;
  let _content_id = 0;
  let _sectionid = 0;
  var userpages = [];
  var menupages = [], menupageids = [];
  var contentpages = [];
  var contentpage, _menuid, _username, _password; 
  var arr = [];
  let JSONTest;

  //contents of event object whether it be from a POST/GET or TEST
var parsedObject;
var queryStringParams = false;

if (event.queryStringParameters){
    queryStringParams = true;
    parsedObject = event.queryStringParameters;
}else if (event.body !== null && event.body !== undefined) {
    parsedObject = event.body //use in case of JSON body
}else{
    parsedObject = event;
}

  //const postname = body.name
  //const { user, pass } = querystring.parse(event.body)
  /* By default, the callback waits until the runtime event loop is empty before freezing the process and returning the results to the caller. Setting this property to false requests that AWS Lambda freeze the process soon after the callback is invoked, even if there are events in the event loop. AWS Lambda will freeze the process, any state data, and the events in the event loop. Any remaining events in the event loop are processed when the Lambda function is next invoked, if AWS Lambda chooses to use the frozen process. */
  context.callbackWaitsForEmptyEventLoop = false;

  // Get an instance of our database
  const db = await connectToDatabase();

  //options are: (passed through querystrings)
  //ID (menuID) --> if then bring back subpages.
  //Username = "" which also brings back menupages (at allowed section level)
  //Content_id - which brings back content --> think about bringing back all content for a particular section... 
  if (parsedObject.id) {
        _menuid = parsedObject.id;
        _menuid = parseInt(_menuid);
        //get all pages
        if (_menuid == "-1"){
          menupages = await db.collection("menu").find({  }).toArray();
        }else{
          menupages = await db.collection("menu").find({ parentid : _menuid }).toArray();
        }
  }else if (parsedObject.username) {
        _username = parsedObject.username;
        _password = parsedObject.password;
        //get sectionid from usertable
        userpages = await db.collection("users").find({ "username" : _username}).toArray();  //needs toArray() - otherwise ?not able to get to the data....
        //getUser as Array --> stringify --> parse - access the data
        try{ 
            var userpages_jsonstring = JSON.stringify(userpages[0]);
            var jsonobject = JSON.parse(userpages_jsonstring);
            if (jsonobject.password.toString() == _password.toString()){
              var sectionLinked = { sectionid: { $in: jsonobject.section }}
                                //{ _id: { $in: ['5bd45277f5b9430013f4a604', '5bd470fe452cb33af4b8407a'] } }
              JSONTest = await db.collection("menu").find(sectionLinked).forEach(function(item){
                menupages.push(item);
                menupageids.push(item.id);
              });
              contentpages = await db.collection("pages").find({ id: { $in: menupageids } }).toArray()
            }else{
               menupages.push("Password incorrect please try again");
              //menupages.push("[{\"id\":0,\"pageid\":0,\"pagename\":\"Root\",\"parentid\":-1,\"sectionid\":0}]");
            }
        }catch(error){
          menupages.push("[ " + error + "]");
        }
        //bring back all content for that section and put into indexedDB
        //
  }else if (parsedObject.content_id) {
        _content_id = parsedObject.content_id;
        _content_id = parseInt(_content_id);
        menupages = await db.collection("pages").find({ "id" : _content_id}).toArray();
  }else if (parsedObject.parent_id) {
        _parentid = parsedObject.parent_id;
        _parentid = parseInt(_parentid);
        //now update
        //menupages = await db.collection("menu").updateMany({ parentid : _parentid }, {$set: {sectionid: 3}});
        menupages = await db.collection("menu").find({ parentid : _parentid }).sort({"pageorder" : 1}).toArray();
  }else if (parsedObject.section_id) {
        _sectionid = parsedObject.section_id;
        //sectionid: { $in: [ _sectionid ]  //tags: { $in: [ "home", "school" ] } for Mongo finding multiple sectionids
        let arr = _sectionid.split(',');
        let nums = arr.map(function(str) {
          // using map() to convert array of strings to numbers
          return parseInt(str); });
        menupages = await db.collection("menu").find({ sectionid: { $in: nums } }).sort({"pageorder" : 1}).toArray();
        //now update
        //menupages = await db.collection("menu").updateMany({ parentid : _parentid }, {$set: {sectionid: 3}});
        //menupages = await db.collection("menu").find({ parentid : _parentid }).toArray();
  }
  /*
  var myBlob = new Blob();
  var init = { "status" : 200 , "statusText" : "SuperSmashingGreat!" };
  var myResponse = new Response(myBlob,init);

+ "testing addition" + " " + userpages_jsonstring + " " +  _sectionid + Array.isArray(userpages) + " " + userpages.length + " "
  */
  const response = {
    statusCode: 200,
    body: "[" + JSON.stringify(userpages) +  "," + JSON.stringify(menupages) + "," + JSON.stringify(contentpages) + "]"
  };

  return response;
};