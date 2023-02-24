window.onload = function () {
			/*******event listeners*****/			
		const contentItems = document.querySelectorAll(".content");
		contentItems.forEach(function(cItems) {
			//alert(cItems);
			addEvent(cItems);
		});				
		document.querySelector( 'a[href="#menu"]' )
			.addEventListener( 'click', e => {
				//alert("in query selector hash menu")
				e.preventDefault();
				changeNavState(); //called from functions_shared.js - simply changes classes
		});
		document.body.addEventListener("click", function(e) {
			// e.target was the clicked element
			//beasts.indexOf('bison')
			e.preventDefault();
			//e.target.getAttribute('class').indexOf("collapsible") == "-1")
			//alert(e.target.nodeName); //the expand and collapse sections are also buttons?
			if(e.target.id == "submitBtn"){
				var username = document.getElementById("username").value;
				var password = document.getElementById("password").value;
				///************************VERIFYLOGIN - needs to be called from LoginForm AND onload**************
				const output = verifyLogin(cidb, gDataSource, username, password);
				//cannot refer to output because it is just a PROMISE AND can't await it because i'm not in a module.

				//handleLoginSubmit(gDataSource);		//handleLoginSubmit() in functions_shared.js
				//check this to see if the object goes... 		
			}else if(e.target && e.target.id == "logout") {
				///**clicked on LOGOUT in menu in ***functions_shared.js***					
				UserLoggedOut();					
				changeNavState();
				//the login form in null?? don't know why'
				//what about set sectionid == null
			}else if(e.target && e.target.nodeName == "A") {
				//console.log("e.target.parent=" + e.target.parentNode.className);
				//console.log("e.target.href=" + e.target.href);
				var loc_href = e.target.href 
				//to get start of url to add on the new ID
				var equalsLoc = loc_href.indexOf("?id=") + 4; //? + 3
				var eTargetID = loc_href.substring(equalsLoc, loc_href.length);
				//if not a menu expansion
				if(e.target.parentNode.className.indexOf("pad")!=-1){
					//var loc_href = e.target.href 
					history.pushState('data to be passed', 'Page Title', e.target.href );
					console.log("loc_href=" + loc_href);
					console.log("eTargetID=" + eTargetID);
					//calls menu before user has picked section
					//getIDBMenuData(cidb, url_id, sectionid);
					const menuData = gDataSource(cidb, eTargetID, eTargetID); //var x = await **calls different function based on edit or NOT edit */ 							
				}
				if (e.target.href.indexOf("#menu") == -1){
					resolveLink_ExpandMenu_printPage(e);	
				} 
				//changePage();
			}else{
				//console.log ("on click with no event listener attached");
			}
		});
		//document.body.addEventListener
		//document.getElementById("searchbox").addEventListener("keypress", edValueKeyPress);
		
		/*******event listeners*****/
	
}
