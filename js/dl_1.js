///IF LOGIN FORM HAS BEEN CLICKED THEN THIS FUNCTION IS CALLED>>>
//callback = gDataSource - so local or remote. 


/*
console.log("data[0].length" + data[0].length); //data[0] includes the user data
[[{"_id":"6287860ff528d2467b8506a1","username":"kate.wykes@gmail.com","password":"testing","section":58,"version":1},
{"_id":"63c94a1076d496c43778b314","username":"kate.wykes@gmail.com","password":"testing","section":4,"version":1}],
console.log("data[1].length" + data[1].length); //data[1] includes the ?menu data
console.log("data[2].length" + data[1].length); //data[1] includes the ?page data

index.html --> FormSubmit calls verifyLogin() --> handleLoginSubmit_new
	on submit passing through username and password 
	Main purpuse to fill the indexedDB database locally
	returns indexFilled array[] a multi-dimensional (3) deep array - this is not used above
*/
const handleLoginSubmit_new = async (username, password) => {
	let userData  = await fetch("https://sm5a54kkhi.execute-api.eu-west-1.amazonaws.com/default/listPages?username=" + username + "&password=" + password)
	//use string literals
	let userDataJSON = await userData.json();
	let array_length = userDataJSON[1].length; 
	//console.log ("array_length" + array_length);
	if (array_length > 1){ //ie, if menupages array length contains more than 1 record.
		//**in functions_data.js async function */
		//await - it WAITS!	
		let indexedFilled = await indexdb_fill(userDataJSON);
		//below - behaves asynchronosly
		//indexdb_fill(userDataJSON).then(() => { 
		//	console.log("userDataJSON[0]=" + userDataJSON[0]);
		//});
	}					
	return userDataJSON;
}

//**************************DATA LAYER for IndexedDB******************************************//
async function getUserInfo(cidb, callbackFunction){
	var idbUser;
	var username, sectionid, timestamp;
	var T25DAYS =  25 * 24 * 60 * 60 * 1000; /* ms */
	var ONE_DAY = 24 * 60 * 60 * 1000; /* ms */
	var ONE_HOUR = 60 * 60 * 1000; /* ms */
	var ONE_MIN = 60 * 1000; /* ms */
	//if it update the users table with the updated date/time if updated content then when 
	
		const d3 = new Date().getSeconds();	
		//console.log ("HERE d3=" + d3);

		//var idb = await cidb.open("basename", "storename", { schema: s, index: i })
		//see also fill below which creates a UserTable and populates from MongoDB
		idbUser = await cidb.open("user", "fstore",  
		{
            schema: { keyPath: "id", autoIncrement:true}, 
			index: 
	            [
	                ["id", "id", { unique: false }]
	           ]     
	          
        })	

		const d4 = new Date().getSeconds();	
		//console.log ("HERE d4=" + d4);
		//***old call replaces to optimise speed */var cont_test = await cidb.getdata(idbUser,"fstore");
		//var cont = await cidb.dump(idbUser, "fstore")
		var cont = await cidb.getAllData(idbUser, "fstore"); //- may be quicker to use getAllData
		//console.log(cont.length);
		if (cont.length == 0 ){ //then no UserTable locally so user not logged in so display the login form
			bIsLoggedIn = false;
			cidb.kill(idbUser); //destroy the Temp user table			  		
		}else{
			//the then: would be in the cidb.open function... 
			var d6; 
			for(var x of cont) {
				username = x["username"];	
				sectionid = x["section"];	
				timestamp = x["timestamp"];		
		
				d6 = new Date().getSeconds();	
				//console.log ("in Loop =" + d6);
				//console.log("username=" + username);
				//console.log("sectionid=" + sectionid);
			}    
			if (sectionid == null){
				bIsLoggedIn = false;		
				//UserLogOut();  //--> UserLogOut (called from pages.html) if user logged out then ultimately will be repopoulated from handleLoginSubmit() in shared functions.
			}else{
				bIsLoggedIn = true;			
				//UserLoggedIn(); //in prl_1.js (presentation layer 1)
			}
		}	
		//console.log ("3 timestamp_now in getUserInfo" + Date.now()); //WILL BE FALSE BECAUSE ITS AN AYSNC FUNCTION
		return cont;
		//******************************************** */
		//*** asynchronous function that gets Menu and Page data - 
		//***  getIDBMenuData or getMenuRemote[edit **//////
		//******************************************** */
		//***WEDNESDAY changed this recently from url_id to sectionid */
		//REPLACE AT SOME POINT WITH INDEX PAGE CODE.
		//***call function to display loggedIn user */
		//await cidb.close();	 NOT A FUNCITON

		/** call remote User info here - timestamp */	
		//if you use var x = await callbackFunction then operates more like a synchronous function... 
		//does not get here first... 
		//in fact doesn't seem to get here at all if await is used...'
		//console.log("actually get here before IDBMenuData and getIDBPageData getUserInfo at the end " + Date.now());
		//after this looks like menu.js is next ?before callbackfunction is called above??
}

