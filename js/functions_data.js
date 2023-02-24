/*******global variables*****/
var gIsLoggedIn = false;


//on return or keypress then run this search() function
async function search(cidb, _sstore , _searchterm){
	//var idb = await cidb.open("basename", "storename", { schema: s, index: i })
	idbMenu = await cidb.open("menu", "fstore",  {
            schema: { keyPath: "id", autoIncrement:false },
			index: 
	            [
	                ["iparentid", "iparentid", { unique: false }], 
	                ["ipagename", "ipagename", { unique: false }] 
	           ]     
    })
//	                ["iparentid", "parentid", { unique: false }],
//	                ["ipagename", "pagename", { unique: false }] 

	var aIdentfiers = await cidb.getIndex("fstore", "pagename", _searchterm)
	console.log (aIdentfiers)
}

//delete All three databases.

function deleteDatabases(_dbName){	
	var req = indexedDB.deleteDatabase(_dbName);
	req.onsuccess = function () {
	    console.log("Deleted database successfully");
	};
	req.onblocked = function(e) {
	  console.log("blocked: " + e);
	  console.log("Couldn't delete database due to the operation being blocked");

		// Close connections here
		//cidb.kill(_dbName);  //from the SimpleDB class didn't make any difference just calling the same deleteDatabase function' 
		//(e.target as any).result.close();
		
	};
	req.onerror = function () {
	    console.log("Couldn't delete database");
	};
}

/*****NOT IN USE */
async function handleLoginSubmit (username, password) {
	//...pass through username and password... 
	//[sectionid, menupages, contentpages]
	//[0] array used for information

	fetch("https://sm5a54kkhi.execute-api.eu-west-1.amazonaws.com/default/listPages?username=" + username + "&password=" + password)
		.then(response => response.json()) //NEW condensed
		.then(data => { 
			//if no section returned then data[0] = null otherwise section_id is data[0]
			//if password incorrect then data[1] == "password incorrect" //data[1] contains empty array [] 
			//try{
			let array_length = data[1].length; 
			if (array_length > 1){ //ie, if menupages array length contains more than 1 record.
					//**in functions_data.js async function */
					indexdb_fill(data).then(() => { 
					//******************************************** */
						///** functions_data.js */async function 
						//getUserInfo(cidb, callbackFunction); //calls menu from UserInfo function	
						//--> this calls callbackFunction(cidb, sectionid, sectionid);  which calls Menu and Page data		
						//** need to update the callbackFunction to show the INDEX PAGE */
						//** with links on the OPEN sections  */
						//** create indexDB's for all accessible data' */
					//******************************************** */						
					//if (data[0][0].section != NaN) window.location = "pages.html?id=" + data[0][0].section;
				});
			}else if(array_length == 1){ //if contains 1 record that record will be a "password incorrect" record
				document.getElementById("passwordmessage").innerHTML = data[1][array_length-1];		
				document.getElementById("loginForm").onsubmit = function(e){
					e.preventDefault();
					//handleLoginSubmit(callbackFunction);
				};
			}	
			console.log ("data=" + data);
			return data;		
		})
		.catch(rejected => {
    		console.log(rejected);
		});
	//...don't think I need JWT at present'
  	// Extract the JWT from the response
  	//const { jwt_token } = await response.json()
  	// Do something the token in the login method
  	//await login({ jwt_token })
}

//**********************EDITOR SPECIFIC AS GETS DATA FROM MONGO**********************///////
function getUserSectionData(data){
	var sectionid;
	for (var d of data)  //looping through data
	{
		console.log(d);
		//console.log(d.username,  d.section, d.version);
		sectionid = d.section;
		//console.log(d.id,  d.pageid, d.pagename);
	}
	return sectionid;
}


