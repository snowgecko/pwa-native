
/*******global variables*****/
var gEditView = false;
var gIsLoggedIn = false;

var url = window.location;
if (url.toString().includes("pages-edit")) gEditView = true;

//get url param id and use to pass to lamda service to call content from mongodb
var urlParams = new URLSearchParams(url.search);
url_id = urlParams.get('id');
if ((url_id == "")||(url_id == null)){
	url_id = "1";	
}

/*******global variables*****/
function opentoID(){
	
}

/*FUNCTIONS*/
//**************************Shared functions with callbackFunction passed through******************************************//
async function handleLoginSubmit (callbackFunction) {
	//...pass through username and password... 
	//[sectionid, menupages, contentpages]
	//[0] array used for information
	var username = document.getElementById("username").value;
	var password = document.getElementById("password").value;
	///
	//document.getElementById("para_loader").style.display = "block";

	fetch("https://sm5a54kkhi.execute-api.eu-west-1.amazonaws.com/default/listPages?username=" + username + "&password=" + password)
		.then(response => response.json()) //NEW condensed
		.then(data => { 
			//if no section returned then data[0] = null otherwise section_id is data[0]
			//if password incorrect then data[1] == "password incorrect" //data[1] contains empty array [] 
			//try{
			console.log("data[1].length" + data[1].length);
			let array_length = data[1].length; 
			if (array_length > 1){ //ie, if menupages array length contains more than 1 record.
				indexdb_fill(data).then(() => { 
					//console.log(data);
					//document.getElementById("loginForm").style.display = "none";	
					getUserInfo(cidb, callbackFunction); //calls menu from UserInfo function			
					//if (data[0][0].section != NaN) window.location = "pages.html?id=" + data[0][0].section;
				});
			}else if(array_length == 1){ //if contains 1 record that record will be a "password incorrect" record
				document.getElementById("passwordmessage").innerHTML = data[1][array_length-1];		
				document.getElementById("loginForm").onsubmit = function(e){
					e.preventDefault();
					handleLoginSubmit(callbackFunction);
				};
			}	
			//}catch(e){
			//	document.getElementById("content_main").innerHTML += e
			//}
			//alert(document.getElementById("loginForm"));
			//document.getElementById("para_loader").style.display = "none";
		}); 
	//...don't think I need JWT at present'
  	// Extract the JWT from the response
  	//const { jwt_token } = await response.json()
  	// Do something the token in the login method
  	//await login({ jwt_token })
}


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


//add in other features of being loggedIn
function UserLoggedIn (){
	//document.getElementById("loginForm").style.display = "none";	
	//document.getElementById("para_loader").style.display = "none";
	document.getElementById("content_main").style.display = "block";
	document.getElementsByClassName('content')[0].style.height = '100%';
}
//add in other features of being loggedIn
function UserLogOut(){
	//alert("in UserLogOut")
	document.getElementsByClassName('content')[0].style.height = '0%';
	document.getElementById("content_main").style.display = "none";
	document.getElementById("loginForm").style.display = "block";	
console.log("just before deleting datbases");
		deleteDatabases("user"); //delete before recreating
		deleteDatabases("menu"); //delete before recreating
		deleteDatabases("pages"); //delete before recreating
		//show login form. 				
		document.getElementById("loginForm").onsubmit = function(e){
			e.preventDefault();
console.log("just before handleLoginSubmit");
			handleLoginSubmit(gDataSource);
		}
	//document.getElementById("para_loader").style.display = "none";
}



function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
