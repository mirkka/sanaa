var data;
var resultsTemplate;
var selectedData;

getAlldecks(function(allDecks) {
	data = allDecks;
	selectedData = _.flatten(_.pluck(allDecks, "cards"))
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
		$("#deckList").html(listTemplate(_.sortBy(allDecks, "name")));
		$("#tagList").html(listTemplate(tags));
	});
});

$("body").on("click", "#deckList a", function() {
	var id = $(this).data("id");
	selectedData = _.find(data, {_id:id}).cards;
	$("#results").html(resultsTemplate(_.sortBy(selectedData, "front")));
});

$("body").on("click", "#tagList a", function() {
	var tag = $(this).data("id");
	selectedData = _(data)
				.pluck("cards") // all cards from all decks
				.flatten()
				.filter(function(card) {
					return _.contains(card.tags, tag);
				})
				.value();
	$("#results").html(resultsTemplate(_.sortBy(selectedData, "front")));
});

$("body").on("click", ".list a", function() {
	$(".list li").removeClass("active");
	$(this).parent().addClass("active");
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
		$("#results tr").remove();
		return;
	}

	if (needle === "") {
		$("#results").html(resultsTemplate(_.sortBy(selectedData, "front")));
		return;
	}
	var filteredFronts = _.filter(selectedData, function(card) {
		return card.front.indexOf(needle) > -1;
	})
	filteredFronts = _.sortBy(filteredFronts, function(x) {
		return x.front.indexOf(needle);
	})
	var filteredBacks = _.filter(selectedData, function(card) {
		return card.back.indexOf(needle) > -1 // && card.front.indexOf(needle) === -1;
	})

	filteredBacks = _.sortBy(filteredBacks, function(y) {
		return y.back.indexOf(needle);
	})

	$("#results").html(resultsTemplate(_.unique(filteredFronts.concat(filteredBacks))));
}

$("#sort").on("click", function() {
	var table = $("#results tr");
	$("#results").html(table.get().reverse());
})

$("#selectAll").on("click", function() {
	$("#results input[type=checkbox]").prop("checked", $(this).is(":checked"));
});