//1st fill up all three IndexedDB databases.
async function indexdb_fill(data){
	
	idbUser = await cidb.open("user", "fstore",  {
            schema: { keyPath: "id", autoIncrement:true },
	        index: 
	            [
	                ["id", "id", { unique: false }]
	           ]     
	          
        })
	idbMenu = await cidb.open("menu", "fstore",  {
            schema: { keyPath: "id", autoIncrement:false },
	        index: 
	            [
	                ["id", "id", { unique: true }],
	                ["iparentid", "parentid", { unique: false }],
	                ["ipagename", "pagename", { unique: false }] 
	           ]     
	          
        })
	//keyPath - which one do I want to use as key
    idbPages = await cidb.open("pages", "fstore",  {
            schema: { keyPath: "id", autoIncrement:false },
	        index: 
	            [
	                ["id", "id", { unique: false }],
	           ]     	          
        })

		//console.log ("data[0][0]" + data[0][0].section);			
		//console.log ("data[0][1]" + data[0][1].section);			

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


//********************GET DATA from Mongo************************///////
/* getsUserInfo from LOCAL IndexedDB and sets LoggedIn and calls callbackFunction
callbackFunction : getIDBMenuData or getMenuRemote (prints out Menu/Page) 
getUserInfo : 
 	PARAMS: 
		cidb object - ie, IndexedDb (new SimpleIDB)
		callbackFunction :  getRemoteMenuData or IDBMenuData (set in pages.html)
	called from: 
		onload page.html
		from handleLoginSubmit (in functions_shared.js)
		//NEEED TO ADD - DATE check to see if they need to get new data Remotely....
	//instatiate menu class  
	//PRINT HOME PAGE FIRST
	//let page = new Page(0); //try to print home page as default post login
	//page.printHomePage();	
	//throw new Error('Program Terminated');
	//callbackFunction(cidb, url_id, sectionid); //called from getUserInfo above
	//passing through -1 to the fetch call getes all... 
*/
async function getRemoteMenuData(cidb, _menuid, _sectionid){
	//console.log("_sectionid=" + _sectionid);
	let menu = new Menu(_menuid);  	
	menu.url = window.location.pathname; 
	try{
		fetch("https://sm5a54kkhi.execute-api.eu-west-1.amazonaws.com/default/listPages?section_id=" + _sectionid)
			.then(response => response.json()) //NEW condensed
			.then(data => {
				//console.log("in getRemoteMenuData then statement=" + data[1])
				menu.filter_populateMenu(data[1], _menuid, _sectionid, "remote") //prints out menu of section we are in --> see cMenu.js
				//console.log ("_url_id" + _url_id);
				//console.log ("menu.pageorder" + menu.pageorder);
				//***************************************************** */
				//getRemotePageData(menu.pageid, _menuid, menu.parentid, menu.pageorder, menu.sectionid); //getContent function in cPage class js file
				//primary_nav.sectionid
				//console.log("menu.parentid" + menu.parentid);
				//console.log("menu.pageorder" + menu.pageorder);
				//document.getElementById("para_loader").style.display = "none";
			})
	}catch(e){
			
	}
}	

//called from getMenu as data needed from menu.json to populate page. 
//call listPages - ie --> return data from ListPages lamda from Pages data. 
async function getRemotePageData(_pageid, _menuid, _parentid, _pageorder, _sectionid){
	//instatiate page class  
	//console.log("IN getContent()=" + _pageid)
	let page = new Page(_pageid);  
	const parsed = parseInt(_pageid);
	if ((_pageid == null)||(_pageid == NaN)){
		page.printPageError();
	}else if (parsed == 0){
	console.log("just before page.printHomepage() parsed=" + parsed);		
		page.printHomePage();
	}else{
		try{
	//console.log("_sectionid=" + _sectionid);
			fetch("https://sm5a54kkhi.execute-api.eu-west-1.amazonaws.com/default/listPages?content_id=" + _pageid + "")
		  		.then((response) => response.json())
		  		.then((pagedata) => {
					//console.log(gEditView);
					if(gEditView){
						//console.log("pagedata[1]=" + pagedata[1] + " _pageid=" + _pageid + " _menuid=" + _menuid + " _parentid=" + _parentid + " _pageorder=" + _pageorder + " _sectionid=" + _sectionid);
						page.pageContentEdit(pagedata[1], _pageid, _menuid, _parentid, _pageorder, _sectionid);				
					}else{
						page.pageContent(pagedata[1], _pageid, _menuid, _parentid, _pageorder, _sectionid);
					}
					//console.log("pagedata[0]=" + pagedata[0]);
					//pageContent(_pageid, _sectionid)
				})
			}catch(e){				
			}
		}
		  //.catch((err) => {
		  //	console.log("custom err=" + err);
		     //Do something for an error here
		  //})
	//I guess more of a push than a pull 
	//so once this is done it pushes (callsback)
}

//********************GET DATA from INDEXEDDB************************///////
/* getIDBMenuData
- cidb is IndexedDB object: 
-- _menuid is passed urlid (from querystring checked in functions_shared.js) 
---- *if called from verifyUser then _menuid and _sectionid = sectionid
-- _sectionid = sectionid from user[indexedDB]
*/
async function getIDBMenuData(cidb, _menuid, _sectionid){
	var idbMenu, menu_data;
	var username, sectionid;

	//PRINT HOME PAGE FIRST
	//let page = new Page(0); //try to print home page as default post login
	//page.printHomePage();	
	//throw new Error('Program Terminated');

	idbMenu = await cidb.open("menu", "fstore",  {
            schema: { keyPath: "id", autoIncrement:false },
    })
	var menu_content = await cidb.dump(idbMenu, "fstore");
		
	//console.log("in getIDBMenuData url_id=" + url_id);
	///*** Menu constructor(id, sectionid) ****/
	let menu = new Menu(_menuid); 
	menu.url = window.location.pathname; 
	
	//console.log("_menuid" + _menuid);  
	menu.filter_populateMenu(menu_content, _menuid, _sectionid, "idb");	
	//console.log("getIDBMenuData after new Menu and populateMenu=" + menu.id + " " + Date.now());
	document.getElementById("section_title").innerHTML = menu.sectionname
	
	///*** Page constructor(id, sectionid) ****/
	//getIDBPageData(cidb, url_id, menu.pageid, menu.parentid, menu.sectionid); //var x = await //getContent function in cPage class js file

}
//getPageData
async function getIDBPageData(cidb, _menuid, _pageid, _parentid, _sectionid){
	var idbPage, page_data;
	var username, sectionid;
	var page_cont; 
	
	let page = new Page(_pageid); //set in  1) resolveLink_ExpandMenu_printPage (pages.html)
	const parsed = parseInt(_pageid);
	idbPage = await cidb.open("pages", "fstore",  {
            schema: { keyPath: "id", autoIncrement:false },
    })
	if ((_pageid == null)||(_pageid == NaN)){
		page.printPageError();
	}else if (parsed == 0){
	console.log("parsed==0" + parsed);
		page.printHomePage();
	}else{
		try{
			page_cont = await cidb.read("fstore", parsed)	
			//console.log("in getIDBPageData=" + page_cont + " " +  _pageid + " " +  _menuid  + " " +  _parentid  + " " +  _sectionid);
			page.JSONPageContent(page_cont, _pageid, _menuid, _parentid, _sectionid);	
		}catch(e){
		//IF PARSED = UNDEFINED BECAUSE WE ARE NOT ALLOWED OR HAVEN"T GOT THE CONTENT FOR THAT ID"
		//THEREFORE THROW A CATHCABLE ERROR...
			//console.log("page_cont=" + page_cont);
			//console.log("the user does not have access to this page in their offline data")			
		}
		
	}
	//console.log("getIDBPageData after new Page and JSONPageContent=" + page.pageid + " " + Date.now());
	
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
