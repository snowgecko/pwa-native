// creating a class
//notation _id internal variable. 

class Menu {
  	constructor(id, sectionid) {
    	this._id = id;
		this._sectionid = sectionid;
		this._pageArray = new Array(); 
  	}
	set id(x){
		this._id = x;
	}
	get id(){
		if ((this._id == null)|| (typeof this._id == 'undefined')) this._id = 0;
		return this._id;
	}
	set parentid(x){
		this._parentid = x;
	}
	get parentid(){
		//if ((this._sectionid == null)|| (typeof this._sectionid == 'undefined')) this._sectionid = 0;
		return this._parentid;
	}
	set pageorder(x){
		this._pageorder = x;
	}
	get pageorder(){
		//if ((this._sectionid == null)|| (typeof this._sectionid == 'undefined')) this._sectionid = 0;
		return this._pageorder;
	}
	set sectionid(x){
		this._sectionid = x;
	}
	get sectionid(){
		//if ((this._sectionid == null)|| (typeof this._sectionid == 'undefined')) this._sectionid = 0;
		return this._sectionid;
	}
	set pageid(x){
		this._pageid = x;
	}
	get pageid(){
		//if ((this._sectionid == null)|| (typeof this._sectionid == 'undefined')) this._sectionid = 0;
		return this._pageid;
	}
	set sectionname(x){
		this._sectionname = x;
	}
	get sectionname(){
		//if ((this._sectionid == null)|| (typeof this._sectionid == 'undefined')) this._sectionid = 0;
		return this._sectionname;
	}
	
	//iterate up menu till you get to parentid = 0 then get name and go through cases. 
	set color(x){
		//based on value then set background colors and menu
		switch(x) {
		    case 1:  
		        // body of case 1
				this._bgcolor = "#1a2238"
				//loadPrimary Navigation etc  json file
		        break;
		    case 2:  
		        // body of case 2
				this._bgcolor = "#490b3d"
		        break;
		    case 3:
		        // body of case N
				this._bgcolor = "#ff6a3d"
		        break;	
		    case 4:
		        // body of case N
				this._bgcolor = "#60c2d3"
		        break;	
		    case 58:  
		        // body of case 1
				this._bgcolor = "#bd1e51"
				//loadPrimary Navigation etc  json file
		        break;
	    	default:
		        // body of case default
				this._bgcolor = "#bd1e51"
		}		
		document.getElementById("header").style.backgroundColor = this._bgcolor; 

	}
	get color(){
		return this._bgcolor;
	}
	
	//METHODS
	//TODO ****need to iterate and populate array so that the menu expands
	////***only good for three levels */
	//Not know being used...
	findSectionwIDB_(_menu_cont, _id, _count, _arr, _sectionid){
		//console.log("in findSectionwIDB_ Function");
		//console.log("_menu_cont=" + _menu_cont);
		//console.log("_id=" + _id);
		try{
			let menu_obj = _menu_cont.find(el => el.id === parseInt(_id));		
				this.id = menu_obj["id"];
				this.pageid = menu_obj["pageid"];
				this.parentid = menu_obj["parentid"];
			let section_obj = _menu_cont.find(el => el.id === parseInt(_sectionid));		
				this.sectionid = section_obj["sectionid"];
				this.sectionname = section_obj["pagename"];
				this.color = this.sectionid;	
			if ((menu_obj["parentid"] == 0) || (_count == 10)){
								
			}else{
				
			}			
			_arr.push(this.sectionid);
			_arr.push(this.parentid);
			_arr.push(this.id);
			//console.log ("_arr" , _arr)
		}catch(e){
			console.log ("URL id does not match any page in the Users page array either in IndexDB or fetch")
		}
		
	}
	//iterate up pages tree to find the parent node
	//** */TYPE ERROR 127 when ID no go.... fix with error trapping**
	findSection(menu_cont, _id, _count, _arr){
		console.log("_id" + parseInt(_id));	
		console.log("menu_cont=" + menu_cont[0].id);
		let menu_obj = menu_cont.find(el => el.id === parseInt(_id));
		if (_count == 0) {
			this.pageid = menu_obj["pageid"];
			this.parentid = menu_obj["parentid"];
			console.log ("page[\"pageid\"]" + page["pageid"]);
			console.log ("pageid" + this.pageid);
			console.log ("parentid" + this.parentid);
		}
		//console.log (page["parentid"]);
		if ((menu_obj["parentid"] == 0) || (_count == 5)){
			this.sectionid = menu_obj["id"];
			this.sectionname = menu_obj["pagename"];
			//console.log (this.sectionname);
			this.color = menu_obj["id"];
			//return page["id"];
		}else {
			_count = _count + 1;
			this.findSection(menu_cont, menu_obj["parentid"], _count, _arr)
		}
		_arr.push(_id);
	//console.log ("_arr" , _arr)
		return _arr;
	}
	/************ set menu object params using ID record and SectionID record */*////
	/////can't remove this for some reason!!!!!'
	findSectionwIDB(_menu_cont, _id, _count, _arr, _sectionid){
	}

