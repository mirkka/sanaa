var data;
var template;
var dropdown;
var id;
var list = $("#list");
var deckName = $("#deck-name");
var ul = $(".deckDropdown");
var hour = 1000 * 60 * 60;
var dueDate = Date.now() + hour;
var latestDeck;
var cfront =$("#front");
var cback = $("#back");


$.get('./templates/deck_list_options.handlebars', function(response) {
    dropdown = Handlebars.compile(response);
 });

$.get('./templates/navigation.handlebars', function(response) {
    var nav = Handlebars.compile(response);
    var html = nav({isDecks: true});
    $(".container").prepend(html);
});

// calls function from common, passes success callback
getAlldecks(function(allDecks) {
    data = allDecks;
    $.get('./templates/deck_row.handlebars', function(rowTemplate) {
        template = Handlebars.compile(rowTemplate);
        latestDeck = _.sortBy(data, "creationTime")[data.length - 1];
        createList();
     });
});

function createList() {
    list.empty();
    _.each(data, function(singleDeck) {
        singleDeck.due = _.filter(singleDeck.cards, function (card) {
            return card.weight < dueDate;
        }).length;
    });
    _.sortBy(data, 'name').forEach(function(object) {
        var html = template(object);
        list.append(html);
    });
 } 

$('#createDeckModal').on('shown.bs.modal', function () {
    $('#deck-name').focus()
});

$("#new").on("click", createDeck);

deckName.on("keypress", function (event){
    if (event.which === 13) {
        createDeck();
        $('#createDeckModal').modal("hide");
    }
});

function createDeck() {
    var deck = {
        name : deckName.val(),
        due : 0,
        cards : [],
        limit : 100
    };
    
    $.ajax({
        type: "POST",
        url: "//words-on-cards.herokuapp.com/decks",
        dataType: "json",
        data: JSON.stringify(deck),
        contentType: "application/json; charset=utf-8",
        success: function(response) {
            data.push(response);
            createList();
            deckName.val("");
            latestDeck = response;
        },
        error: function(response) {
            alert("unsaved");
            console.log(response);
        }
    });
};

$('#deleteDeckModal').on('show.bs.modal', function (event) {
  var button = $(event.relatedTarget);// Button that triggered the modal
  id = button.data('id');
  var deck = _.find(data, {_id:id});
  $(this).find('.deckName').text(deck.name);
});

$("#delete").on("click", function() {
    var deck = _.find(data, {_id:id});
    $.ajax({
        type: "DELETE",
        url: "//words-on-cards.herokuapp.com/decks/" + id,
        success: function(response) {
            _.pull(data, deck);
            if (deck._id === latestDeck._id){
                latestDeck = _.sortBy(data, "creationTime")[data.length - 1];
            }
            createList();
        },
        error: function(response) {
            alert("unsaved");
            console.log(response);
        }
    });
});

$('#editDeckModal').on('show.bs.modal', function (event) {
  var button = $(event.relatedTarget);// Button that triggered the modal
  id = button.data('id');
  var deck = _.find(data, {_id:id});
  // $(this); is the modal that triggered the event
  $(this).find('.deck-rename').val(deck.name);
  $(this).find(".limit").text(deck.limit);
});

$("#editDeckModal .dropdown-menu a").on("click", function() {
    var value = $(this).text();
    $(".limit").text(value);
});

$("#save").on("click", function() {
    var deck = _.find(data, {_id:id});
    if (deck) {
        deck.name = $(".deck-rename").val();
        deck.limit = $(".limit").text();
        delete deck._id;
        $.ajax({
            type: "PUT",
            url: "//words-on-cards.herokuapp.com/decks/" + id,
            dataType: "json",
            data: JSON.stringify(deck),
            contentType: "application/json; charset=utf-8",
            success: function(response) {
                deck._id = id;
                createList();
            },
            error: function(response) {
                alert("unsaved");
                console.log(response);
            }
        });     
    }
});

$("#createCard").on('shown.bs.modal', function() {
    cfront.focus();
    ul.html(dropdown(_.sortBy(data, "name")));
    $(".currentDeck").text(latestDeck.name);
});

$("body").on("click", "#createCard .dropdown-menu a", function() {
    var value = $(this).text();
    var id = $(this).data("id");
    latestDeck = _.find(data, {_id:id});
    $(".currentDeck").text(value);
});

$(function () {
  $('[data-toggle="tooltip"]').tooltip();
});

$("#switch").on("click", function (argument) {
    var front = cfront.val();
    var back = cback.val();
    cback.val(front);
    cfront.val(back);
});

$("#add-card").on("click", function () {
    var card = {};
    var deckId = latestDeck._id;
    card.front = cfront.val();
    card.back = cback.val();
    card.weight = Date.now();
    card.tags = $("#tag").val().split(",");
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
            $("#tag").val("");
        },
        error: function(response) {
            console.log(response);
        }
    });
});

$("#createCard").on('hide.bs.modal', function() {
    createList();
});