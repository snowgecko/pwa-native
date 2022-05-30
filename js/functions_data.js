/*******global variables*****/
var gIsLoggedIn = false;



//**************************getData from IndexedDB******************************************//
//1st fill up all three IndexedDB databases.
async function indexdb_fill(data){
	
	idbUser = await cidb.open("user", "fstore",  {
            schema: { keyPath: "username", autoIncrement:false },
	        index: 
	            [
	                ["username", "username", { unique: true }],
	           ]     
	          
        })
	idbMenu = await cidb.open("menu", "fstore",  {
            schema: { keyPath: "id", autoIncrement:false },
	        index: 
	            [
	                ["id", "id", { unique: true }],
	                ["parentid", "parentid", { unique: false }] 
	           ]     
	          
        })
	//keyPath - which one do I want to use as key
    idbPages = await cidb.open("pages", "fstore",  {
            schema: { keyPath: "id", autoIncrement:false },
	        index: 
	            [
	                ["id", "id", { unique: false }]
	           ]     	          
        })

		//console.log (data[0][0]);			

		//console.log (data[1]);			
		//console.log (data[1][0]);			

		//console.log (data[2]);	

		cidb.fill(idbUser, "fstore", data[0]);
		cidb.fill(idbMenu, "fstore", data[1]);
		cidb.fill(idbPages, "fstore", data[2])			
				
		//console.log(data[0][0].section);
    	//displayAll(cidb, "storage")
//addMarkers().then(() => doSomething());
}

