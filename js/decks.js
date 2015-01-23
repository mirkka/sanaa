(function() {
    var data;
    var template;
    var dropdown;
    var id;
    var list = $("#list");
    var deckName = $("#deck-name");
    var hour = 1000 * 60 * 60;
    var dueDate = Date.now() + hour;
    var latestDeck;

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
        $('#deck-name').focus();
    });

    $("#new").on("click", addDeck);

    deckName.on("keypress", function (event){
        if (event.which === 13) {
            addDeck();
            $('#createDeckModal').modal("hide");
        }
    });

    function addDeck(argument) {
        var deck = {
            name : deckName.val(),
            cards : [],
            limit : 100
        };
        createDeck(deck, function(response) {
            data.push(response);
            createList();
            deckName.val("");
            latestDeck = response;
        });
    }

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
      $(this).find("#flip").removeClass("active");
    });

    $("#editDeckModal .dropdown-menu a").on("click", function() {
        var value = $(this).text();
        $(".limit").text(value);
    });

    $("#flip").on("click", function() {
        var deck = _.find(data, {_id:id});
        $(this).toggleClass("active").blur();
        _.each(deck.cards, function(singleCard) {
            var front = singleCard.front;
            var back = singleCard.back;
            singleCard.back = front;
            singleCard.front = back;
        });
    });

    $("#save").on("click", function() {
        var deck = _.find(data, {_id:id});
        if (deck) {
            deck.name = $(".deck-rename").val();
            deck.limit = $(".limit").text();
            updateDeck(id, deck, function(response) {
                createList();
            });
        }
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

        modal.find("#switch").on("click", function () {
            var front = cfront.val();
            var back = cback.val();
            cback.val(front);
            cfront.val(back);
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
    });

    $(function () {
      $('[data-toggle="tooltip"]').tooltip();
    });

    $("#createCard").on('hide.bs.modal', function() {
        createList();
    });
})();
