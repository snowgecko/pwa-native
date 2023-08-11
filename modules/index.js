/*This is the starting point to pull in other modules*/
//import { create, createReportList } from './canvas.js';  //let myCanvas = create('myCanvas', document.body, 480, 320)
//let myCanvas = create('myCanvas', document.body, 480, 320)

import { pageLogic } from './page.js'; //presentation layer code 


/** SET DEFAULTS */
window.addEventListener("DOMContentLoaded", () => {
  // your functions here
  console.log ("onload event effectively");
  //
  let pageLogic = pageLogic() //from prl_1.js

	console.log("pagelogic run" + pageLogic.ctx);
});


window.addEventListener('load', ()=>{
  console.log("HERE");
  const sounds = document.querySelectorAll(".sound");

  if('serviceWorker' in navigator){
    try {
      navigator.serviceWorker.register('./serviceWorker.js');
      console.log("Service Worker Registered");
    } catch (error) {
      console.log("Service Worker Registration Failed");
    }
  }

});


