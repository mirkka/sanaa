var params = window.location.search.substr(1).split("&"); // is array of parameters in URL
var id;
var template;
var deck;
var cardContainer = $(".card");
var hour = 1000 * 60 * 60;
var day = hour * 24;
var dueDate = Date.now() + hour;
var levelWeights = [
	1000 * 60 * 10, 
	1000 * 60 * 10,
	day,
	day * 3,
	day * 4,
	day * 7
];

// returns current card
function cur() {
	return deck.cards[0];
}

// updates cardObject in deck with id deckID and executes success callback
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

function createCard(card) {
	cardContainer.html(template(card));
	$("#backArea, #frontArea").toggleClass("hidden");
	$("#due").text(deck.cards.length);
	if (card.level < 2) {
		$("#addedTime").text(levelWeights[card.level] / 1000 / 60 + "m");
	} else {
		$("#addedTime").text(levelWeights[card.level] / 1000 / 60 / 60 / 24 + "d");
	}
	
}

// returns random weight from first 5 cards
function randomWeight() {
	var od;
	var po;
	if (deck.cards.length === 1) {
		od = deck.cards[0].weight;
	} else {
		od = deck.cards[1].weight;
	}
	if (deck.cards.length >= 10) {
		po = deck.cards[9].weight;
	} else {
		po = deck.cards[deck.cards.length - 1].weight;
	}
	// + 1 adds milisecond to timestamp to ensure rotation when there are only two cards left
	return Math.round(Math.random() * (po - od)) + od + 1;
}

for (var i = 0; i < params.length; i++) { // preiteruje sa cez params
    // v kazdom cykle checkne ci sa v elemente nachadza string "id="
    if (params[i].indexOf("id=") > -1) { 
    	// a ak ano tak z neho stripne prve 3 charaktery a zbytok premeni na cislo 
        id = params[i].substr(3);
    }   
}

$.get('./templates/navigation.handlebars', function(response) {
 	var nav = Handlebars.compile(response);
 	var html = nav({isStudy: true});
 	$(".container").prepend(html);
});

$.get('./templates/study.handlebars', function(response) {
	template = Handlebars.compile(response);
	$.ajax({
		type: "GET",
	    url: "//words-on-cards.herokuapp.com/decks/" + id,
	    success: function(response) {
	    	deck = response;
	    	deck.cards = _.filter(deck.cards, function (card) {
	    		return card.weight < dueDate;
	    	});
	    	deck.cards = _.sortBy(deck.cards, 'weight');
			console.log(response);
			createCard(cur());
			$("#deckName").text(deck.name);
	    },
	    error: function(response) {
	    	console.log(response);
	    }
	});
});

$("#goodButton").on("click", function () {
	// picks up correct weight from levelWeights array acc to index = level
	cur().weight = Date.now() + levelWeights[cur().level];
	if (cur().level === 0 || cur().level === 1) {
		cur().weight = randomWeight();
	}
	if (cur().level < 5) {
		cur().level = cur().level + 1;
	}
	updateCard(deck._id, cur(), function() {
		console.log(cur());
		deck.cards = _.filter(deck.cards, function (card) {
			return card.weight < dueDate;
		});
		deck.cards = _.sortBy(deck.cards, 'weight');
		if (deck.cards.length === 0) {
			$("#finishedStudy").modal("show");
		} else {
			createCard(cur());
		}
	});
});

$("#finishedStudy").on('hide.bs.modal', function() {
	window.location.href = "./decks.html";
});

$("#answer").on("click", function () {
	$(".invis").removeClass("invis");
	$("#backArea, #frontArea").toggleClass("hidden");
});

$("#again").on("click", function () {
	cur().weight = randomWeight();
	if (cur().level > 1) {
		cur().level = 1;
	} else {
		cur().level = 0;
	}
	updateCard(deck._id, cur(), function() {
		console.log(cur());
		deck.cards = _.sortBy(deck.cards, 'weight');
		createCard(cur());
	});
	// console.log(_.pluck(deck.cards, "front"));
});

$("#editCard").on("shown.bs.modal", function() {
	$("#front").focus();
	$(".deckName").text(deck.name);
	$("#front").val(cur().front);
	$("#back").val(cur().back);
	$("#tag").val(cur().tags.join(","));
});

$("#switch").on("click", function (argument) {
	var front = $("#front").val();
	var back = $("#back").val();
	$("#back").val(front);
	$("#front").val(back);
});

$("#edit-card").on("click", function() {
	cur().front = $("#front").val();
	cur().back = $("#back").val();
	cur().tags = $("#tag").val().split(",");
	updateCard(deck._id, cur(), function() {
		createCard(cur());
		$("#frontArea").removeClass("hidden");
		$("#backArea").addClass("hidden");
	});
});