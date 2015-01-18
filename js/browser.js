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

getAlldecks(function(allDecks) {
    data = allDecks;
    selectedFilter = function() {
        return _.flatten(_.pluck(data, "cards"));
    }
    $.get('./templates/deck_list_options.handlebars', function(response) {
        listTemplate = Handlebars.compile(response);
        deckList.html(listTemplate(_.sortBy(data, "name")));
        refreshTaglist();
    });

    latestDeck = _.sortBy(data, "creationTime")[data.length - 1];
});

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
                    }
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
    }
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
    } 
    printResults(_.sortBy(selectedFilter(), "front"));
});

body.on("click", ".list a", function() {
    var li = $(this).parent();
    if (li.is(".active")) {
        li.removeClass("active");
        selectedFilter = function() {
            return _.flatten(_.pluck(data, "cards"));
        }
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
    });

    modal.find("#edit-card").on("click", function() {
        card.front = cfront.val();
        card.back = cback.val();
        card.tags = modal.find("#tag").val().split(",");
        updateCard(deck._id, card, function() {
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
});

$("#deleteCardmodal").find("#delete").on("click", function() {
    var tracker = 0; // keeps track of server success callback amount
    results.find("input[type=checkbox]:checked").each(function (x, elem) {
        tracker = tracker + 1;
        var id = $(elem).data("id");
        var deck = _.find(data, {cards: [{_id:id}]});
        var card = _.find(deck.cards, {_id:id}); 
        deleteCard(deck._id, card, function(argument) {
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

$.get('./templates/deck_list_options.handlebars', function(response) {
    dropdown = Handlebars.compile(response);
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
        ul.html(dropdown(_.sortBy(data, "name")));
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
        createCard(deckId, card, function(response) {
            console.log(response);
            var deck = _.find(data, {_id : deckId});
            deck.cards.push(response);
            cback.val("");
            cfront.val("");
            modal.find("#tag").val("");
        });
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
        ul.html(dropdown(_.sortBy(data, "name")));
        modal.find(".currentDeck").text(latestDeck.name);
    });

    $("body").on("click", "#moveCardmodal .dropdown-menu a", function() {
        var value = $(this).text();
        var id = $(this).data("id");
        latestDeck = _.find(data, {_id:id});
        modal.find(".currentDeck").text(value);       
    });

    modal.find("#copyCard").on("click", function() {
        var tracker = 0;
        results.find("input[type=checkbox]:checked").each(function (x, elem) {
            tracker = tracker + 1;
            var id = $(elem).data("id");
            var deck = _.find(data, {cards: [{_id:id}]});
            var card = _.find(deck.cards, {_id:id});
            var clonedCard = _.cloneDeep(card);
            clonedCard.weight = Date.now();
            clonedCard.level = 0;
            createCard(latestDeck._id, clonedCard, function(response) {
                tracker = tracker - 1;
                latestDeck.cards.push(response);
                if (tracker === 0) {
                    modal.modal("hide");
                    search();
                }
            });
        });
    });

    modal.find("#moveCard").on("click", function() {
        var tracker = 0;
        results.find("input[type=checkbox]:checked").each(function (x, elem) {
            tracker = tracker + 1;
            var id = $(elem).data("id");
            var deck = _.find(data, {cards: [{_id:id}]});
            var card = _.find(deck.cards, {_id:id});
            createCard(latestDeck._id, card, function(createResponse) {
                deleteCard(deck._id, card, function(deleteResponse) {
                    tracker = tracker - 1;
                    _.pull(deck.cards, card);
                    latestDeck.cards.push(createResponse);
                    if (tracker === 0) {
                        modal.modal("hide");
                        search();
                    }
                });
            });
        });
    });
});