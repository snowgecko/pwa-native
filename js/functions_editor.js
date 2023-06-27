//********************************************///////
if(gEditView){
}
//********************FUNCTIONS************************	///////
// Used during the page creation process				//////
///////??do I need to keep the result2 check?? - I don't think I need this on pages.html'

/*This function is called from each Menu click*/ /** called from cMenu-page.js***/
function updatePage(_pageid, _id, _parentid, _sectionid){
	let page1 = new Page(_pageid);
	let result2 = url.toString().includes("index-edit");
	if (result2){
		page1.pageContentEdit(_pageid, _id, _parentid,  _sectionid);								
	}else{
		page1.pageContent(_pageid, _sectionid);					
	}		
}
async function savePage(){
	//posted id to addPage is menuid - as addpage adds record to Menu and Pages data
	document.getElementById("content_main").classList.add("disable-form");
	var menuID = document.getElementById("editable_id").value;
	var secID = document.getElementById("editable_sectionid").value;
	//element.classList.add("mystyle");
	var jsonData = JSON.stringify({ 
		id: menuID, 
		parentid: document.getElementById("editable_parentid").value, 
		sectionid: secID, 
		pageid: document.getElementById("editable_pageid").value, 
		pageorder: document.getElementById("editable_pageorder").value, 
		"pagename": document.getElementById("editable_name").value, 
		"content": tinyMCE.get('editable_content').getContent(), 
		"questions" : "[" + writeSubArray() + "]"
	})
	console.log ("jsonData" + jsonData);
	let response = await fetch('https://bbx8g5lf6a.execute-api.eu-west-1.amazonaws.com/default/addpage', {
		method: 'POST',
		body: jsonData
	});
	let result = await response.json();
	let parsedData = JSON.parse(result.body);
	//console.log(parsedData.id)
	//console.log(parsedData.pageid)
	alert("Saved Page");
	//getRemoteMenuData(cidb, _menuid, _sectionid) in functions.data.js
	//cidb - declared at the top of pages.html and pages-edit.html
	
	////****need something here to repopulate the menu correctly.  */
	//getRemoteMenuData(cidb, menuID, secID); //var x = await **calls different function based on edit or NOT edit */ //getIDBMenuData(cidb, url_id, sectionid);				

	document.getElementById("content_main").classList.remove("disable-form");
	//document.getElementById("form1").disabled = false;
}	
/*******add Sub Page button */
//add SubPage
function addSubPgae(){
	var _menuid = "-1";
	var _parentid = document.getElementById("editable_id").value;
	var _sectionid =  document.getElementById("editable_sectionid").value;
	var _pageorder =  1;
	//create new blank (effectively) page object
	let page = new Page("-1");  		

	//jsonData2 = JSON.stringify('[{"_id":"62671229494b8a8d29895518","id":"-1","content":"<p></p>","name":"","questions":"[{\"question\":\"Question 1 title \", \"contents\":\"<p>Question 1 content</p>\"}]"}]')
	const jsonData = '[{"id": "-1", "name": "", "content": "testing", "questions": "[]"}]'; //removed the surrounding []
	const obj = JSON.parse(jsonData);

	page.pageContentEdit(obj, "-1", "-1", _parentid, _pageorder, _sectionid);
}

//has to be set here as 
function addQuestionDivs(){
	//var page_questionsDiv = document.getElementById('questions');

	var page_questionsDiv = document.getElementById('questions');
	//element.childElementCount
	//element.children.length //so if length 2 then Div0, Div1 are present 
	//console.log(page_questionsDiv.children.length);
	try{
		let divCount = page_questionsDiv.children.length;
		createQuestionDivs(page_questionsDiv, divCount , false)
		let localJsonObject = JSON.parse('{"question": "question", "contents": "update question contents"}');
		populateTinyMCE(localJsonObject, divCount)
	}catch(e){console.log(e)}
}

/*add Questions dynamically*/
/*add Question div?*/
//adds blank question //need to combine to add blank content OR populated content 
//called from cPage and index-edit.html onclick="addQuestion(false)"
function createQuestionDivs(page_questions, updated_number, _bwithContent){
	//var elem = document.getElementById('container');

	//updated_number = questions_count;
	//console.log("updated_number="+ updated_number);
	 
	var text_string = "Expandable text " + updated_number;
	var question_string = "editable_question" +  updated_number.toString();
	var answer_string = "editable_answer" +  updated_number.toString();

	const text_elem = document.createTextNode(text_string);
	const input_elem = document.createElement("input");
	input_elem.setAttribute('id', question_string);
	input_elem.setAttribute('type', "text");
	input_elem.setAttribute('class', "med");
		
	const textarea_elem = document.createElement("textarea");
	textarea_elem.setAttribute('id', answer_string);
	textarea_elem.setAttribute('name', answer_string);
	textarea_elem.setAttribute('class', "editor-content wide");

	const div_elem = document.createElement("div");
	div_elem.appendChild(text_elem);
	div_elem.appendChild(input_elem);
	div_elem.appendChild(textarea_elem);
	page_questions.appendChild(div_elem);
	
	//tinymce.EditorManager.execCommand('mceAddEditor', true, textarea_elem.id);

	//tinyMCE.execCommand("mceAddControl", false, textarea_elem.id)
	//page_questions.append("Question5: <input type=\"text\"  id=\"editable_question5\" class=\"wide\">");
	//page_questions.append("<textarea id=\"editable_answer1\" name=\"editable_answer5\" class=\"editor-content wide\"></textarea>");

}	


