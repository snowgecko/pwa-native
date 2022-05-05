// creating a class
class Page {
  	constructor(pageid) {
		this._pageid = pageid;
  	}
	// getter
    get pageid() {
        return this._pageid;
    }
    // setter
    set pageid(value) {
		//console.log ("in setter pageid=" + value);
        this._pageid = value;
    }
	// getter
    get name() {
        return this._name;
    }
    // setter
    set name(x) {
        this._name = x;
    }
	// getter
    get content() {
        return this._content;
    }
    // setter
    set content(x) {
        this._content = x;
    }
	// getter
    get question1() {
        return this._question1;
    }
    // setter
    set question1(x) {
        this._question1 = x;
    }
  	calcArea() {
    	return this.height * this.width;
  	}

	CheckError(response) {
	  if (response.status >= 200 && response.status <= 299) {
	    return response.json();
	  } else {
	    throw Error(response.statusText);
	  }
	}
	//page.pageContentEdit(pagedata, _pageid, _url_id, _parentid, _sectionid);
	pageContent(data, _pageid, _menuid, _parentid, _sectionid){
		var _pagecontent = "";
		var jsonQObjects, page_content;

		if (_pageid != null){
			//console.log("_pageid != null");
			//console.log("_pageid=" + _pageid);
			//console.log("_menuid=" + _menuid);
			//console.log("data[0]" + data[0]);
			for (var key in data[0]) {
			    var arr = data[0][key];
				console.log("key=" + key);
				console.log("arr=" + arr);
				if (key == "id"){ //id as returned from Pages data would be page_id
					this.pageid = arr;
				}else if(key == "name"){
					this.name = arr;
				}else if(key == "content"){
					this.content = arr;
				}else if(key == "questions"){
					jsonQObjects = JSON.parse(arr)
					var _qpagecontent = "";						
					for (var i = 0; i <= jsonQObjects.length -1; i++){
						_qpagecontent += 	"<div class=\"container\">";
						_qpagecontent += 		"<button type=\"button\" class=\"collapsible section" + _sectionid + "\" onclick=\"expand_collapse(event)\">" + jsonQObjects[i].question + "</button>";
						_qpagecontent += 		"<div class=\"col_content\">";
						_qpagecontent += 			jsonQObjects[i].contents
						_qpagecontent += 		"</div>"					
						_qpagecontent += "</div>";
					}
				}
				/*fetch("./assets/pages/data" + _pageid + ".json")
				.then(response => response.json()).catch((error) => { console.log ("data" + _pageid + ".json")}) //NEW condensed.
				//.then (function (response){  //OLD VERSION OF response => response.json()
				//	return response.json();
				//})
				.then(data => this.showPage(data, _pageid)).catch((error) => { console.log ("data" + _pageid + ".json")})  //NEW VERSION ?
				*/
			}
			//_pagecontent += "<h3>" + this.name + "</h3>"
			_pagecontent += "<p id=\"content\">" + this.content
			_pagecontent += _qpagecontent;
			_pagecontent += "</p>";								
			console.log("_pagecontent=" + _pagecontent);
			var pagecontent_Target = document.getElementById('content_main');
			pagecontent_Target.classList.add("textsection" + _sectionid);
			pagecontent_Target.innerHTML = _pagecontent;			
		}
	}
	
