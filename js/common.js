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

function updateCard(deckID, cardObject, successCallback) {
    $.ajax({
        type: "PUT",
        url: "//words-on-cards.herokuapp.com/decks/" + deckID + "/cards/" + cardObject._id,
        dataType: "json",
        data: JSON.stringify(cardObject),
        contentType: "application/json; charset=utf-8",
        success: successCallback,
        error: function(response) {
            console.log(response);
        }
    });
}

function deleteCard(deckID, cardObject, successCallback) {
    $.ajax({
        type: "DELETE",
        url: "//words-on-cards.herokuapp.com/decks/" + deckID + "/cards/" + cardObject._id,
        crossDomain: true,
        success: successCallback,
        error: function(response) {
            console.log(response);
        }
    });
}