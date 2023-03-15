/*
    SimpleIDB    

    A class as interface to IndexedDB.
    
    (c) 2018 Scriptol.com - MIT License
*/

class SimpleIDB {
	//open 
/*
onupgradeneeded is called when you change the db version : from no database to first version, first version to second version ...
onsuccess is called each time you make a new request : even if the database schemas has not been changed.
var idb = await cidb.open("basename", "storename", { schema: s, index: i })
*/
    open(dname, sname, options, _version) {
        this.dname=dname
        var sflag=("schema" in options)
        this.sflag=sflag
	    return new Promise(function(resolve) {
    	    var r = null; 
			if (_version){
				r = indexedDB.open(dname, _version);				
			}else{
				r = indexedDB.open(dname);								
			}
		    r.onupgradeneeded = function(e) {
			//console.log("opened new indexedDB");
		        var idb = r.result
		        var store
		        if(sflag)
		            store = idb.createObjectStore(sname, options["schema"])
		        else        
		            store = idb.createObjectStore(sname)
		        
		        if("index" in options) {
		            let i = options["index"]
		            if(Array.isArray(i[0])) {
		                for(let x of i) {
		                    store.createIndex(x[0], x[1], x[2]===undefined?null:x[2])
		                }
		            }
		            else {
		                store.createIndex(i[0], i[1], i[2]===undefined?null:i[2])
		            }      
		        }      
		    }
		    r.onsuccess = function(e) {
			    let idb = r.result
			    resolve(idb)
	        }
    	    r.onerror = function (e) {
			    alert("Unable to open IndexedDB.")
	        }    
	    })
    }

/*
var store;
  try {
    store = request.transaction.objectStore('yourStore');
  }
  catch(e) {
    store = db.createObjectStore('yourStore');
}
*/ 
    fill(idb, sname, arr) {
        let sflag=this.sflag
		try{
        	return new Promise(function(resolve) {
	    	    let tactn = idb.transaction(sname, "readwrite")
        	    var store = tactn.objectStore(sname)
	    	    for(var obj of arr) {
	    	        if(sflag){
						if (idb.name == "user") obj.timestamp = Date.now();
						//console.log ("****sflag true obj" + obj.section);
   	       	        	store.put(obj);
					}
	   	       	    else {
	   	       	        let key = Object.keys(obj)[0]
						//console.log ("***sflag false obj" + obj);
   	       	        	store.put(obj[key], key)
   	       	    	}
       	    	}
            	resolve(true)        
        	})	
		}catch(e){}
    }

    dump(idb, sname) {
        return new Promise(function(resolve) {
            let tactn = idb.transaction(sname, "readonly")
            let osc = tactn.objectStore(sname).openCursor()
            var cont=[]
            osc.onsuccess = function(e) {
                let cursor = e.target.result
                if (cursor) {
                    cont.push(cursor.value)
                    cursor.continue()
                }
            } 
            tactn.oncomplete = function() {
                idb.close()
                resolve(cont)
            }	
			tactn.onerror = function(event){
				console.log(event);
			}
        })
    }

/*
try {
  adddlert("Welcome guest!");
}
catch(err) {
  document.getElementById("demo").innerHTML = err.message;
}
var cont = await cidb.getAllData(idbUser, "fstore"); //- may be quicker to use getAllData
* */
	getAllData(idb, sname){
	        //var dname = this.dname
	        return new Promise(function(resolve) {
	            //var r = indexedDB.open(dname)
	   	        //r.onsuccess = function(e) {
		try{
	   	            //let idb = r.result
	                /**should group any 'transactions together' */
					let tactnA = idb.transaction(sname, "readonly")	                
            		var cont=[] //probably doesn't need to be an array'
					//var objectStore = db.createObjectStore('contactsList', { keyPath: 'id' }); 
					let store = tactnA.objectStore(sname)  //sname = fstore
					const myIndex = store.index("id");  //causing an error
					const getAllRequest = myIndex.getAll();
					getAllRequest.onsuccess = () => {
						cont = getAllRequest.result;
		  				//console.log(getAllRequest.result);
						const d5 = new Date().getSeconds();	
						//console.log ("just after getAllRequest=" + d5);
					};
					tactnA.oncomplete = function() {
		                idb.close()
                		resolve(cont); //if I leave resolve off then the loop from dump doesn't run???????'
  						//console.log("Transaction is complete");
					};
					tactnA.onerror = function(event){
		                idb.close()
                		resolve(); //if I leave resolve off then the loop from dump doesn't run???????'
						//console.log(event);
					}
				//}
				//r.onerror = function(e){
				//		console.log(e + "database not opening");					
				//}
				}catch(e){
					//console.log (e);
				}
			})
	}