	//page.pageContentEdit(pagedata, _pageid, _url_id, _parentid, _sectionid);
	pageContentEdit(data, _pageid, _menuid, _parentid, _sectionid){
		if (_pageid != null){
			console.log("_pageid != null");
			console.log("_pageid=" + _pageid);
			console.log("_menuid=" + _menuid);
			console.log("data[0]" + data[0]);
			// Now call the function inside fetch promise resolver
			//				.then(this.CheckError())
			//console.log("data[0].id=" + data[0].id);
			//console.log("data[0].name=" + data[0].name);
			////variables passed in from the url 
			var page_editable_id = document.getElementById('editable_id');
			page_editable_id.value = _menuid;

			var page_editable_parentid = document.getElementById('editable_parentid');
			page_editable_parentid.value = _parentid;

			var page_editable_sectionid = document.getElementById('editable_sectionid');
			page_editable_sectionid.value = _sectionid;

			var jsonQObjects;
			var page_editable_pageid, page_editable_name, page_editable_content;
			
			for (var key in data[0]) {
			    var arr = data[0][key];
				//console.log("key=" + key);
				//console.log("arr=" + arr);
				if (key == "id"){ //id as returned from Pages data would be page_id
					this.pageid = arr;
					page_editable_pageid = document.getElementById('editable_pageid');
					page_editable_pageid.value = arr;
				}else if (key == "name"){
					this.name = arr;
					page_editable_name = document.getElementById('editable_name');
					page_editable_name.value = data[0].name;
				}else if (key == "content"){
					this.content = arr;
					page_editable_content = document.getElementById('editable_content');
					page_editable_content.value = arr;
					tinymce.get("editable_content").setContent(arr);
				}else if (key == "questions"){
					jsonQObjects = JSON.parse(arr)	
					//clear first as also used for Add Sub Page
					var page_questions = document.getElementById('questions');
					page_questions.innerHTML = "";
					//console.log(jsonQObjects);
					//console.log(jsonQObjects[0].question)
					//console.log ("jsonQObjects.length" + jsonQObjects.length);
					//tinyMCE.get("#editable_answer0").remove();
					//tinymce.EditorManager.get($(elem).attr("id"))!=null
					for (var i = 0; i <= jsonQObjects.length -1; i++){
						//addQuestion(_bwithContent) ==> boolean with content
						addQuestion(true);
						var question_string = "editable_question" +  i.toString();
						var questionElem = document.getElementById(question_string);
						questionElem.value = jsonQObjects[i].question;

						var answer_string = "editable_answer" +  i.toString();
						var answerElem = document.getElementById(answer_string);
						answerElem.value = jsonQObjects[i].contents;
						//add content to tinyMCE area
						//var answer_string_content = jsonQObjects[i].contents
						//***need to remove tinymce instances before re-instatiating. */						
						console.log("1st jsonQObjects[i].contents=" + jsonQObjects[i].contents);
						let tinmyMceInstance = tinymce.get(answer_string);
						if( tinmyMceInstance != null ){
							//var ed = tinyMCE.EditorManager.get("#editable_answer0")
							console.log (answer_string + " ALREADY INITIALISED");
							tinmyMceInstance.remove();
						}
						//console.log("answer_string" + answer_string);
						//var answerstringTA = document.getElementById(answer_string);
						tinymce.init({
							selector: "#" + answer_string,
							plugins: 'table code lists fullscreen link image',
							init_instance_callback : function(editor) {
    							console.log('Editor: ' + editor.id + ' is now initialized.');
								//editor.setContent(answer_string_content);
	  						},
						  	toolbar: 'undo redo | formatselect | bold italic | numlist bullist | link | image' +
							'alignleft aligncenter alignright alignjustify | indent outdent | ' +
							'table tabledelete | tableprops tablerowprops tablecellprops | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol'
							});						
						//tinyMCE.activeEditor.render();
					}	

				}	
			}

		}
/*

							setup: function (editor, answer_string_content) {
	    						editor.on('init', function (e) {
	      							//this gets executed AFTER TinyMCE is fully initialized
									console.log("answer_string_content" + answer_string_content);
	      							//editor.setContent(answer_string_content); //does not keep the editor object so just updates the last editor with same
	    						})
							},							

//let response = await 
var ed = new tinymce.Editor("editable_answer" + i.toString(), {
	setup: function (editor) { 
		editor.on ('init', function (e){ editor.setContent(answer_string_content)} )
	}, 
	toolbar: 'undo redo | formatselect | bold italic | ' +
	   'alignleft aligncenter alignright alignjustify | indent outdent | ' +
		'table tabledelete | tableprops tablerowprops tablecellprops | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol'
	},
	tinymce.EditorManager);
ed.render();

						tinymce.EditorManager.init({
						   some_settings : 'some value'
						});

[{"question":"General concepts", "contents":"<p>Basic monitoring&nbsp;</p>
<p>&nbsp;</p>"}]
*/

//console.log ("data[0].id" + data[0].id);
//console.log ("data[0].name" + data[0].name);
				//this.question1 = data[0].question1;
				//
/* 
					  ID <input type="text"  id="editable_id" class="small">
					  ParentID <input type="text"  id="editable_parentid" class="small">
					  PageID <input type="text"  id="editable_pageid" class="small">
					  Page Name: <input type="text"  id="editable_name" class="med"><br/>
						<strong>Content:</strong>
						<textarea id="editable_content" name="editable_content" class="editor-content wide">

*/
				//console.log("data[0].id" + data[0].id);
			    //console.log("data[0]" + data[0]);
			    //console.log("data[0].contents1" + data[0].contents1);


				//console.log(data[0].content);
/*
				var question_text  = "editable_question1";
				var answer_text = "editable_answer1";
				var page_question = "";
				//NEED TO UPDATE THIS IN ACCORDANCE WITH THE NEW STRUCTURE..
				for (let i = 0; i < data[0].questions.length; i++) {
					//console.log(data[0].questions[i].question);
					//console.log(data[0].questions[i].contents);
					question_text = ("editable_question" + i).toString();
					answer_text = ("editable_answer" + i).toString();

					console.log(question_text);
					console.log(answer_text);
					
					page_question = document.getElementById(question_text);
					page_question.value = data[0].questions[i].question;
					
					tinymce.get(answer_text).setContent(data[0].questions[i].contents);
					//  text += data[0].questions[i] + ", ";
				}
*/	
				/*
				var page_question2= document.getElementById('editable_question2');
				page_question2.value = data[0].question2;
				tinymce.get("editable_answer2").setContent(data[0].contents2);
				
				var page_question3= document.getElementById('editable_question3');
				page_question3.value = data[0].question3;
				tinymce.get("editable_answer3").setContent(data[0].contents3);
				
				var page_question4= document.getElementById('editable_question4');
				page_question4.value = data[0].question4;
				tinymce.get("editable_answer4").setContent(data[0].contents4);
				*/
				/*fetch("./assets/pages/data" + _pageid + ".json")
				.then(response => response.json()).catch((error) => { console.log ("data" + _pageid + ".json")}) //NEW condensed.
				//.then (function (response){  //OLD VERSION OF response => response.json()
				//	return response.json();
				//})
				.then(data => this.showPage(data, _pageid)).catch((error) => { console.log ("data" + _pageid + ".json")})  //NEW VERSION ?
		}
				*/

	}
	
	setPageContents(_pagedata, _pageid){
		console.log(_pagedata);
		return _pagedata;
	}
	


}
///end of cPage class



function myCustomInitInstance(inst) {
    alert("Editor: " + inst.editorId + " is now initialized.");
}

	function customTinyMceInit(inst) {
		inst.activeEditor.setContent("testing content update");
						var editor = tinymce.get(answer_string); 
						editor.setContent("<p>hello</p>");
						console.log ("tinymce.activeEditor.id=" + tinymce.activeEditor.id)
						tinymce.activeEditor.setContent("<p>hello</p>");
						//tinymce.activeEditor.execCommand('mceInsertContent', false, '<p>hi guys</p>');
						//console.log(answerstringTA.id);
						//tinymce.get(answer_string).setContent("<p>hello</p>");
						var myContent = tinymce.activeEditor.getContent();
						console.log("myContent" + myContent);

	}


function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
