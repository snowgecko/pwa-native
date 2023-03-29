	// Define Database Schema
	//value for USER contains json password, testing, timestamp, username, version, _id (mongo)
	//value for MENU contains json id, pageid, pagename, parentid, sectionid, _id (mongo)
	//value for PAGES contains json id, pageid, pagename, parentid, sectionid, _id (mongo)
	function setObjectStores(db){
		//new Dexie("myDB").open().then((db) => console.log(db.verno))
		db.version(1).stores({
		  user: "++id, username",
		  menu: "++id, iparentid, ipagename",
		  pages: "++id",
		}).upgrade(tx => {
			console.log("in upgrade function")
			//getRemoteMenuData(db, 4, 4); //only called if upgraded...
		});
		db.version(2).stores().upgrade(tx => {
			console.log("in upgrade function 2")
			//getRemotePageData(db, 4, 4)
		});
		db.on("ready", () => {
		//getUserData(db, "kate.wykes@gmail.com", "testing");		
		  console.log("db.verno", db.verno); // 1
		  console.log("db.idbdb.version" , db.idbdb.version); // 10
		});
	}

	///called when page refreshed or newly arriving at site 
	/**
	called when User Arrives at site to check IndexedDB - if exists then show User 
	if 
	**/
	const verifyUserContent = async function(db){
		
		try {
			ca_loaders.style.visibility = "visible";	
			
			await getUserData(db, username, password)
			//await db.user.count(function (count) {
			//	console.log(count + " users in total");
			//});
			if (db.user.count != 0){
				UserLoggedIn();
			}else{
				UserLoggedOut("");
			}
			//await db.user
    		//	.where("username").equalsIgnoreCase("kate.wykes@gmail.com")
    		//	.each(user => {
        	//		console.log("Found kate.wykes@gmail.com", user);
    		//});
			ca_loaders.style.visibility = "hidden";
			return userInfo;
		}catch (e){
			ca_loaders.style.visibility = "hidden";
		}
	};

	function UserLoggedIn (){
		console.log("UserLoggedIn function called from verifyuserContent function");
		document.getElementsByClassName('content')[0].style.height = '100%';
		const content = document.getElementById("content_variable");
			content.style.display = "block";
			content.style.borderTop = "100px";
	
		const header = document.getElementById("header");
			header.style.background = "grey";
		
		const headerimage = document.getElementById("headerimage");
			headerimage.style.display = "block";
			headerimage.style.height = "0px";
	}


	async function dexit_searchMenu(_db, _searchTerm){
		const friendsContainingLetterA = await db.menu
	    	.filter(menuitem => /course/i.test(menuitem.pagename))
	    	.toArray();
		console.log (friendsContainingLetterA);
	}


//********************GET DATA from Mongo************************///////
//**
async function getRemoteMenuData(db, _menuid, _sectionid){
	await fetch("https://sm5a54kkhi.execute-api.eu-west-1.amazonaws.com/default/listPages?section_id=" + _sectionid)
		.then(response => response.json()) //NEW condensed
		.then(data => {
			console.log(data[1]);
			db.menu.bulkPut(data[1]);
	});
	
}

/*
getUserData - calls fetch for this user and gets data for Menu, Pages and User TABLES/OBJECT STORES
https://sm5a54kkhi.execute-api.eu-west-1.amazonaws.com/default/listPages?username
different syntax to await fetch().then((response) => response.json())
The await syntax is generally considered preferable since it allows to avoid nesting then statements and is arguably easier to read.
doing the same thing as: 
		cidb.fill(idbUser, "fstore", data[0]);
		cidb.fill(idbMenu, "fstore", data[1]);
		cidb.fill(idbPages, "fstore", data[2])			
*/
async function getUserData(db, username, password){
	var userData;
	try{
		let userData = await fetch("https://rcsc26l72a.execute-api.eu-west-1.amazonaws.com/default/listUserMenu?username=kate.wykes@gmail.com&password=testing")
		//let userData  = await fetch("https://sm5a54kkhi.execute-api.eu-west-1.amazonaws.com/default/listPages?username=" + username + "&password=" + password)
		let userDataJSON = await userData.json();
		let array_length = userDataJSON[1].length; 
		if (array_length > 1){ 
			db.user.bulkPut(userDataJSON[0]);
			db.menu.bulkPut(userDataJSON[1]);
			db.pages.bulkPut(userDataJSON[2]);		
	console.log("in getUserData after bulkPut")
		}
	}catch(e){
		console.log(e);
	}
}

