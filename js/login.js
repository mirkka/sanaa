(function() {

	if ($.cookie('token')) {
		window.location.href = "./decks.html";
	}

	function createUser() {
		var newUser = {};
		if ($(".password input").val() === $(".confirmPassword input").val()) {
			newUser.username = $(".username input").val();
			newUser.password = $(".password input").val();
			$.ajax({
				type: "POST",
			    url: "//words-on-cards.herokuapp.com/users",
			    dataType: "json",
			    data: newUser,
			    success: function(response) {
			    	if (response.ok) {
			    		toggleForm();
			    	} else {
			    		alert("si sa nenalogoval");
			    	}
			    },
			    error: function(response) {
			    	alert("si sa nenalogoval");
			    }
			});
		} else {
			$(".password, .confirmPassword").addClass("has-error has-feedback");
		}
	}

	function login (argument) {
		var user = {};
		user.username = $(".username input").val();
		user.password = $(".password input").val();
		$.ajax({
			type: "POST",
		    url: "//words-on-cards.herokuapp.com/session",
		    dataType: "json",
		    data: user,
		    success: function(response) {
		    	if (response.token) {
		    		$.cookie('token', response.token, { expires: 7, path: '/' });
		    		window.location.href = "./decks.html";
		    	} else {
		    		alert("si sa nenalogoval");
		    	}
		    },
		    error: function(response) {
		    	alert("si sa nenalogoval");
		    }
		});
	}

	$(".createAccountButton").on("click", createUser);

	// $("#username, #password").on("keypress", function (event){
	// 	if (event.which === 13) {
	// 		lognisa();
	// 	}
	// });

	$(".newAccountLink, .loginLink").on("click", toggleForm);
	$(".loginButton").on("click", login);

	function toggleForm(){
		$(".loginTitle, .createAccountTitle, .confirmPassword, .newAccountLink, .loginLink, .createAccountButton, .loginButton").toggleClass("hidden");
		$(".has-error.has-feedback").removeClass("has-error has-feedback");
		$(".password input, .confirmPassword input").val("");
	}

})();