
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
