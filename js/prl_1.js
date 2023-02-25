/*******************
on arrival to the site the User is checked via verifyUserContent 
1) if has local data and isLoggedIn then is actively navigating around the site and can continue 
2) if has local data (not navigating) then show homepage ??
3) if NO local data then show login

/*******global variables*****/
var gEditView = false;
var gIsLoggedIn = false;

var url = window.location;
if (url.toString().includes("index-edit")) gEditView = true;

//get url param id and use to pass to lamda service to call content from mongodb
var urlParams = new URLSearchParams(url.search);
url_id = urlParams.get('id');
if ((url_id == "")||(url_id == null)){
	url_id = "1";	
}
				
/*******global variables*****/
function opentoID(){
	
}

//*********************/
/*******************
<img src="https://stackicm.s3.eu-west-1.amazonaws.com/criticalcare3.jpg"/
Need to update what's clickable and what's initially visible on the page.. 
****************** */
/***just to continue to display content and menu  - ie, logged in then returned to site with data in indexeddb*/
const verifyUserContent = async function(cidb, callbackFunction){
//function verifyUserContent(cidb, gDataSource){
	//document.getElementById("ca_loaders").style.display = "block";
	document.getElementById("ca_loaders").style.visibility = "visible";
	try {
		//from dl_1.js
		const userInfo = await getUserInfo(cidb, callbackFunction);
		//console.log ("userInfo=" + userInfo);
		//console.log ("userInfo[]" + + userInfo.length+ " " + userInfo[0]["section"]); //could be multiples
		//console.log ("bIsLoggedIn" + bIsLoggedIn); 
		if (userInfo.length != 0){
			//console.log("userInfo[0][\"section\"]" + userInfo[0]["section"]);
			const menuData = await callbackFunction(cidb, userInfo[0]["section"], userInfo[0]["section"]); //var x = await **calls different function based on edit or NOT edit */ //getIDBMenuData(cidb, url_id, sectionid);
			//await used so that printHomepage can include allowed links..							
			UserLoggedIn();
			const content = document.getElementById("content");
			content.innerHTML = printHomepage();
		}else{
			//***need to update these boxes in dl_1.js and prl_1.js to only be clickable if the user has access..
			UserLoggedOut("");
			//**********			
		}
		document.getElementById("ca_loaders").style.visibility = "hidden";
		//document.getElementById("para_loader").style.display = "none";
		//const rolesInfo = await dataBase.getRoles(userInfo);
		//const logStatus = await dataBase.logAccess(userInfo);
		return userInfo;
	}catch (e){
		//handle errors as needed
		//console.log("e" + e);
	}
};


//***THIS ALSO NEEDS TO CALLED WHEN LOGGING IN..... */
//***maybe a different function but similar architecture.... */
const verifyLogin = async function(cidb, callbackFunction, username, password){
   try {
		document.getElementById("ca_loaders").style.visibility = "visible";
       //const loginData = await handleLoginSubmit(username, password);
		const d1 = new Date().getSeconds();	
		//console.log ("HERE d1=" + d1);
		
		//handleLoginSubmit_new - uses fetch to check Mongo for User - and populates indexedDB with user, menu, and pages based on that user.
		//dl_1.js
		//fills local databases if user record found
		let jsonData = await handleLoginSubmit_new(username, password);  //calls JSON and fills local
		
		const d2 = new Date().getSeconds();	
		//console.log ("verifyLogin post filling - HERE d2=" + d2);
		
		//getUserInfo -> gets User information from ?indexedDB		
		//dl_1.js
		const userInfo = await getUserInfo(cidb, callbackFunction);
		
		if (userInfo.length != 0){
			//console.log ("userInfo NOT 0 ");
			UserLoggedIn();
			const content = document.getElementById("content");
			content.innerHTML = printHomepage();
			//content_main.innerHTML = printHomepage();
		}else{
			//console.log ("userInfo  0 ");
			UserLoggedOut("Not a valid user");
		}	
		document.getElementById("ca_loaders").style.visibility = "hidden";		
	//change the homepage links to active or not active based on the output of the above userInfo
	//ie, loop through and change to clicable the home page links
		
       //const rolesInfo = await dataBase.getRoles(userInfo);
       //const logStatus = await dataBase.logAccess(userInfo);
       return userInfo;
   }catch (e){
       //handle errors as needed
		switch(e.message) {
		  case "Failed to fetch":
		     //console.log("Really did fail to fetch");
		    break;
		  case "y":
		    // code block
		    break;
		  default:
		    // code block
		} 
		//console.log(e);
		
   }
};
//async function getUserInfo(cidb, callbackFunction){	
/****
With these Location object properties you can access all of these URL components and what they can set or return:
    href - the entire URL
    protocol - the protocol of the URL
    host - the hostname and port of the URL
    hostname - the hostname of the URL
    port - the port number the server uses for the URL
    pathname - the path name of the URL
    search - the query portion of the URL
    hash - the anchor portion of the URL
    origin - the window.location.protocol 
 */
