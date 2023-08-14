/*******************
on arrival to the site the User is checked via verifyUserContent 
1) if has local data and isLoggedIn then is actively navigating around the site and can continue 
2) if has local data (not navigating) then show homepage ??
3) if NO local data then show login

/*******global variables*****/
var gEditView = false;
var gIsLoggedIn = false;

var url = window.location;
//var protocol  = url.protocol

if (url.toString().includes("index-edit")) gEditView = true;

//get url param id and use to pass to lamda service to call content from mongodb
var urlParams = new URLSearchParams(url.search);
url_id = urlParams.get('id');
if ((url_id == "")||(url_id == null)){
	url_id = "1";	
}
console.log("url_id" + url_id);

/*******global variables*****/
function opentoID(){
	
}

///called when page refreshed or newly arriving at site 
const verifyUserContent = async function(cidb, callbackFunction){
	try {
		//console.log("in verifyUserContent");
		ca_loaders.style.visibility = "visible";	
		////getUserInfo in dl_1.js
		userInfo = await getUserInfo(cidb, callbackFunction); 
		if (userInfo.length != 0){
			//console.log ("userInfo[0][section]" + userInfo[0]["section"])
			/**does it make sense to call the menu here - it loads even if homepage is landed on (from refresh) */
			const menuData = await callbackFunction(cidb, userInfo[0]["section"], userInfo[0]["section"]); 
			UserLoggedIn();
			resolveLink_ExpandMenu_printPage(url_id); 
		}else{
			UserLoggedOut("");
		}
		ca_loaders.style.visibility = "hidden";
		return userInfo;
	}catch (e){
	}
};

const updateContent = async function(cidb, username, password){
	//****calls fetch JSON and fills local indexedDB with menu (and pages async)
	//let jsonData = await handleUpdateContent(username, password);  
	let jsonData  =  fetch("https://rcsc26l72a.execute-api.eu-west-1.amazonaws.com/default/listUserMenu?username=" + username + "&password=" + password)
		.then(response => response.json())
		.then(data => indexdb_fill(data))
		.catch(error => console.log(error))
		.finally(() => console.log("finally"))
}
/***
	//called when logging in from index.html
 **/
