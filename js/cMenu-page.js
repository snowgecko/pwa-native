				/*
				window.document.onload = function(e){ 
    				console.log("document.onload", e, Date.now() ,window.tdiff,(window.tdiff[0] = Date.now()) && window.tdiff.reduce(fred) );
					
					var html_div_obj = document.getElementById("html_menu");
					var ul_menuItems = html_div_obj.querySelectorAll(".menu_item"); 
					ul_menuItems.forEach(addEvent_to_Menu);
					let numb = html_div_obj.querySelectorAll(".menu_item").length;
					alert(numb); //0 //BECAUSE MENU IS ASYNCHRONOUS - NOT LOADED YET...
				}*/
				/*
				<!-- .sidenav #menu #htm_menu ul -->
				//var appsMenuItems = document.querySelectorAll('#appmenu > li');
				event.preventDefault();
					//history.pushState({page: 1}, "title 1", "?page=1")
					//alert(evt.parentElement.id);
					//alert(cMenuItem.parentElement.id);					
				return false;
				*/
	
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
				
				
/*
			var menu = new MmenuLight(
				document.querySelector( '#menu' ),
				'all'
			);
			var navigator = menu.navigation({
				 title: 'Menu',
				 slidingSubmenus: false,
				 selectedClass: 'selected'
				 //theme: 'dark',
			});
			var drawer = menu.offcanvas({
				// position: 'left'
			});
			//	Open the menu.
			document.querySelector( 'a[href="#menu"]' )
				.addEventListener( 'click', evnt => {
					evnt.preventDefault();
					drawer.open();
					//document.querySelector( '.mm-ocd--open' ).style.max-width = "20em";
				});
			const contentItems = document.querySelectorAll(".content");
			contentItems.forEach(function(cItems) {
				addEvent(cItems);
			});
			function addEvent(cItem){
		  		cItem.addEventListener( 'click', evnt => {
					//evnt.preventDefault();
					//alert(evnt.srcElement);
					drawer.close();
				});
			}
*/