function printHomepage(){
	var _pagecontent = ""; 
	//console.log("location.href" + location.href);
	//console.log("location.href" + location.pathname);
	_pagecontent = "<div class=\"pads\">";
			_pagecontent += 	"<div class=\"pad-top\">";
			_pagecontent += 		"<div class=\"pad1\"><a href=\"" + location.pathname + "?id=1\">FRCA Primary</a></div>";
			_pagecontent += 		"<div class=\"pad2\"><a href=\"" + location.pathname + "?id=2\">FRCA Final</a></div>";
			_pagecontent += 		"<div class=\"pad3\"><a href=\"" + location.pathname + "?id=4\">FICM</a></div>";
			_pagecontent += 	"</div>";
			_pagecontent += 	"<div class=\"pad-bottom\">";
			_pagecontent += 		"<div class=\"pad4\"><a href=\"" + location.pathname + "?id=\">Pain</a></div>";
			_pagecontent += 		"<div class=\"pad5\"><a href=\"" + location.pathname + "?id=58\">.......</a></div>";
			_pagecontent += 		"<div class=\"pad6\"><a href=\"" + location.pathname + "?id=4\">Thames valley CCC</a></div>";
			_pagecontent += 	"</div>";
			_pagecontent += "</div>";
			return _pagecontent;
}


//add in other features of being loggedIn
function UserLoggedIn (){
	document.getElementsByClassName('content')[0].style.height = '100%';
	const content = document.getElementById("content");
	content.style.display = "block";
	content.style.borderTop = "100px";

	const header = document.getElementById("header");
	header.style.background = "grey";
	
	const headerimage = document.getElementById("headerimage");
	headerimage.style.display = "block";
	headerimage.style.height = "0px";


	const login_form = document.getElementById("loginForm");
	login_form.style.display = "none";
}
//add in other features of being loggedIn
			//const content_main = document.getElementById("content_main");
			//content_main.innerHTML  = ""

function UserLoggedOut(_userMessage){
	//alert("in UserLogOut")
	const headerimage = document.getElementById("headerimage");
	headerimage.style.display = "none";
	
	document.getElementsByClassName('content')[0].style.height = '0%';
	const content = document.getElementById("content");
	content.style.display = "none";

	const login_form = document.getElementById("loginForm");
	login_form.style.display = "block";
	login_form.innerHTML += _userMessage;	
		//console.log("just before deleting datbases");
		//deleteDatabases("user"); //delete before recreating
		//deleteDatabases("menu"); //delete before recreating
		//deleteDatabases("pages"); //delete before recreating
		//show login form. 				
	document.getElementById("loginForm").onsubmit = function(e){
		e.preventDefault();
		//console.log("just before handleLoginSubmit");
		handleLoginSubmit_new(gDataSource);
	}
	//document.getElementById("para_loader").style.display = "none";
}

//////////////KEY PRESSING/////////////////
function edValueKeyPress(){
	var edValue = document.getElementById("searchbox");
	var s = edValue.value;
search(cidb, "fstore", s);   
}



//cidb, eTargetID, eTargetID
const printPage = async function(cidb, callbackFunction, eTargetID, eTargetID){
	
	document.getElementById("content").style.display = "none";		
	document.getElementById("ca_loaders").style.display = "block";

	//console.log ("menuData=" + menuData); //returns a PROMISE 							
	const menuData = await callbackFunction(cidb, eTargetID, eTargetID); //var x = await **calls different function based on edit or NOT edit */
	//console.log ("menuData=" + menuData); //returns a PROMISE 							

	document.getElementById("content").style.display = "block";		
	document.getElementById("ca_loaders").style.display = "none";

}


//********************************************************************//
/* options: 
1) link from Navigation
2) link from Page 
3) external link

1) and 2) would end up expanding the navigation...
to find if I have come from 1) I could navigate up the e.target tree.... 

if this link comes from the homepage boxes then the menu is not in-situ 
does it make sense to load a menu here?
const menuData = await callbackFunction(cidb, userInfo[0]["section"], userInfo[0]["section"]); //var x = await **calls different function based on edit or NOT edit */ //getIDBMenuData(cidb, url_id, sectionid);							

