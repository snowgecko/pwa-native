/*class Teacher extends Person {
    constructor(name, subject, salary){        super(name)
        this.subject = subject;
        this.salary = salary;
    }
   
    doGrading(){
        console.log('You get an A+ in '  + this.subject);
    }
}
		username = x["username"];	
		sectionid = x["section"];	
		timestamp = x["timestamp"];		

*/

class User {
	
    constructor(username, sectionid, timestamp){
		this.username = username;
		this.sectionid = sectionid;
		this.timestamp = timestamp;
    }
	
	printValues(){
		console.log("this.username=" + this.username + "this.sectionid=" + this.sectionid + "this.timestamp=" + this.timestamp);
		
	}
	
}

