var myJSON = {
    "menu": {
        "slice of pizza": "2.00",
        "toppings": {
            "pepperoni": ".25",
            "meatballs": ".35",
            "mushrooms": ".40",
            "olives": ".20"
        },
        "sides": {
            "potato salad": "1.25",
            "hummus": "2.50",
            "caesar salad": "3.50",
            "garden salad": "2.25"
        },
        "drinks": {
            "soda": {
                "small": "1.95",
                "medium": "2.20",
                "large": "2.50"
            },
            "juice": "2.00",
            "water": "1.25"
        }
    }
};
var myTarget = document.getElementById('target');
myTarget.appendChild(renderList(myJSON));
function renderList(obj) {
	//for every level of our JSON object, we create a ul element
	var result = document.createElement('ul');
	//for every key in the object
  	for (key in obj) {
		//     create a li element and create/add a capitalized copy of the key
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
  return result;
}