function populateTinyMCE(jsonObject, iCount){

//console.log(jsonObject);
	var question_string = "editable_question" +  iCount;
	var questionElem = document.getElementById(question_string);
	questionElem.value = jsonObject.question;

	var answer_string = "editable_answer" +  iCount;
	var answerElem = document.getElementById(answer_string);
	answerElem.value = jsonObject.contents;

	let tinmyMceInstance = tinymce.get(answer_string);
	if( tinmyMceInstance != null ){
		tinmyMceInstance.remove();
	}
	tinymce.init({
		selector: "#" + answer_string,
		init_instance_callback: function (editor) {
			// Shortcuts and useful things go here.
			editor.shortcuts.add("alt+s", "Save Me My Content", function() {
				savePage();		    				
				//alert("saved");
			  }),
			editor.shortcuts.add("alt+b", "A New Way To Bold", "Bold");
		  },
		plugins: 'table code lists fullscreen link image',
		toolbar: 'undo redo | formatselect | bold italic | numlist bullist | link | image' +
		'alignleft aligncenter alignright alignjustify | indent outdent | ' +
		'table tabledelete | tableprops tablerowprops tablecellprops | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
		 /* enable title field in the Image dialog*/
		 image_title: true,
		automatic_uploads: true,
		file_picker_types: 'image',
		file_picker_callback: function (cb, value, meta) {
			var input = document.createElement('input');
			input.setAttribute('type', 'file');
			input.setAttribute('accept', 'image/*');
			input.onchange = function () {
				  var file = this.files[0];
				  var reader = new FileReader();
				  reader.onload = function () {
				/*
				  Note: Now we need to register the blob in TinyMCEs image blob
				  registry. In the next release this part hopefully won't be
				  necessary, as we are looking to handle it internally.
				*/
				var id = 'blobid' + (new Date()).getTime();
				var blobCache =  tinymce.activeEditor.editorUpload.blobCache;
				var base64 = reader.result.split(',')[1];
				var blobInfo = blobCache.create(id, file, base64);
				blobCache.add(blobInfo);
				/* call the callback and populate the Title field with the file name */
				cb(blobInfo.blobUri(), { title: file.name });
			  };
		  reader.readAsDataURL(file);
		};
		input.click();
		  }
	});						

}

/////////////////////****Not necessary but useful to keep */
/*used to be called from the download button - now commented out. */
function download() {
	//content, fileName
	//const jsonData = { age: 12, name: "Someone" };
	//"id": 9, "name": "Physiology", "content": "", "question1":
	//var page_questions = document.getElementById('questions');
	//console.log("page_questions" + page_questions);
	//var nameValue = document.getElementById("uniqueID").value;	
	
	//.replace(/(&nbsp;)*/g, "")).replace(/(<p>)*/g, "")).replace(/<(\/)?p[^>]*>/g, "");
	jsonData   = 	"[{" 
	jsonData  +=  	JSON.stringify("id") + ":" + JSON.stringify(document.getElementById("editable_id").value) + ","
	jsonData  +=  	JSON.stringify("parentid") + ":" + JSON.stringify(document.getElementById("editable_parentid").value) + ","
	jsonData  +=  	JSON.stringify("pageid") + ":" + JSON.stringify(document.getElementById("editable_pageid").value) + ","
	jsonData  +=  	JSON.stringify("pageorder") + ":" + JSON.stringify(document.getElementById("editable_pageorder").value) + ","
	jsonData  +=  	JSON.stringify("pagename") + ":" + JSON.stringify(document.getElementById("editable_name").value) + ","
	jsonData  +=  	JSON.stringify("content") + ":" + JSON.stringify(tinyMCE.get('editable_content').getContent()) + ","
	jsonData  += "\"questions\": [";
	jsonData  += writeSubArray();
	jsonData  +=  	"]}]";

    var a = document.createElement("a");
	//JSON.stringify(formJSON, null, 2);
    //var file = new Blob(jsonstring, {type: "text/plain"})
	a.href = URL.createObjectURL(new Blob([jsonData], { type: "text/plain" }));
    a.download =  "data" + document.getElementById("editable_pageid").value + ".json";
    a.click();
}


function handleSubmit(event) {
	event.preventDefault();
	var parElem = event.target.parentElement;
	 const data = new FormData(parElem);
	//console.log(tinyMCE.get('editable_content').getContent());
	const value = Object.fromEntries(data.entries());
	// const value = data.get('editable_id');
  	//console.log({ value });
}


//called from jsonData above once submit has been pressed. 
//Need to stop submit from being pressed just for adding editable area. 
function writeSubArray(){
	//var subArray  = "\"questions\": [";
	var subArray = "";
	var subString = ""
	let questions_list = document.getElementById("questions").childNodes;	 //gets back DIVs
	var collection;
	
	//var  array = Array.from(questions_list.childNodes);
	//collection.forEach(function(item){
	//    console.log(item);
	//});
	for (let i = 0; i <= questions_list.length-1; i++) {
		//just brings back the divs
		//console.log(questions_list[i].tagName);
		if ((questions_list[i].children[0].tagName == "INPUT") && (questions_list[i].children[0].value != "")){
			subArray += "{\"question\":"
			subArray +=  JSON.stringify(questions_list[i].children[0].value);
		} 
		if (questions_list[i].children[1].tagName == "TEXTAREA"){
			subArray += ", \"contents\":"
			subArray += JSON.stringify(tinyMCE.get(questions_list[i].children[1].id).getContent()); //returns the node...	
			subArray += "},"
		}
	}	
	subString  +=  subArray.slice(0,-1);
	return subString; 
}

