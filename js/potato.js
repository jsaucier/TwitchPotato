(function(window, $, chrome, undefined) {

    var Potato = function() {
        this.accounts = [];
        this.zoom = 100;
    };


    Potato.prototype.onInput = function(id, type) {

        var input = this.input.getRegisteredInput(id, type);

        if (input !== undefined && input.type === 'keyup') {

            switch (input.id) {
                case 'potatoExit':
                    if ($('#webviews webview:visible').length === 0) {
                        window.close();
                    } else {
                        $('#webview webview').fadeOut();
                        // Register guide inputs.
                        this.input.registerInputs(potato.guide);
                    }
                    break;
                case 'potatoGuideToggle':
                    potato.toggleGuide();
                    break;
                case 'potatoZoomIn':
                    potato.updateZoom('in');
                    break;
                case 'potatoZoomOut':
                    potato.updateZoom('out');
                    break;
                case 'potatoZoomReset':
                    potato.updateZoom('reset');
                    break;
                default:
                    break;
            }
        }

    };

    Potato.prototype.initialize = function() {
        // Load the stored data.
        this.loadStoredData();

        // Update the guide.
        this.guide.updateAll(true);
    };

    Potato.prototype.loadStoredData = function() {
        // Retrieved the stored zoom setting.
        this.loadStoredValue('local', 'zoom', function() {
            // Update the zoom.
            this.updateZoom();
        }.bind(this));

        // Retrieve the stored twitch accounts.
        this.loadStoredValue('sync', 'accounts', function() {
            // Load the twitch accounts.
            for (var i in this.accounts) {
                // Load the twitch account.
                this.twitch.new(this.accounts[i]);
            }
        }.bind(this));
    };

    Potato.prototype.loadStoredValue = function(type, value, callback) {
        // Get the stored value.
        chrome.storage[type].get([value], function(store) {
            if ($.isEmptyObject(store) === true) {
                // Set the default value.
                store[value] = this[value];

                // Save the default value.
                chrome.storage[type].set(store);
            }

            // Set the value.
            //for (var prop in store) {
            this[value] = store[value];
            //}

            // Call the callback function
            return callback();
        }.bind(this));
    };

    Potato.prototype.toggleGuide = function() {

        if ($('#guide').is(':visible')) {
            $('#players').fadeIn();
            $('#guide').fadeOut();
            this.input.registerInputs(this.player);
        } else {
            $('#players').fadeOut();
            $('#guide').fadeIn();
            this.input.registerInputs(this.guide);
        }

    };

    Potato.prototype.updateZoom = function(direction) {

        // Update the zoom value.
        if (direction === 'in') {
            this.zoom += 1;
        } else if (direction === 'out') {
            this.zoom -= 1;
        } else if (direction === 'reset') {
            this.zoom = 100;
        }

        // Store the zoom locally.
        chrome.storage.local.set({
            zoom: this.zoom
        }, function() {

            // Update the application zoom.
            $('body').css('font-size', this.zoom + '%');
            // Update the menu size
            this.guide.updateMenuSize();

            // Update the mneu scroll position
            this.guide.updateMenuScroll();

            // Update the chat css
            if ($('#players .chat webview').length > 0) {
                $('#players .chat webview')[0].insertCSS({
                    code: 'body { font-size: ' + this.zoom + '%!important; }'
                });
            }

        }.bind(this));
    };


    /*showNotification: function() {
        $('#notification ul').empty();

        for (var c in me.notifications.notify) {
            var info = me.notifications.notify[c];

            var item = $($('#notify-template').html());

            item.find('.streamer').text(info.streamer);
            item.find('.game').text(info.game);
            item.find('.status').text(info.status);

            item.appendTo($('#notification ul'));
        }

        $('#notification').fadeIn(function() {
            setTimeout(function() {
                $('#notification').fadeOut();
            }, 5000);
        });
    },*/

    var potato = new Potato();

    $(function() {
        potato.initialize();
    });

    window.Potato = potato;

})(window, jQuery, chrome);