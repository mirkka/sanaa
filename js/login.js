(function() {

	if ($.cookie('token')) {
		window.location.href = "./decks.html";
	}

	function createUser() {
		var newUser = {};
		var confirmPassword = $(".confirmPassword input").val();
		newUser.username = $(".username input").val();
		newUser.password = $(".password input").val();

		if (_.isEmpty(newUser.username)) {
			$(".username").addClass("has-error has-feedback");
			return;
		}

		if (_.isEmpty(newUser.password)) {
			$(".password").addClass("has-error has-feedback");
			return;
		}

		if (newUser.password !== confirmPassword) {
			$(".confirmPassword").addClass("has-error has-feedback");
			return;
		}

		$.ajax({
			type: "POST",
		    url: "//words-on-cards.herokuapp.com/users",
		    dataType: "json",
		    data: newUser,
		    success: function(response) {
		    	if (response.ok) {
		    		toggleForm();
		    	} else {
		    		$(".username, password, .confirmPassword").addClass("has-error has-feedback");
		    		$(".disclaimer").removeClass("hidden");
		    	}
		    },
		    error: function(response) {
		    	$(".username, password, .confirmPassword").addClass("has-error has-feedback");
		    	$(".disclaimer").removeClass("hidden");
		    }
		});
	}

	function login (argument) {
		var user = {};
		user.username = $(".username input").val();
		user.password = $(".password input").val();
		if (_.isEmpty(user.username)) {
			$(".username").addClass("has-error has-feedback");
			return;
		}

		if (_.isEmpty(user.password)) {
			$(".password").addClass("has-error has-feedback");
			return;
		}
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
		    		$(".username, password, .confirmPassword").addClass("has-error has-feedback");
		    		$(".disclaimer").removeClass("hidden");
		    	}
		    },
		    error: function(response) {
		    	$(".username, password, .confirmPassword").addClass("has-error has-feedback");
		    	$(".disclaimer").removeClass("hidden");
		    }
		});
	}

	$(".username input").on("keyup", function() {
		if ($(".username").is(".has-error.has-feedback")) {
			$(".username").removeClass("has-error has-feedback");
			$(".disclaimer").addClass("hidden");
		}
	});

	$(".password input").on("keyup", function() {
		if ($(".password").is(".has-error.has-feedback")) {
			$(".password").removeClass("has-error has-feedback");
			$(".disclaimer").addClass("hidden");
		}
	});

	$(".confirmPassword input").on("keyup", function() {
		if ($(".confirmPassword").is(".has-error.has-feedback")) {
			$(".confirmPassword").removeClass("has-error has-feedback");
			$(".disclaimer").addClass("hidden");
		}
	});


	$(".createAccountButton").on("click", createUser);

	$(".newAccountLink, .loginLink").on("click", toggleForm);
	$(".loginButton").on("click", login);

	function toggleForm(){
		$(".loginTitle, .createAccountTitle, .confirmPassword, .newAccountLink, .loginLink, .createAccountButton, .loginButton").toggleClass("hidden");
		$(".has-error.has-feedback").removeClass("has-error has-feedback");
		$(".password input, .confirmPassword input").val("");
		$(".username input").focus();
	}

})();