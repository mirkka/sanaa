function getAlldecks (successCallback) {
	$.ajax({
		type: "GET",
	    url: "//words-on-cards.herokuapp.com/decks",
	    success: successCallback,
	    error: function(response) {
	    	console.log(response);
	    }
	});
}