	searchNEW(){
		db.transaction(['table'], 'readonly')
		  .objectStore('table')
		  .openCursor(
		    IDBKeyRange.bound(searchTerm, searchTerm + '\uffff'), // The important part, thank Velmont to point out
		    'prev')
		  .onsuccess = function (e) {
		    e || (e = event);
		    var cursor = e.target.result;
		    if (cursor) {
		      // console.log(cursor.value.column1 + ' = ' + cursor.value.column2);
		      cursor.continue();
		    }
		  };		
	}


//// Get the 'name' index from your 'friends' table.
//var index = trans.objectStore("friends").index("name");

	find(sname, _svalue){
        var dname=this.dname
	    return new Promise(function(resolve) {
		    var r = indexedDB.open(dname)
   		    r.onsuccess = function(e) {
			    var idb = r.result		
				let tactn = idb.transaction(sname, "readonly")
    	        let osc = tactn.objectStore(sname).openCursor(IDBKeyRange.bound(_svalue, _svalue + '\uffff'), 'prev') // The important part, thank Velmont to point out
       		    var cont=[];
				//new format = e => { }  rather than = function(e){}
				osc.onsuccess = e => {
					const cursor = e.target.result;
					if (cursor) {
						//console.log(cursor.value.pagename + "|||" + _svalue);
            			//if (cursor.value.pagename === _svalue) {
							cont.push(cursor.value)
	    	        	//}
	    	        	cursor.continue();
        			}
				}
				tactn.oncomplete = function() {
            	    idb.close()
            	    resolve(cont)
            	}
			}
		});
	}
	
    read(sname, key) {
        var dname=this.dname
	    return new Promise(function(resolve) {
		    var r = indexedDB.open(dname)
   		    r.onsuccess = function(e) {
			    var idb = r.result
	    	    let tactn = idb.transaction(sname)
		        let store = tactn.objectStore(sname)
    		    let data = store.get(key)
		        data.onsuccess = function() {
    		        resolve(data.result)
	    	    }
			    tactn.oncomplete = function() {
    	    	    idb.close()
	    	    }
		    }
	    })
    }
    
    write(sname, obj, key) {
        var dname = this.dname
        return new Promise(function(resolve) {
	        var r = indexedDB.open(dname)
   	        r.onsuccess = function(e) {
		        let idb = r.result
	   	        let tactn = idb.transaction(sname, "readwrite")
	            let store = tactn.objectStore(sname)
	            let ru
	            if(key !== undefined && key.length > 0) {
    	            ru = store.put(obj, key)
	            }     
    	        else {
    	            ru = store.put(obj)
    	        }     
		        ru.onsuccess = function() {
    		        resolve(idb)
	    	    }    	        
		        tactn.oncomplete = function() {
        	        idb.close()
	   	        }
	        }
        })
    }   
    
    remove(sname, key) {
        var dname = this.dname
        return new Promise(function(resolve) {
            var r = indexedDB.open(dname)
   	        r.onsuccess = function(e) {
   	            let idb = r.result
                let tactn = idb.transaction(sname, "readwrite")
                let store = tactn.objectStore(sname) 
                let rd = store.delete(key)
		        rd.onsuccess = function() {
    		        resolve(idb)
	    	    }
   	        }
        })
    } 
    
    getIndex(sname, iname, value) {
        var dname = this.dname
        return new Promise(function(resolve) {
            var r = indexedDB.open(dname)
   	        r.onsuccess = function(e) {
   	            let idb = r.result
                let tactn = idb.transaction(sname, "readwrite")
                let store = tactn.objectStore(sname) 
		        if(store.indexNames.contains(iname)) {
                    let index = store.index(iname)	
                    let info = index.getAllKeys(value)
                    info.onsuccess = function(e) {
		                resolve(info.result)
                    } 
		        }  
		        else {
		           // console.log(`Index '${iname}' not found.`)
		        }
     
   	        }
        })        
    }
    

    kill(dname) {
        return new Promise(function(resolve) {
            var k = indexedDB.deleteDatabase(dname)
			k.onsuccess = function () {
			    console.log("Deleted database successfully", dname);
                resolve(k)
			};
			k.onerror = function () {
			    console.log("Couldn't delete database", dname);
			};
			k.onblocked = function () {
			    console.log("Couldn't delete database due to the operation being blocked", dname);
			};
        })    
    }
}

