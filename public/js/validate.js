function validateForEmpty(formName, formElements, formElementDisplayNames){
	var index;
	for (index = 0; index < formElements.length; ++index) {
		var x = document.forms[formName][formElements[index]];
	    if (x.value == null || x.value == "") {
	    	alert(formElementDisplayNames[index].concat("must be filled out"));
	        return false;
	    }
	}
	return true;
}

function validationForLength(formName, formElements, formElementDisplayNames){
	var index;
	for (index = 0; index < formElements.length; ++index) {
		var x = document.forms[formName][formElements[index]];
	    if (x.value.length < 3) {
	        alert(formElementDisplayNames[index].concat(" should be at least 8 characters long"));
	        return false;
	    }
	}
	return true;
}

function validateLogin() {	
	var formName = "login_form";
	var formElements = ["username", "password"];
	var formElementDisplayNames = ["User name", "Password"];
	if(validateForEmpty(formName, formElements, formElementDisplayNames)){
		return validationForLength(formName, formElements, formElementDisplayNames);
	}
	else return false;	
}

function validateRegistration() {
	var formName = "registration_form";
	var formElements = ["username", "password", "password2", "first_name", "last_name","answer"];
	var formElementDisplayNames = ["User name", "Password", "Confirm Password", "First Name", "Last Name", "Answer"];
	if(validateForEmpty(formName, formElements, formElementDisplayNames)){
		var formElements = ["username", "password", "password2"];
		var formElementDisplayNames = ["User name", "Password"];
		if(validationForLength(formName, formElements, formElementDisplayNames)){
			alert('zdv');
			var x = document.getElementById("password").value;
			var y = document.getElementById("password2").value;
			if(x===y)
				return true;
			else{
				alert("Passwords should match");
				return false;			
			}
		}
		else return false;
	}
	else return false;
}
