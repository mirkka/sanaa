var data;
var resultsTemplate;
var selectedData;
var deckList = $("#deckList");
var tagList = $("#tagList");
var results = $("#results");
var body = $("body");
var number = $("#amount");

getAlldecks(function(allDecks) {
    data = allDecks;
    selectedData = _.flatten(_.pluck(data, "cards"));
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

    $.get('./templates/deck_list_options.handlebars', function(response) {
        var listTemplate = Handlebars.compile(response);
        deckList.html(listTemplate(_.sortBy(data, "name")));
        tagList.html(listTemplate(tags));
    });
});

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
    selectedData = _.find(data, {_id:id}).cards;
    printResults(_.sortBy(selectedData, "front"));
});

body.on("click", "#tagList a", function() {
    var tag = $(this).data("id");
    selectedData = _(data)
                .pluck("cards") // all cards from all decks
                .flatten()
                .filter(function(card) {
                    return _.contains(card.tags, tag);
                })
                .value();
    printResults(_.sortBy(selectedData, "front"));
});

body.on("click", ".list a", function() {
    var li = $(this).parent();
    if (li.is(".active")) {
        li.removeClass("active");
        selectedData = _.flatten(_.pluck(data, "cards"));
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
    filteredFronts = _.sortBy(filteredFronts, function(x) {
        return x.front.indexOf(needle);
    });
    var filteredBacks = _.filter(selectedData, function(card) {
        return card.back.indexOf(needle) > -1;
    });

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
        card = _.find(selectedData, {_id:id});
        deck = _.find(data, {cards: [card]});
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
        })
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
        $(".currentDeck").text(latestDeck.name);
    });

    $("body").on("click", "#createCardmodal .dropdown-menu a", function() {
        var value = $(this).text();
        var id = $(this).data("id");
        latestDeck = _.find(data, {_id:id});
        $(".currentDeck").text(value);
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
        $.ajax({
            type: "POST",
            url: "//words-on-cards.herokuapp.com/decks/" + deckId + "/cards",
            dataType: "json",
            data: JSON.stringify(card),
            contentType: "application/json; charset=utf-8",
            success: function(response) {
                console.log(response);
                var deck = _.find(data, {_id : deckId});
                deck.cards.push(response);
                cback.val("");
                cfront.val("");
                modal.find("#tag").val("");
            },
            error: function(response) {
                console.log(response);
            }
        });
    });

    modal.on('hidden.bs.modal', function () {
        search();
        refreshTaglist();
    });
});