	//using filter to first filter out parent pages THEN print the rest of the menu
	//menu.filter_populateMenu(cont, url_id, _sectionid);	 
	//cont [Menu content from indexedDB], url_id (parsed querystring), _sectionid = sectionid from UserDB	
	filter_populateMenu(menu_cont, _menuid, _sectionid, _source){
		//add in eventlistener
		//item.addEventListener("click", toggleItem, false);
		var _html_menu = "";			
		var current_page = "";
		var sCMenu;
		var _count = 0;
		var html_count_string = ""
		var titleTarget = "", editViewUrl = "";
	
		//console.log("menu_cont" + menu_cont); //object array	
		//this.id is set in the setters and getters above when Menu class is instantiated.
		//-----------finds SECTION details -------------------------///
		//iterates up the tree to find the sectionID - can use to get an Array - starting with the sectionID and each [] node down.
		var arr = [];
		if (_source == "remote"){
			//editViewUrl = "-edit";	
			console.log("remote");
			console.log("this.id" + this.id);
			this.findSection(menu_cont, this.id, 0, arr); //setting the sectionid
		}else{
			console.log("IDB");
			this.findSection(menu_cont, this.id, 0, arr, _sectionid);
		}
		//if (_sectionid != null) this.sectionid = _sectionid		
		if (this.sectionname != null ){
			titleTarget = document.getElementById('section_title');
			titleTarget.innerHTML = this.sectionname;
			_html_menu += "<li id=\"" + this.sectionid + "\" class=\"no-break\"><a href=\"./index.html\">Home&nbsp;&nbsp;></a><a href=\"./pages" + editViewUrl + "?id=" + this.sectionid  + "\">&nbsp;&nbsp;Section Home</a></li>";	
		}else{
			//No section ?The current URL does not match a record in the IndexedDB or the fetch
		}
		//check filter function		
		var parentpages = this.filterRootPages(menu_cont); //will return nothing but not error if no page match		
		//console.log("parentpages=" + parentpages);
		var bExpandedText = "";
		//**INFO*/this loop stops me from merging the two functions - because I quickly grab the parentpages - ie, parentid = 0 and create menu from there. 
		//rather than passing through pages (data from fetch) and using for loop to find page objects where parentid = 0 
		//which would allow me to merge the two functions. 
		//console.log(parentpages)
		for (var page of parentpages)  //looping around the parentpages
		{
			//[shared start]
			current_page = "";
			html_count_string = "";
			bExpandedText = "false";
			
			//console.log("page.id=" + page.id + " this.id=" + this.id);
			//need to know if the page.id is a sub-or sub-sub page.etc. 
			if(page.id == this.id) {
				this.pageorder = page.pageorder;
				current_page = " class=\"active\" "; //can I open the parent page by using current class?
			}
			//if (arr[1]==page.id) console.log ("arr[1]=page.id") //8,8 and 8,9
//Object.keys(page).forEach(prop => console.log(prop))
//console.log ("page.id=" + page.id) //8,8 and 8,9
//console.log ("page.pageorder=" + page.pageorder) //8,8 and 8,9
//console.log ("this.id" , this.id) //8,8 and 8,9	
//console.log ("current_page=" + current_page) //8,8 and 8,9
			if (arr[1]==page.id) bExpandedText = "true";
			//call populateSubPages to get substring and count 
			sCMenu = this.populateSubPages(menu_cont, page.id, "", 0, arr); //passing through the whole pages data returned by json.fetch
			//console.log("/////" + page.pagename + "|||" + sCMenu[0]+ "|||" + sCMenu[1] + "//////");
			if (sCMenu[1] != 0 ) html_count_string = "<div class=\"right-align\">[" + sCMenu[1] + "]</div>";	
			//aria-expanded=\"false\"  update to aria_expanded to true if arr[1]=page.id
			_html_menu +=  "<li id='" + page.id + "' aria-expanded=\"" + bExpandedText + "\" " + current_page + ">"  
			_html_menu +=  	"<a onclick=\"menuItem_click(event," + page.pageid + "," + page.parentid + "," + page.pageorder + "," + this.sectionid + ")\" href='pages.html?id=" +  page.id + "'" + current_page + ">" + page.pagename + html_count_string + "</a>";
			_html_menu +=  		sCMenu[0];			
			_html_menu +=  "</li>";
			_count = _count + 1
			//[shared finish]
		}		
		//PRINT MENU
		var menuTarget = document.getElementById('html_menu');
		menuTarget.innerHTML = _html_menu;
		return "";
		//temp call pageUpdate from here. 
		
		//console.log(_html_menu)
		//menuTarget.appendChild(this.renderList(this.x));
	}
	populateSubPages(pages, _parentid, _html_menu, _count, _arr){
		var current_page = "";
		var html_count_string = "";
		var sCMenu;
		var bExpandedText = "";

		_html_menu = _html_menu + "<ul>";
		for (var page of pages) {
	   		if(page.parentid == _parentid) {
				//[shared start]
				current_page = "";
				html_count_string = "";
				bExpandedText = "false";

				//console.log("page.id=" + page.id + " this.id=" + this.id);
				if(page.id == this.id){
					this.pageorder = page.pageorder;
					current_page = " class=\"active\" ";
				} 
				if (_arr[2]==page.id) bExpandedText = "true";
				//console.log("current_page=", current_page);
//Object.keys(page).forEach(prop => console.log(prop))
//console.log ("page.id=" + page.id) //8,8 and 8,9
//console.log ("page.pageorder=" + page.pageorder) //8,8 and 8,9
				//call populateSubPages to get substring and count 
				sCMenu = this.populateSubPages(pages, page.id, "", 0, _arr); //passing through the whole pages data returned by json.fetch
				//console.log("/////" + page.pagename + "|||" + sCMenu[0]+ "|||" + sCMenu[1] + "//////");
				if (sCMenu[1] != 0 ) html_count_string = "<div class=\"right-align\">[" + sCMenu[1] + "]</div>";	
				_html_menu = _html_menu + "<li id='" + page.id + "' aria-expanded=\"" + bExpandedText + "\" " + current_page + ">"  
				_html_menu = _html_menu +	"<a onclick=\"menuItem_click(event," + page.pageid + "," + page.parentid + "," + page.pageorder +"," + this.sectionid + ")\" href='pages.html?id=" +  page.id + "'" + current_page + ">" + page.pagename + html_count_string + "</a>";
				_html_menu = _html_menu + sCMenu[0];			
				_html_menu = _html_menu + "</li>";
				_count = _count + 1
				//[shared finish]
	   		}
		}	
		_html_menu = _html_menu + "</ul>";
		return [_html_menu, _count];				
	}
	
	
		//var result = pages.filter(function(page){
 		//   return page.parentid === 0;
		//});
		//if(result.length){         // If there are any results, then
    		//console.log(result[0]) // `result[0]` is the app with the right name.
    		//console.log(result.length) // `result[0]` is the app with the right name.
		//}
		//need to iterate up the tree to find node with parentid = 0 
		//if this.id.parentid = 0 then change header color. 
	filterRootPages(pages){
		var parent_pages_filter = pages.filter( page => page.parentid == this.sectionid)
		//console.log(parent_pages_filter)
		return parent_pages_filter;
	}