//getUserInfo  //passes through cidb object - ie, IndexedDb (new SimpleIDB)
async function getUserInfo(cidb, callbackFunction){
	var idbUser;
	var username, sectionid, timestamp;
	var T25DAYS =  25 * 24 * 60 * 60 * 1000; /* ms */
	var ONE_DAY = 24 * 60 * 60 * 1000; /* ms */
	var ONE_HOUR = 60 * 60 * 1000; /* ms */
	var ONE_MIN = 60 * 1000; /* ms */
	var timestamp_now = Date.now();
	
	idbUser = await cidb.open("user", "fstore",  {
            schema: { keyPath: "username", autoIncrement:false }	          
        })	
	//the then: would be in the cidb.open function... 
	var cont = await cidb.dump(idbUser, "fstore")
	for(var x of cont) {
		username = x["username"];	
		sectionid = x["section"];	
		timestamp = x["timestamp"];	
	}    
	console.log(cont);
	//***TODO - I do need to set up so that it checks the last updated date of the content.  */
	//((new Date) - myDate) < ONE_HOUR	
	//if sectionid == null then just set Boolean and leave page as Login page and do no more 
	if ((sectionid == null) || ((timestamp_now - timestamp) > T25DAYS)) {
		//console.log ("sectionid==null");
		bIsLoggedIn = false;
		UserLogOut();  //--> if user logged out then ultimately will be repopoulated from handleLoginSubmit() in shared functions.
	}else{
		//if sectionid == something - check that it matches the current pages sectionid
		//console.log ("sectionid=", sectionid);
		console.log("bLogginIn = true");	
		bIsLoggedIn = true;	
			//either getIDBMenuData or getMenuRemote[edit only]
		callbackFunction(cidb, url_id, sectionid); //**calls different function based on edit or NOT edit */
		
		//getIDBMenuData(cidb, url_id, sectionid);			
		//***call function to display loggedIn user */
		UserLoggedIn();
	}
	//console.log("bIsLoggedIn", bIsLoggedIn);
	//*******TO DO */
	//**add in -- if online then check version No and update if necessary */
}
////getMenuData
//cidb is IndexedDB object, _menuid is passed urlid (from querystring), _sectionid = sectionid from user[indexedDB]
async function getIDBMenuData(cidb, _menuid, _sectionid){
	var idbMenu, menu_data;
	var username, sectionid;

	idbMenu = await cidb.open("menu", "fstore",  {
            schema: { keyPath: "id", autoIncrement:false },
    })
	var cont = await cidb.dump(idbMenu, "fstore");
	
	//console.log("in getIDBMenuData");
	//console.log (cont);
	
	///*** Menu constructor(id, sectionid) ****/
	let menu = new Menu(url_id); 	
	//cont [Menu content from indexedDB], url_id (parsed querystring), _sectionid = sectionid from UserDB
	//check is done in filter_populateMenu for -edit
	menu.filter_populateMenu(cont, url_id, _sectionid, "idb");	
	 
	document.getElementById("section_title").innerHTML = menu.sectionname
	///*** Page constructor(id, sectionid) ****/
	getIDBPageData(cidb, url_id, menu.pageid, menu.parentid, menu.sectionid); //getContent function in cPage class js file
}
//getPageData
async function getIDBPageData(cidb, _menuid, _pageid, _parentid, _sectionid){
	var idbPage, page_data;
	var username, sectionid;
	var page_cont; 
	
	let page = new Page(_pageid); //set in  	
	//console.log("_pageid)", _pageid);

	idbPage = await cidb.open("pages", "fstore",  {
            schema: { keyPath: "id", autoIncrement:false },
    })
	if ((_pageid == null)||(_pageid == NaN)){
		console.log("no page match");  
		page.printPageError();
	}else{
		page_cont = await cidb.read("fstore", _pageid)
		page.JSONPageContent(page_cont, _pageid, _menuid, _parentid, _sectionid);	
	}
	//var infos = await cidb.read("fstore", _pageid);
	//var infos = await cidb.dump(idbPage, "fstore");
//console.log(page_cont);
//console.log(page_cont.id);
//console.log(JSON.stringify(infos, null, ' '));

	//var cont = await cidb.read("fstore", page.pageid );
	//console.log(cont[0]);
	//document.getElementById("loading_text").style.display = "none";	
	//document.getElementById("loader").style.display = "none";	
	//primary_nav.sectionid
	//console.log(username);
}
//delete All three databases.
function deleteDatabases(_dbName){	
	var req = indexedDB.deleteDatabase(_dbName);
	req.onsuccess = function () {
	    console.log("Deleted database successfully");
	};
	req.onerror = function () {
	    console.log("Couldn't delete database");
	};
	req.onblocked = function () {
	    console.log("Couldn't delete database due to the operation being blocked");
	};
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
//********************GET DATA from Mongo************************///////
//callbackFunction(cidb, url_id, sectionid); //called from getUserInfo above
function getRemoteMenuData(cidb, _menuid, _sectionid){
	//instatiate menu class  
	let menu = new Menu(_menuid);  	
	//passing through -1 gets the entire menu json file
	fetch("https://sm5a54kkhi.execute-api.eu-west-1.amazonaws.com/default/listPages?section_id=" + _sectionid)
		.then(response => response.json()) //NEW condensed
		.then(data => {
			//console.log("in getMenu then statement=" + data[1])
			menu.filter_populateMenu(data[1], _menuid, _sectionid, "remote") //prints out menu of section we are in --> see cMenu.js
			//console.log ("_url_id" + _url_id);
			//console.log ("menu.pageid" + menu.pageid);
			getRemotePageData(menu.pageid, _menuid, menu.parentid, menu.sectionid); //getContent function in cPage class js file
			//primary_nav.sectionid
			document.getElementById("para_loader").style.display = "none";
		})
}	
//called from getMenu as data needed from menu.json to populate page. 
//call listPages - ie --> return data from ListPages lamda from Pages data. 
function getRemotePageData(_pageid, _menuid, _parentid, _sectionid){
	//instatiate page class  
	//console.log("IN getContent()=" + _pageid)
	let page = new Page(_pageid);  	
		
	//console.log("in getContent after new Page() _url_id=" + _url_id)
	//console.log ("_pageid" + _pageid);
	fetch("https://sm5a54kkhi.execute-api.eu-west-1.amazonaws.com/default/listPages?content_id=" + _pageid + "")
		  .then((response) => response.json())
		  .then((pagedata) => {
				//console.log(gEditView);
				if(gEditView){
					page.pageContentEdit(pagedata[1], _pageid, _menuid, _parentid, _sectionid);				
				}else{
					page.pageContent(pagedata[1], _pageid, _menuid, _parentid, _sectionid);
				}
				//console.log("in getContent after then statement _url_id=" + _url_id)
				//console.log("pagedata[0]=" + pagedata[0]);
				//pageContent(_pageid, _sectionid)
			})
		  .catch((err) => {
		  	console.log("custom err=" + err);
		     //Do something for an error here
		  })
	//I guess more of a push than a pull 
	//so once this is done it pushes (callsback)
}