//***maybe a different function but similar architecture.... */
const verifyLogin = async function(cidb, callbackFunction, username, password){
   	try {
		ca_loaders.style.visibility = "visible";
		const d1 = new Date().getSeconds();	
		//****calls fetch JSON and fills local indexedDB with menu (and pages async)
		let jsonData = await handleLoginSubmit_new(username, password);  

		//****   *******************////
		const d2 = new Date().getSeconds();	
		userInfo = await getUserInfo(cidb, callbackFunction);

		if (userInfo.length != 0){
			UserLoggedIn();
			homepageNode.style.display = "block";
			if (bEditMode) formNode.style.display = "none";	
		}else{
			UserLoggedOut("Not a valid user");
		}	
		ca_loaders.style.visibility = "hidden";		
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
	const content = document.getElementById("content_variable");
	content.style.display = "block";
	content.style.borderTop = "100px";

	const header = document.getElementById("header");
	header.style.background = "grey";
	
	const headerimage = document.getElementById("headerimage");
	headerimage.style.display = "block";
	headerimage.style.height = "0px";

	//const login_form = document.getElementById("loginForm");
	//login_form.style.display = "none";
}
//add in other features of being loggedIn
			//const content_main = document.getElementById("content_main");
			//content_main.innerHTML  = ""

function UserLoggedOut(_userMessage){
	const headerimage = document.getElementById("headerimage");
	headerimage.style.display = "none";
	
	document.getElementsByClassName('content')[0].style.height = '0%';
	//content.style.display = "none";
	loginNode.style.display = "block";
	
	// store the result of opening the database in the db variable.
	//db = DBOpenRequest.result;
	// now let's close the database again!
	//db.close()

	//loginNode.innerHTML += _userMessage;		
	//cidb.kill("menu"); //destroy the Temp user table			  		
	//cidb.kill("pages"); //destroy the Temp user table			  		

		//set defaults 
		homepageNode.style.display = "none";
		pagecontent_div.style.display = "none";		
		loginNode.style.display = "block";

	document.getElementById("loginForm").onsubmit = function(e){
		e.preventDefault();
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
*/////////	
function checkPageID(eID){
	var loc_href, equalsLoc, eTargetID, eTargetStart; 
	try{
		loc_href = eID.target.href;  //not always coming from a link...
		equalsLoc = loc_href.indexOf("?id=") + 4; //? + 3
		eTargetID = loc_href.substring(equalsLoc, loc_href.length);
		eTargetStart = loc_href.substring(0, equalsLoc); 
	}catch(e){
		//different type e = ID 
		if(isNaN(eID)){
			loc_href = 0;
		}else{
			eTargetID = eID;
		}		
	}
	return eTargetID;
}

/******************/ 
/* could recieve an e event or a url string
 * e event from menu click 
 * string urlid - from const verifyUserContent = async function(cidb, callbackFunction) - url set as global
 * called after onload 
 */
function resolveLink_ExpandMenu_printPage(e){
	//console.log ("resolveLink_ExpandMenu_printPage e or url_id=" + e)
	var bMenuLink = true;
	var aLinks = new Array;
	var parID, secID

	var eTargetID = checkPageID(e); //returns targetID from multiple sources
	var listElem = document.getElementById(eTargetID);	
	//console.log ("listElem=" + listElem) //not yet populated tree **so this is null when using url_id from url
	expandorCollapseCurrent(listElem); //needs to find listElem - its what the expand and display relys on

	//navigate up the Tree - if listElem is there then expand, and call page, etc
	//if listElem is NOT there then 
	//1) is this user allowed to access ?
	//2) should I display something else ?
	try {
		//console.log("e.target.attributes.length" + e.target.attributes.length);
		if (e.target.attributes.length >1) bMenuLink = true;
	}catch(e){
		bMenuLink = false;
	}
	//needs to go up to the top....
	try{
		aLinks = navigateUpTree(listElem, aLinks, bMenuLink, 0); 
		parID = aLinks[1]; 
		secID = aLinks[aLinks.length-1]; 	//XCHECK USER SECTION //url.protocol + url.hostname	
		//history.pushState('data to be passed', 'Page Title', url.pathname + "?id=" + eTargetID);
	}catch(e){
		//console.log("ERROR in resolveLink_ExpandMenu_printPage")
		parID = 4; ///***REFACTOR - HARDCODED BADNESS */
		secID = 4; 		
	}
	//console.log("after navigateUpTree" + parID, secID + "bMenuLink=" + bMenuLink)
	//console.log (userInfo[0]["section"]);
	//console.log ("parID in resolveLink_ExpandMenu_printPage=" + parID);
	//switch maybe better.
	const parsed = parseInt(eTargetID);
	message.innerHTML = "<p></p>"			
	switch(parsed) {
  		case NaN:
  		case null:
    		showError();
    		break;
  		case 0:
    		displayHomepageDivs();
    		break;
  		default:
			//needs to be changed to reflect the new userInfo DATASET.
    		// code block //need to add on for multiple allowed section 
			secID = parseInt(secID);
			//console.log("from resolveLink_ExpandMenu_printPage secID=" + secID);

			console.log ("eTargetID=" + eTargetID)
			console.log("userInfo[0][section])" + userInfo[0]["section"], secID) //if no listelem then secID is eTargetID

			if (Array.isArray(userInfo[0]["section"])){
				if (userInfo[0]["section"].includes(secID)) {
					if (gPageDataSource == getRemotePageData){
						//if this is inputed incorrectly then it will populate the form and re-submission will be wrong!!!
						getRemotePageData(eTargetID, eTargetID, parID, "" , secID)
					}else{
						getIDBPageData(cidb, eTargetID, eTargetID, parID, secID); //getContent function in cPage class js file		
					}			
					displayContentDivs();
				}else{
		    		displayHomepageDivs();
					message.innerHTML = "<p>User does not have access to other sections</p>"								
				}
			}else if (secID == userInfo[0]["section"]){  ///if coming from userlogin then navigate to page via pads ERROR
				if (gPageDataSource == getRemotePageData){
					//if this is inputed incorrectly then it will populate the form and re-submission will be wrong!!!
					getRemotePageData(eTargetID, eTargetID, parID, "" , secID)
				}else{
					getIDBPageData(cidb, eTargetID, eTargetID, parID, secID); //getContent function in cPage class js file		
				}			
				displayContentDivs();
			}else{
	    		displayHomepageDivs();
				message.innerHTML = "<p>User does not have access to other sections</p>"			
			}
	} 
}

function showError(){
	
}
function displayHomepageDivs(){
	if (bEditMode) {
		formNode.style.display = "none";	
	}else{
		pagecontent_div.style.display = "none";						
	}
	loginNode.style.display = "none";
	homepageNode.style.display = "block";	
}
function displayContentDivs(){
	if (bEditMode){
		formNode.style.display = "block";	
	}else{
		pagecontent_div.style.display = "block";						
	}
	homepageNode.style.display = "none";
	loginNode.style.display = "none";		
}

//push into array then return array
//doesn't work if on section page...'
function navigateUpTree(_testElem, _aLinks, _bMenuLink, _count){
	if (_testElem == null) return;  //on refresh

	var parElem = _testElem.parentElement;
	switch(_testElem.nodeName) {
	  case null:
	    return;
	  case "LI":
		if (_testElem.hasAttribute("id")){
			_aLinks.push(_testElem.id);	//
			if ((parElem.id == "html_menu") && (_testElem.id == parElem.firstChild.id)){ //then on Section page..
				_aLinks[1] = "0";
			}
			if (_bMenuLink == false) expandMenuElement(_testElem)
			navigateUpTree(parElem, _aLinks, _bMenuLink, _count + 1)
		}
	    break;
	  case "UL":
		parElem = _testElem.parentElement;
		navigateUpTree(parElem, _aLinks, _bMenuLink, _count + 1)
	    break;
	  case "DIV":
		if (_testElem.id == "html_menu"){
			_aLinks.push(_testElem.firstChild.id); //push SectionID
			//_aLinks.push("0");		
			//console.log(_aLinks);
		}
	    break;
	  default:
		break;
	   //code block
	} 
	return _aLinks;
}

function expandMenuElement(_eElem){
	_eElem.setAttribute('aria-expanded', "true");
}

//****REFACTOR - do I need to sort this so it expands at sub-levels */
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
	let result2 = url.toString().includes("index-edit");
	if (result2){
		history.pushState('data to be passed', 'Page Title', "index-edit?id=" + parElem.id);
	}else{
		history.pushState('data to be passed', 'Page Title', "index?id=" + parElem.id);
	}		
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