	populateMenuArray(pages){
		//**if I ever need to convert the JSON object to an array */
		this.menuArray = Array.from(pages, x=>x);
	}
	//?either use array or not 
	//find all nodes with parent id = 0 then parent id = last parentid etc. 
	//
	populateMenu(pages){
		//**if I ever need to convert the JSON object to an array */
		//this.menuArray = Array.from(pages, x=>x);
		var html_menu = "";
		for (var page of pages) 
		{
			html_menu = html_menu + "<li><a class=\"content\" href=\"pages.html?id=" + page.id + "\">" + page.pagename + "</li>"
			//console.log(page.pagename); // John
 		 	//document.write(page.name + "<br />");
		}
		//PRINT MENU
		var menuTarget = document.getElementById('html_menu');
		//menuTarget.appendChild(this.renderList(this.x));
		menuTarget.innerHTML = html_menu;		
	}
	
	renderList(obj) {
		//for every level of our JSON object, we create a ul element
		var result = document.createElement('ul');
		//for every key in the object
	  	for (key in obj) {
			//create a li element and create/add a capitalized copy of the key
	    	var list = document.createElement('li')
	    	var textnode = document.createTextNode(key);
	    	list.appendChild(textnode);
			//     if there's another level to the object, recursively call our function
			//     this will create a new ul which we'll add after our text
	    	if (typeof obj[key] === 'object') {
	      		list.appendChild(renderList(obj[key]));
	    	} else {
				//       otherwise it must be a price. add ': ' and the value to the text
	      		textnode.textContent += ': ' + obj[key];
	    	}
			//     add our completed li to the ul
	    	result.appendChild(list); 
	  	}
		//console.log(result);

		return result;
	}
}
///close of cMenu 

