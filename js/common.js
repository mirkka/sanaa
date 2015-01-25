(function() {
    window.sanaa = window.sanaa || {};

    sanaa.getAlldecks = function(successCallback) {
        $.ajax({
            type: "GET",
            url: "//words-on-cards.herokuapp.com/decks",
            success: successCallback,
            error: function(response) {
                console.log(response);
            }
        });
    };

    sanaa.getDeck = function(deckId, successCallback) {
        $.ajax({
            type: "GET",
            url: "//words-on-cards.herokuapp.com/decks/" + deckId,
            success: successCallback,
            error: function(response) {
                console.log(response);
            }
        });
    };

    sanaa.deleteDeck = function(deckId, successCallback) {
        $.ajax({
            type: "DELETE",
            url: "//words-on-cards.herokuapp.com/decks/" + deckId,
            success: successCallback,
            error: function(response) {
                alert("unsaved");
                console.log(response);
            }
        });
    };

    sanaa.createCard = function(deckId, cardObject, successCallback) {
        $.ajax({
            type: "POST",
            url: "//words-on-cards.herokuapp.com/decks/" + deckId + "/cards",
            dataType: "json",
            data: JSON.stringify(cardObject),
            contentType: "application/json; charset=utf-8",
            success: successCallback,
            error: function(response) {
                console.log(response);
            }
        });
    };

    sanaa.updateCard = function(deckId, cardObject, successCallback) {
        $.ajax({
            type: "PUT",
            url: "//words-on-cards.herokuapp.com/decks/" + deckId + "/cards/" + cardObject._id,
            dataType: "json",
            data: JSON.stringify(cardObject),
            contentType: "application/json; charset=utf-8",
            success: successCallback,
            error: function(response) {
                console.log(response);
            }
        });
    };

    sanaa.deleteCard = function(deckId, cardObject, successCallback) {
        $.ajax({
            type: "DELETE",
            url: "//words-on-cards.herokuapp.com/decks/" + deckId + "/cards/" + cardObject._id,
            crossDomain: true,
            success: successCallback,
            error: function(response) {
                console.log(response);
            }
        });
    };

    sanaa.createDeck = function(deck, successCallback) {
        $.ajax({
            type: "POST",
            url: "//words-on-cards.herokuapp.com/decks",
            dataType: "json",
            data: JSON.stringify(deck),
            contentType: "application/json; charset=utf-8",
            success: successCallback,
            error: function(response) {
                console.log(response);
            }
        });
    };

    sanaa.updateDeck = function(deckId, deck, successCallback) {
        $.ajax({
            type: "PUT",
            url: "//words-on-cards.herokuapp.com/decks/" + deckId,
            dataType: "json",
            data: JSON.stringify(deck),
            contentType: "application/json; charset=utf-8",
            success: successCallback,
            error: function(response) {
                console.log(response);
            }
        });
    };
})();