//				console.log("e.target.parent=" + e.target.parentNode.className);
//				console.log("e.target.href=" + e.target.href);
/////////	
function resolveLink_ExpandMenu_printPage(e){
	//what target is in the link - issue with expanding navigation where -- contain current url, 
	var loc_href = e.target.href 
	//to get start of url to add on the new ID
	var equalsLoc = loc_href.indexOf("?id=") + 4; //? + 3
	var eTargetID = loc_href.substring(equalsLoc, loc_href.length);
	var eTargetStart = loc_href.substring(0, equalsLoc); 
	var bMenuLink = false;
	var aLinks = new Array;
	//if (loc_href.indexOf("index.html") != -1) window.location = loc_href;
	//var newurl_id = window.location.toString().split("?id=").pop();

//console.log ("loc_href" + loc_href);

	//listElem needs expanding - when it first gets here - ie, from Homepage menu objects don't exist.'
	var listElem = document.getElementById("" + eTargetID);	

	expandorCollapseCurrent(listElem);

	if (e.target.attributes.length >1){
		bMenuLink = true;
	}
	var parID, secID
	try{
		aLinks = navigateUpTree(listElem, aLinks, bMenuLink, 0); 
		parID = aLinks[1]; 
		secID = aLinks[aLinks.length-1]; 		
		//alert(aLinks + "|||" + parID + " " + secID);
		history.pushState('data to be passed', 'Page Title', loc_href);
	}catch(e){
		//console.log("in catch statement for aLinks navigateUpTree()");
		parID = eTargetID;
		secID = eTargetID; 		
	}
	//console.log("parID=" + parID)
	//console.log("secID=" + secID)
	///*****NOT  printing getRemotePageData properly.... ?with or without EDIT...*/
	if (gPageDataSource == getRemotePageData){
		//console.log ("in resolveLink_ExpandMenu_printPage Remote=" + eTargetID + " " + eTargetID  + " " +  parID  + " " + secID);
		getRemotePageData(eTargetID, eTargetID, parID, "" , secID)
		
		if (gEditView){
			var pagecontent_Target = document.getElementById('content');
			pagecontent_Target.innerHTML = ""; //when not in edit mode the content is inputted like this.. in Edit mode just display form.
			document.getElementById("form1").style.display = "block";			
		}
	}else{
		//***difference between pages.html and pages-edit.html
		//if clicked on from the homepage end up here...
		//console.log ("in resolveLink_ExpandMenu_printPage IDB=" + eTargetID + " " + eTargetID  + " " +  parID  + " " + secID);
		getIDBPageData(cidb, eTargetID, eTargetID, parID, secID); //getContent function in cPage class js file		
	}

	//e.preventDefault();
	//getUserInfo(cidb, gDataSource); //onload just checks the user indexedDB and Menu (to make sure the user should be able to see content)
	//if comes from an a link then 				

}

//push into array then return array
function navigateUpTree(_testElem, _aLinks, _bMenuLink, _count){
//console.log("testElem has id =" + _testElem.hasAttribute("id"));
	if (_testElem == null){
		return;
	}else if (_testElem.hasAttribute("id")){
		if (_testElem.id == "html_menu"){
			_aLinks.push(_testElem.firstChild.id); //push SectionID
		}else{
			_aLinks.push(_testElem.id);			
		}
		if (_bMenuLink == false) expandMenuElement(_testElem)
		//alert(_testElem.nodeName + "||" + _testElem.id + "||" + _count );
	}
	_count = _count + 1;	
	if (_testElem.id != "html_menu") navigateUpTree(_testElem.parentElement, _aLinks, _bMenuLink, _count) 
	return _aLinks;
}

function expandMenuElement(_eElem){
	_eElem.setAttribute('aria-expanded', "true");
}

