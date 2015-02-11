(function() {
    var id = window.localStorage.getItem("deckId");
    var data;
    var resultsTemplate;
    var selectedFilter;
    var deckList = $("#deckList");
    var tagList = $("#tagList");
    var results = $("#results");
    var body = $("body");
    var number = $("#amount");
    var latestDeck;
    var listTemplate;

    sanaa.getAlldecks(function(allDecks) {
        data = allDecks;
        $.get('./templates/deck_list_options.handlebars', function(response) {
            listTemplate = Handlebars.compile(response);
            if (id) {
                latestDeck = _.find(data, {_id:id});
                selectedFilter = function() {
                    return _.sortBy(latestDeck.cards, "front");
                };
                printResults(selectedFilter());
                refreshDeckList(latestDeck.name);
                window.localStorage.removeItem("deckId");
            } else {
                selectedFilter = function() {
                    return _.flatten(_.pluck(data, "cards"));
                };
                latestDeck = _.sortBy(data, "creationTime")[data.length - 1];
                refreshDeckList();
            }
            refreshTaglist();
        });
    });

    function refreshDeckList(activeDeck) {
        var previouslyActive = activeDeck || deckList.find(".active").text();
        deckList.html(listTemplate(_.sortBy(data, "name")));
        if (previouslyActive !== "") {
            deckList.find("li:contains('"+ previouslyActive + "')").addClass("active");
        }
    }

    function refreshTaglist() {
        var previouslyActive = tagList.find(".active").text();
        var tags = _(data)
                    .pluck("cards") // all cards from all decks
                    .flatten()
                    .pluck("tags") // all tags from all cards
                    .flatten()
                    .filter() // removes empty strings/tags
                    .unique() // only unique strings/tags
                    .sortBy()
                    .map(function(tag) {  // convert tag strings into objects so we can reuse deck_list_options template
                        return {
                            name:tag,
                            _id:tag
                        };
                    }).value();
        tagList.html(listTemplate(tags));
        if (previouslyActive !== "") {
            tagList.find(":contains('"+ previouslyActive + "')").addClass("active");
        }
    }

    function printResults(resultsData) {
        number.text(resultsData.length);
        results.html(resultsTemplate(resultsData));
        if (resultsData.length > 0) {
            $("#selectAll").prop("disabled", false);
        } else {
            $("#selectAll").prop("disabled", true);
        }
        $("#selectAll").prop("checked", false);
        $("#deleteCard").addClass("hidden");
        $("#copyCard").addClass("hidden");
        $("#moveCard").addClass("hidden");
    }

    body.on("click", "#deckList a", function() {
        var id = $(this).data("id");
        selectedFilter = function() {
            return _.find(data, {_id:id}).cards;
        };
        latestDeck = _.find(data, {_id:id});
        printResults(_.sortBy(selectedFilter(), "front"));
    });

    body.on("click", "#tagList a", function() {
        var tag = $(this).data("id");
        selectedFilter = function() {
            return _(data)
                .pluck("cards") // all cards from all decks
                .flatten()
                .filter(function(card) {
                    return _.contains(card.tags, tag.toString());
                }).value();
        };
        printResults(_.sortBy(selectedFilter(), "front"));
    });

    body.on("click", ".list a", function() {
        var li = $(this).parent();
        if (li.is(".active")) {
            li.removeClass("active");
            selectedFilter = function() {
                return _.flatten(_.pluck(data, "cards"));
            };
            $("#searchInput").val("");
            printResults([]);
        } else {
            $(".list li").removeClass("active");
            li.addClass("active");
            $("#searchInput").val("");
        }
    });

    $.get('./templates/navigation.handlebars', function(response) {
        var nav = Handlebars.compile(response);
        var html = nav({isBrowse: true});
        $(".container").prepend(html);
    });

    $.get('./templates/results.handlebars', function(response) {
        resultsTemplate = Handlebars.compile(response);
    });

    $("#searchBtn").on("click", search);
    $("#searchInput").on("keyup", search);

    function search() {
        var selectedData = selectedFilter();
        var needle = $("#searchInput").val();
        if (needle === "" && !$(".list li").is(".active")) {
            printResults([]);
            return;
        }

        if (needle === "") {
            printResults(_.sortBy(selectedData, "front"));
            return;
        }
        var filteredFronts = _.filter(selectedData, function(card) {
            return card.front.indexOf(needle) > -1;
        });
        filteredFronts = _.sortBy(filteredFronts, "front");
        filteredFronts = _.sortBy(filteredFronts, function(x) {
            return x.front.indexOf(needle);
        });
        var filteredBacks = _.filter(selectedData, function(card) {
            return card.back.indexOf(needle) > -1;
        });
        filteredBacks = _.sortBy(filteredBacks, "back");
        filteredBacks = _.sortBy(filteredBacks, function(y) {
            return y.back.indexOf(needle);
        });

        printResults(_.unique(filteredFronts.concat(filteredBacks)));
    }

    $("#sort").on("click", function() {
        var table = results.find("tr");
        results.html(table.get().reverse());
    });

    $("#selectAll").on("click", function() {
        results.find("input[type=checkbox]").prop("checked", $(this).is(":checked"));
    });

    body.on("click", "input[type=checkbox]", function() {
        var isChecked = results.find("input[type=checkbox]").is(":checked");
        $("#deleteCard").toggleClass("hidden", !isChecked);
        $("#copyCard").toggleClass("hidden", !isChecked);
        $("#moveCard").toggleClass("hidden", !isChecked);
    });

    $.get('./templates/edit_card.handlebars', function(response) {
        var edit = Handlebars.compile(response);
        var modal = $(edit());
        var card;
        var deck;
        var cfront = modal.find("#front");
        var cback = modal.find("#back");
        $(".container").append(modal);

        modal.on("shown.bs.modal", function(event) {
            var result = $(event.relatedTarget);
            var id = result.data('id');
            deck = _.find(data, {cards: [{_id:id}]});
            card = _.find(deck.cards, {_id:id});
            cfront.focus();
            cfront.val(card.front);
            cback.val(card.back);
            modal.find("#tag").val(card.tags.join(","));
            modal.find(".deckName").text(deck.name);
            sanaa.duplicityCheck(data, modal, card);
        });

        modal.find("#edit-card").on("click", function() {
            card.front = cfront.val();
            card.back = cback.val();
            card.tags = modal.find("#tag").val().split(",");
            sanaa.updateCard(deck._id, card, function() {
                refreshTaglist();
                search();
            });
        });

        modal.find("#switch").on("click", function (argument) {
            var front = cfront.val();
            var back = cback.val();
            cback.val(front);
            cfront.val(back);
        });

        cfront.on("keyup", function() {
            sanaa.duplicityCheck(data, modal, card);
        });

        cback.on("keyup", function() {
            sanaa.duplicityCheck(data, modal, card);
        });

        modal.find(".moveDuplicity").on("click", function() {
            sanaa.moveDuplicity(data, modal, latestDeck);
        });

        modal.find(".deleteDuplicity").on("click", function() {
            sanaa.deleteDuplicity(data, modal, latestDeck);
        });
    });

    $("#deleteCardmodal").find("#delete").on("click", function() {
        var tracker = 0; // keeps track of server success callback amount
        results.find("input[type=checkbox]:checked").each(function (x, elem) {
            tracker = tracker + 1;
            var id = $(elem).data("id");
            var deck = _.find(data, {cards: [{_id:id}]});
            var card = _.find(deck.cards, {_id:id});
            sanaa.deleteCard(deck._id, card, function(argument) {
                _.pull(deck.cards, card);
                tracker = tracker - 1;
                if (tracker === 0) {
                    search();
                    refreshTaglist();
                    $("#deleteCardmodal").modal("hide");
                }
            });
        });
    });

    $.get('./templates/create_card.handlebars', function(response) {
        var create = Handlebars.compile(response);
        var modal = $(create());
        var cfront = modal.find("#front");
        var cback = modal.find("#back");
        var ul = modal.find(".deckDropdown");
        $(".container").append(modal);

        modal.on("shown.bs.modal", function(event) {
            cfront.focus();
            ul.html(listTemplate(_.sortBy(data, "name")));
            modal.find(".currentDeck").text(latestDeck.name);
        });

        $("body").on("click", "#createCardmodal .dropdown-menu a", function() {
            var value = $(this).text();
            var id = $(this).data("id");
            latestDeck = _.find(data, {_id:id});
            modal.find(".currentDeck").text(value);
        });

        modal.find("#add-card").on("click", function () {
            var card = {};
            var deckId = latestDeck._id;
            card.front = cfront.val();
            card.back = cback.val();
            card.weight = Date.now();
            card.tags = modal.find("#tag").val().split(",");
            card.level = 0;
            cfront.focus();
            sanaa.createCard(deckId, card, function(response) {
                var deck = _.find(data, {_id : deckId});
                deck.cards.push(response);
                cback.val("");
                cfront.val("");
                modal.find("#tag").val("");
            });
        });

        modal.find("#switch").on("click", function () {
            var front = cfront.val();
            var back = cback.val();
            cback.val(front);
            cfront.val(back);
        });

        cfront.on("keyup", function() {
            sanaa.duplicityCheck(data, modal);
        });
        cback.on("keyup", function() {
            sanaa.duplicityCheck(data, modal);
        });

        modal.find(".moveDuplicity").on("click", function() {
            sanaa.moveDuplicity(data, modal, latestDeck);
        });

        modal.find(".deleteDuplicity").on("click", function() {
            sanaa.deleteDuplicity(data, modal, latestDeck);
        });

        modal.on('hidden.bs.modal', function () {
            search();
            refreshTaglist();
        });
    });

    $.get('./templates/move_card.handlebars', function(response) {
        var move = Handlebars.compile(response);
        var modal = $(move());
        var ul = modal.find(".deckDropdown");
        $(".container").append(modal);

        modal.on("show.bs.modal", function(event) {
            ul.html(listTemplate(_.sortBy(data, "name")));
            modal.find(".currentDeck").text(latestDeck.name);
            modal.find("#deck-name").val("").trigger("keyup");
        });

        $("body").on("click", "#moveCardmodal .dropdown-menu a", function() {
            var value = $(this).text();
            var id = $(this).data("id");
            latestDeck = _.find(data, {_id:id});
            modal.find(".currentDeck").text(value);
        });

        modal.find("#copyCard").on("click", function() {
            var tracker = 0;
            var newCards = [];
            var newDeckName = modal.find("#deck-name").val();
            results.find("input[type=checkbox]:checked").each(function (x, elem) {
                tracker = tracker + 1;
                var id = $(elem).data("id");
                var deck = _.find(data, {cards: [{_id:id}]});
                var card = _.find(deck.cards, {_id:id});
                var clonedCard = _.cloneDeep(card);
                clonedCard.weight = Date.now();
                clonedCard.level = 0;
                newCards.push(clonedCard);
            });
            if (newDeckName === "") {
                _.each(newCards, function(singleClonedCard) {
                    sanaa.createCard(latestDeck._id, singleClonedCard, function(response) {
                        tracker = tracker - 1;
                        latestDeck.cards.push(response);
                        if (tracker === 0) {
                            modal.modal("hide");
                            search();
                        }
                    });
                });
            } else {
                var newDeck = {
                    name : newDeckName,
                    cards : newCards
                };
                sanaa.createDeck(newDeck, function(response) {
                    data.push(response);
                    modal.modal("hide");
                    refreshDeckList();
                    search();
                });
            }
        });

        modal.find("#deck-name").on("keyup", function() {
            if ($(this).val() === "") {
                modal.find("#deckDropdowBtn").removeClass("disabled").prop("disabled", false);
            } else {
                modal.find("#deckDropdowBtn").addClass("disabled").prop("disabled", true);
            }
        });

        modal.find("#moveCard").on("click", function() {
            var tracker = 0;
            var newCards = [];
            var newDeckName = modal.find("#deck-name").val();
            results.find("input[type=checkbox]:checked").each(function (x, elem) {
                tracker = tracker + 1;
                var id = $(elem).data("id");
                var deck = _.find(data, {cards: [{_id:id}]});
                var card = _.find(deck.cards, {_id:id});
                newCards.push(card);
            });
            if (newDeckName === "") {
                _.each(newCards, function(singleCard) {
                    var deck = _.find(data, {cards: [{_id:singleCard._id}]});
                    sanaa.createCard(latestDeck._id, singleCard, function(createResponse) {
                        sanaa.deleteCard(deck._id, singleCard, function(deleteResponse) {
                            tracker = tracker - 1;
                            _.pull(deck.cards, singleCard);
                            latestDeck.cards.push(createResponse);
                            if (tracker === 0) {
                                modal.modal("hide");
                                search();
                            }
                        });
                    });
                });
            } else {
                var newDeck = {
                    name : newDeckName,
                    cards : newCards
                };
                sanaa.createDeck(newDeck, function(response) {
                    data.push(response);
                    _.each(newCards, function(singleCard) {
                        var deck = _.find(data, {cards: [{_id:singleCard._id}]});
                        sanaa.deleteCard(deck._id, singleCard, function(deleteResponse) {
                            tracker = tracker - 1;
                            _.pull(deck.cards, singleCard);
                            if (tracker === 0) {
                                modal.modal("hide");
                                search();
                                refreshDeckList();
                            }
                        });
                    });
                });
            }
        });
    });
})();