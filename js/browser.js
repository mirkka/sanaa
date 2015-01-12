var data;
var resultsTemplate;
var selectedData;
var deckList = $("#deckList");
var tagList =$("#tagList");
var results = $("#results");
var body = $("body");

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

body.on("click", "#deckList a", function() {
    var id = $(this).data("id");
    selectedData = _.find(data, {_id:id}).cards;
    results.html(resultsTemplate(_.sortBy(selectedData, "front")));
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
    results.html(resultsTemplate(_.sortBy(selectedData, "front")));
});

body.on("click", ".list a", function() {
    var li = $(this).parent();
    if (li.is(".active")) {
        li.removeClass("active");
        results.find("tr").remove();
        selectedData = _.flatten(_.pluck(data, "cards"));
    } else {
        $(".list li").removeClass("active");
        li.addClass("active");
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
        results.find("tr").remove();
        return;
    }

    if (needle === "") {
        results.html(resultsTemplate(_.sortBy(selectedData, "front")));
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

    results.html(resultsTemplate(_.unique(filteredFronts.concat(filteredBacks))));
}

$("#sort").on("click", function() {
    var table = results.find("tr");
    results.html(table.get().reverse());
});

$("#selectAll").on("click", function() {
    results.find("input[type=checkbox]").prop("checked", $(this).is(":checked"));
});