function expandorCollapseCurrent(listElem){
	try{
		//if the link comes from navigation then open and close need not include the parent... 	
		document.querySelectorAll('li').forEach(b=> {
			//console.log("b=" + b + " " + b.getAttribute('class'));
			if(b.getAttribute('class')!="no-break"){
				//console.log("in NOT no-break" + b.getAttribute('class'));
				b.removeAttribute('class')
			}
		});		
		if (listElem != null){
			if (listElem.getAttribute('class')!="no-break"){
				//if false 
				if (listElem.getAttribute("aria-expanded") == "false" || listElem.getAttribute('aria-expanded') ==  null) {
					listElem.setAttribute("aria-expanded", "true");
				} else {
					listElem.setAttribute("aria-expanded", "false");
					listElem.removeAttribute("class"); //remove ActiveClass
				}			
				if (listElem.getAttribute("open") == "false"){
					listElem.setAttribute("open", "true");
				}else if (listElem.getAttribute("open") == "true"){
					listElem.setAttribute("open", "false");					
				}else{
					//listElem.setAttribute("open", "true");					
				}
			}		
			
			//console.log(listElem.id);
			//console.log(listElem.nodeName);
			listElem.setAttribute("aria-expanded", "false");
			listElem.setAttribute("class", "active");				
			//console.log(listElem.getAttribute("class"));
		}
	}catch(e){ console.log ("Custom error : " + e)}

}
//********************************************************************//
function menuItem_click(evt, _pageid, _parentid, _sectionid){
	evt.preventDefault();
	var parElem = evt.target.parentElement;
	//parElem.style.backgroundColor = "red";
	//if (parElem.getAttribute('aria-expanded') == 'false' || parElem.getAttribute('aria-expanded') ==  null) {
	//	parElem.setAttribute('aria-expanded', "true");
	//} else {
	//	parElem.setAttribute('aria-expanded', "false");
	//}
	let result2 = url.toString().includes("index-edit");
	if (result2){
		history.pushState('data to be passed', 'Page Title', "index-edit?id=" + parElem.id);
	}else{
		history.pushState('data to be passed', 'Page Title', "index?id=" + parElem.id);
	}		
	//alert(parElem.id);
	//getContent and update page. 
	//getContent(_pageid, parElem.id, _parentid, _sectionid)
	///*****NOT  printing getRemotePageData properly.... ?with or without EDIT...*/
	//updatePage(_pageid, parElem.id, _parentid, _sectionid);					
}
	
		/*not used as not dynamically binding*/
	function addEvent_to_Menu(cMenuItem) {
		cMenuItem.addEventListener( 'click', evnt => {
		//check to see if menuItem if menuItem check to see if has Children
			cMenuItem.style.backgroundColor = "red";
			//alert(cMenuItem.parentElement.id);
			evnt.preventDefault();
		//closeNav();
		});
	}
	
	function addEvent(cItem){
		cItem.addEventListener( 'click', evnt => {
			//check to see if menuItem if menuItem check to see if has Children
			//evnt.preventDefault();
			closeNav();
		});
	}
	function changeNavState() {
		var sideNav = document.getElementById("mySidenav");
		if (sideNav.getAttribute("class") == "sidenav"){
			sideNav.style.width = "200px";	
			sideNav.setAttribute("class", "sidenav open");
		} else{
			sideNav.style.width = "0px";
			sideNav.setAttribute('class', "sidenav");
		}
	  	//document.getElementById("main").style.marginLeft = "250px";
	}
	
	function closeNav() {
		var sideNav = document.getElementById("mySidenav");
	  	sideNav.style.width = "0";
		sideNav.setAttribute('class', "sidenav");
	  //document.getElementById("main").style.marginLeft= "0";
	}
/*FUNCTIONS*/
//**************************Shared functions with callbackFunction passed through******************************************//
//This function expands and collapses the Q/A bars 
function expand_collapse(evt){
	//var coll = document.getElementsByClassName("collapsible");
	//var i;
	//for (i = 0; i < coll.length; i++) {
	//  coll[i].addEventListener("click", function() {
	//var parElem = evt.target.parentElement;
	//alert(evt.target);
	var event_Button = evt.target;
	event_Button.classList.toggle("active");
	//event_Button.style.backgroundColor = "red"; //only updates on click
	var content = event_Button.nextElementSibling;
	if (content.style.maxHeight){
		content.style.maxHeight = null;
	} else {
		content.style.maxHeight = content.scrollHeight + "px";
	} 
	//});
//}
}


function addEvent(cItem){
	cItem.addEventListener( 'click', evnt => {
		//check to see if menuItem if menuItem check to see if has Children
		//evnt.preventDefault();
//alert("addEvent" + document.getElementById("loginForm")); //null
		closeNav();
	});
}
function changeNavState() {
	var sideNav = document.getElementById("mySidenav");
	if (sideNav.getAttribute("class") == "sidenav"){
		sideNav.style.width = "210px";	
		sideNav.setAttribute("class", "sidenav open");
	}else{
		sideNav.style.width = "0px";
		sideNav.setAttribute('class', "sidenav");
//id="content"
	//alert("changeNavState=" + document.getElementById("content")); //null
	}
}
function closeNav() {
	var sideNav = document.getElementById("mySidenav");
	sideNav.style.width = "0";
	sideNav.setAttribute('class', "sidenav");
	//document.getElementById("main").style.marginLeft= "0";
}





function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

