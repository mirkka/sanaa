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

    $.get('./templates/deck_list_options.handlebars', function(response) {
        dropdown = Handlebars.compile(response);
     });

    $.get('./templates/navigation.handlebars', function(response) {
        var nav = Handlebars.compile(response);
        var html = nav({isDecks: true});
        $(".container").prepend(html);
    });

    // calls function from common, passes success callback
    sanaa.getAlldecks(function(allDecks) {
        data = allDecks;
        $.get('./templates/deck_row.handlebars', function(rowTemplate) {
            template = Handlebars.compile(rowTemplate);
            latestDeck = _.sortBy(data, "creationTime")[data.length - 1];
            createList();
         });
    });

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
        sanaa.createDeck(deck, function(response) {
            data.push(response);
            createList();
            deckName.val("");
            latestDeck = response;
        });
    }

    $("body").on("click", ".study", function() {
        window.localStorage.setItem("studyDeckId", $(this).data('id'));
    });

    $('#deleteDeckModal').on('show.bs.modal', function (event) {
      var button = $(event.relatedTarget);// Button that triggered the modal
      id = button.data('id');
      var deck = _.find(data, {_id:id});
      $(this).find('.deckName').text(deck.name);
    });

    $("#delete").on("click", function() {
        var deck = _.find(data, {_id:id});
        sanaa.deleteDeck(deck._id, function() {
            _.pull(data, deck);
            if (deck._id === latestDeck._id){
                latestDeck = _.sortBy(data, "creationTime")[data.length - 1];
            }
            createList();
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
            sanaa.updateDeck(id, deck, function(response) {
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
            var id = $(this).data("id");
            latestDeck = _.find(data, {_id:id});
            modal.find(".currentDeck").text(latestDeck.name);
        });

        modal.find("#switch").on("click", function () {
            var front = cfront.val();
            var back = cback.val();
            cback.val(front);
            cfront.val(back);
        });

        $("#browseDeck").on("click", function() {
            window.localStorage.setItem("deckId", latestDeck._id);
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

        modal.on('hide.bs.modal', createList);
    });

    $.get('./templates/export_deck.handlebars', function(response){
        var exportDeck = Handlebars.compile(response);
        var modal = $(exportDeck());
        var ul = modal.find(".deckDropdown");
        var importedDeck;

        function updateExportUrl() {
            var downloadUrl = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(latestDeck));
            modal.find("#export").prop("href", downloadUrl).prop("download", latestDeck.name + ".json");
            modal.find(".activeDeck").text(latestDeck.name);
        }

        function resetImportForm() {
            importedDeck = null;
            modal.find(".importInput").val("");
            modal.find("#import").prop("disabled", true);
            modal.find(".warningMessage").addClass("hidden");
        }

        $(".container").append(modal);

        $("body").on("click", "#exportDeckmodal .dropdown-menu a", function() {
            var id = $(this).data("id");
            latestDeck = _.find(data, {_id:id});
            updateExportUrl();
        });

        modal.on("show.bs.modal", function(event) {
            ul.html(dropdown(_.sortBy(data, "name")));
            updateExportUrl();
        });

        modal.find(".importInput").on('change', function() {
            var file = this.files[0];
            modal.find(".warningMessage").addClass("hidden");
            if (!file) {
                return;
            }
            var reader = new FileReader();
            reader.onload = function(e) {
                try {
                    importedDeck = JSON.parse(e.target.result);
                } catch (exception) {
                    modal.find(".warningMessage").removeClass("hidden");
                }

                if (importedDeck.hasOwnProperty("name") && importedDeck.hasOwnProperty("limit"))  {
                    modal.find("#import").prop("disabled", false);
                } else {
                    modal.find(".warningMessage").removeClass("hidden");
                    modal.find("#import").prop("disabled", true);
                }
            };
            reader.readAsText(file);
        });

        modal.find("#import").on("click", function() {
            sanaa.createDeck(importedDeck, function(response) {
                data.push(response);
                resetImportForm();
            });
        });

        modal.on('hide.bs.modal', function() {
            resetImportForm();
            createList();
        });
    });

    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
    });
})();
