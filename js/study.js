(function() {
    var id = window.localStorage.getItem("studyDeckId");
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

    function cur() {
        return deck.cards[0];
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

    // returns random weight from first few cards
    function randomWeight() {
        var start;
        var end;
        if (deck.cards.length === 1) {
            start = deck.cards[0].weight;
        } else {
            start = deck.cards[1].weight;
        }
        if (deck.cards.length >= 7) {
            end = deck.cards[6].weight;
        } else {
            end = deck.cards[deck.cards.length - 1].weight;
        }
        // + 1 adds milisecond to timestamp to ensure rotation when there are only two cards left
        return Math.round(Math.random() * (end - start)) + start + 1;
    }

    $.get('./templates/study.handlebars', function(response) {
        template = Handlebars.compile(response);
        sanaa.getDeck(id, function(response) {
            deck = response;
            deck.cards = _.filter(deck.cards, function (card) {
                return card.weight < dueDate;
            });
            deck.cards = _.sortBy(deck.cards, 'weight');
            createCard(cur());
            $("#deckName").text(deck.name);
        });
    });

    $.get('./templates/navigation.handlebars', function(response) {
        var nav = Handlebars.compile(response);
        var html = nav({isStudy: true});
        $(".container").prepend(html);
    });

    $.get('./templates/edit_card.handlebars', function(response) {
        var edit = Handlebars.compile(response);
        var modal = $(edit());
        var cfront = modal.find("#front");
        var cback = modal.find("#back");
        $(".container").append(modal);

        modal.on("shown.bs.modal", function() {
            cfront.focus();
            modal.find(".deckName").text(deck.name);
            cfront.val(cur().front);
            cback.val(cur().back);
            modal.find("#tag").val(cur().tags.join(","));
        });

        modal.find("#edit-card").on("click", function() {
            cur().front = cfront.val();
            cur().back = cback.val();
            cur().tags = modal.find("#tag").val().split(",");
            sanaa.updateCard(deck._id, cur(), function() {
                createCard(cur());
                $("#frontArea").removeClass("hidden");
                $("#backArea").addClass("hidden");
            });
        });

        modal.find("#switch").on("click", function (argument) {
            var front = cfront.val();
            var back = cback.val();
            cback.val(front);
            cfront.val(back);
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
        sanaa.updateCard(deck._id, cur(), function() {
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
        window.localStorage.removeItem("studyDeckId");
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
        sanaa.updateCard(deck._id, cur(), function() {
            deck.cards = _.sortBy(deck.cards, 'weight');
            createCard(cur());
        });
    });
})();
