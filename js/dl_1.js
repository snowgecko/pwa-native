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
	var userData, userDataJSON;
	try{
		const d1 = Date.now(); 
		let userData  = await fetch("https://rcsc26l72a.execute-api.eu-west-1.amazonaws.com/default/listUserMenu?username=" + username + "&password=" + password)
		userDataJSON = await userData.json();
		let array_length = userDataJSON[1].length; 
		if (array_length > 1){ //ie, if menupages array length contains more than 1 record.
			//at the moment this fills 3 tables - need it to fill User/Menu but pages can be done asynchronosoly	
			let indexedFilled = await indexdb_fill(userDataJSON);
			//fill the pages contents actually asynchronously
			loadPageData(username, password);
		}							
		const d2 = Date.now();
		//console.log("Math.abs(d2-d1)=" + Math.abs(d2-d1)); 
	}catch(e){
		userDataJSON = "[{\"id\": 0, \"error\"}]";
	}
	return userDataJSON;
}
//same as handleLoginSubmit_new ***replace that with this...
const handleUpdateContent = async (username, password) => {
	var userData, userDataJSON;
	try{
		const d1 = Date.now(); 
		let userData  = await fetch("https://rcsc26l72a.execute-api.eu-west-1.amazonaws.com/default/listUserMenu?username=" + username + "&password=" + password)
		userDataJSON = await userData.json();
		let array_length = userDataJSON[1].length; 
		if (array_length > 1){ //ie, if menupages array length contains more than 1 record.
			//at the moment this fills 3 tables - need it to fill User/Menu but pages can be done asynchronosoly	
			let indexedFilled = await indexdb_fill(userDataJSON);
			//fill the pages contents actually asynchronously
			loadPageData(username, password);
		}							
		const d2 = Date.now();
		//console.log("Math.abs(d2-d1)=" + Math.abs(d2-d1)); 
	}catch(e){
		userDataJSON = "[{\"id\": 0, \"error\"}]";
	}
	return userDataJSON;
}


/******try using import statements ES6 */
//import dataJson from 'config.json';
//document.getElementById('main').innerHTML = JSON.stringify(dataJson);
async function loadPageData(username, password){

	let pagesData  =  fetch("https://sm5a54kkhi.execute-api.eu-west-1.amazonaws.com/default/listPages?username=" + username + "&password=" + password)
		.then(response => response.json())
		.then(data => indexPagesdb_fill(data))
		.catch(error => console.log(error))
		.finally(() => console.log("finally"))
	//let pagesFilled = pagesdb_fill(userData)
}

//**************************DATA LAYER for IndexedDB******************************************//
		//******************************************** */
		//*** asynchronous function that gets Menu and Page data - 
		//***  getIDBMenuData or getMenuRemote[edit **//////
		//******************************************** */
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
		var cont = await cidb.getAllData(idbUser, "fstore"); 
		if (cont.length == 0 ){ 
			bIsLoggedIn = false;
			cidb.kill(idbUser); //destroy the Temp user table			  		
		}else{
			var d6; 
			for(var x of cont) {
				username = x["username"];	
				sectionid = x["section"];	
				timestamp = x["timestamp"];		
		
				d6 = new Date().getSeconds();	
			}    
			if (sectionid == null){
				bIsLoggedIn = false;		
			}else{
				bIsLoggedIn = true;			
			}
		}	
		return cont;
}

//1st fill up all three IndexedDB databases.
async function indexPagesdb_fill(data)
{
		//keyPath - which one do I want to use as key
		idbPages = await cidb.open("pages", "fstore",  {
            schema: { keyPath: "id", autoIncrement:false },
	        index: 
	            [
	                ["id", "id", { unique: false }],
	           ]     	          
        })
		//console.log (data[2]);			
		//console.log (data[1][0]);			
		cidb.fill(idbPages, "fstore", data[2])						
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
		//console.log ("data[0][0]" + data[0][0].section);			
		//console.log ("data[0][1]" + data[0][1].section);			

		cidb.fill(idbUser, "fstore", data[0]);
		cidb.fill(idbMenu, "fstore", data[1]);
		
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

	IF called from prl_1.js - verifyUserContent 
	const menuData = await callbackFunction(cidb, userInfo[0]["section"], userInfo[0]["section"]); 
	--> menu.filter_populateMenu(data[1], _menuid, _sectionid, "remote") //populates Menu into html_menu div
	--> but then _menuid not used in that function. 
*/
async function getRemoteMenuData(cidb, _menuid, _sectionid){
	let menu = new Menu(_menuid);  	
	menu.url = window.location.pathname; 
	try{
		console.log("_menuid" + _menuid , "_sectionid" + _sectionid)
		fetch("https://sm5a54kkhi.execute-api.eu-west-1.amazonaws.com/default/listPages?section_id=" + _sectionid)
			.then(response => response.json()) 
			.then(data => {
				menu.filter_populateMenu(data[1], _menuid, _sectionid, "remote") //populates Menu into html_menu div
			})
			//console.log("Date.now()", Date.now());
		//console.log ("data[1].timestamp" , data[1].timestamp);
	}catch(e){
			
	}
}	

//called from getMenu as data needed from menu.json to populate page. 
//call listPages - ie --> return data from ListPages lamda from Pages data. 
async function getRemotePageData(_pageid, _menuid, _parentid, _pageorder, _sectionid){
	let page = new Page(_pageid);  
	const parsed = parseInt(_pageid);
	if ((_pageid == null)||(_pageid == NaN)){
	}else if (parsed == 0){
		//homepage...
	}else{
		try{
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

	idbMenu = await cidb.open("menu", "fstore",  {
            schema: { keyPath: "id", autoIncrement:false },
    })
	var menu_content = await cidb.dump(idbMenu, "fstore");  // has a close statement idb.close()

		
	let menu = new Menu(_menuid); 
	menu.url = window.location.pathname; 
	menu.filter_populateMenu(menu_content, _menuid, _sectionid, "idb");	
	//document.getElementById("section_title").innerHTML = menu.sectionname
	
}
//getPageData
async function getIDBPageData(cidb, _menuid, _pageid, _parentid, _sectionid){
	var idbPage, page_data;
	var username, sectionid;
	var page_cont; 
	//console.log("sectionid in getIDBPageData _sectionid=" + _sectionid);
	let page = new Page(_pageid); //set in  1) resolveLink_ExpandMenu_printPage (pages.html)
	const parsed = parseInt(_pageid);
	idbPage = await cidb.open("pages", "fstore",  {
            schema: { keyPath: "id", autoIncrement:false },
    })
	if ((_pageid == null)||(_pageid == NaN)){
		page.printPageError();
	}else if (parsed == 0){
		//console.log("parsed==" + parsed);
		//page.printHomePage();
	}else{
		try{
			page_cont = await cidb.read("fstore", parsed)	
			//	JSONPageContent(page_cont, _pageid, _menuid, _parentid, _pagecontent, _sectionid){
			page.JSONPageContent(page_cont, _pageid, _menuid, _parentid, "", _sectionid);	
		}catch(e){
			//error	
		}
	}
}
