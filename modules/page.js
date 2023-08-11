let instance;
let counter = 0;
 
class Page {
  constructor() {
    if (instance) {
      throw new Error("You can only create one instance!");
    }
    this.homepageNode = document.getElementById("homepagepads");

    instance = this;
  }
 
  getInstance() {
    return this;
  }
 
  getCount() {
    return counter;
  }
 
  increment() {
    return ++counter;
  }
 
  decrement() {
    return --counter;
  }
}
 
const page1 = new Page();
const page2 = new Page();
// Error: You can only create one instance!