/**********
 * takes a ?json object array?
 * 
 * 
 * **********/
export function sayHi(user) {
  alert(`Hello, ${user}!`);
}

export function createNodeInfo() {
    // the following variables and functions are declared within the scope of the createBook function so other book instances or code cannot access these variables
    //const sectionid = authorName;
    //const title = bookTitle;
    console.log("IN MODULE");
    
    //let readCount = 0;
   
    //function incrementReadCount() {
    //  readCount += 1;
    //}
}


//export { name, draw, reportArea, reportPerimeter };
export default createNodeInfo;