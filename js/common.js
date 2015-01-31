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

    sanaa.duplicityCheck = function (data, modal, ignoredCard) {
        var allCards = _(data)
            .pluck("cards")
            .flatten()
            .value();
        var frontNeedle = modal.find("#front").val();
        var backNeedle = modal.find("#back").val();
        var firstMatch;
        var matches = _.filter(allCards, function(singleCard) {
            return (singleCard.front === frontNeedle || singleCard.back === backNeedle) && singleCard !== ignoredCard;
        });

        if (matches.length >  0) {
            firstMatch = matches[0];
            modal.find(".deckInfo").text(_.find(data, {cards: [firstMatch]}).name);
            modal.find(".frontInfo").text(firstMatch.front);
            modal.find(".backInfo").text(firstMatch.back);
        }

        modal.find(".disclaimer").toggleClass("hidden", matches.length === 0);

        return firstMatch;
    }

    sanaa.moveDuplicity = function (data, modal, latestDeck) {
        var firstMatch = sanaa.duplicityCheck(data, modal);
        var matchDeck = _.find(data, {cards: [firstMatch]});
        var cfront = modal.find("#front");
        var cback = modal.find("#back");
        sanaa.createCard(latestDeck._id, firstMatch, function(createResponse) {
            sanaa.deleteCard(matchDeck._id, firstMatch, function(deleteResponse) {
                _.pull(matchDeck.cards, firstMatch);
                if (!sanaa.duplicityCheck(data, modal)) {
                    cback.val("");
                    cfront.val("").focus();
                    modal.find("#tag").val("");
                }
                latestDeck.cards.push(createResponse);
            });
        });
    }

    sanaa.deleteDuplicity = function (data, modal, latestDeck) {
        var cfront = modal.find("#front");
        var cback = modal.find("#back");
        var firstMatch = sanaa.duplicityCheck(data, modal);
        var matchDeck = _.find(data, {cards: [firstMatch]});
        sanaa.deleteCard(matchDeck._id, firstMatch, function(deleteResponse) {
            _.pull(matchDeck.cards, firstMatch);
            sanaa.duplicityCheck(data, modal);
        });
    }
})();