(function(potato, $, chrome, undefined) {

    var Twitch = function() {
        this.accounts = [];
        this.clientId = '60wzh4fjbowe6jwtofuc1jakjfgekry';
    };


    Twitch.prototype.onFollowChannel = function(account) {};
    Twitch.prototype.onUnfollowChannel = function(account) {};
    Twitch.prototype.onFollowGame = function(account) {};
    Twitch.prototype.onUnfollowGame = function(account) {};

    Twitch.prototype.onFollowedChannels = function(account, json) {
        potato.guide.onFollowedChannels(account, json);
    };

    Twitch.prototype.onFollowedGames = function(account, json) {
        potato.guide.onFollowedGames(account, json);
    };

    Twitch.prototype.onFollowedVideos = function(account, json) {
        potato.guide.onFollowedVideos(account, json);
    };

    Twitch.prototype.getFeatured = function() {
        $.ajax({
            url: 'https://api.twitch.tv/kraken/streams/featured?limit=100',
            success: function(json) {
                potato.guide.onFeatured(json);
            }
        });
    };

    Twitch.prototype.getChannels = function() {
        $.ajax({
            url: 'https://api.twitch.tv/kraken/streams?limit=100',
            success: function(json) {
                potato.guide.onChannels(json);
            }
        });
    };

    Twitch.prototype.getGames = function() {
        $.ajax({
            url: 'https://api.twitch.tv/kraken/games/top?limit=100',
            success: function(json) {
                potato.guide.onGames(json);
            }
        });
    };

    Twitch.prototype.getGame = function(game) {
        $.ajax({
            url: 'https://api.twitch.tv/kraken/streams?game={0}&limit=100'.format(game),
            success: function(json) {
                potato.guide.onGame(game, json);
            }
        });
    };

    Twitch.prototype.new = function(account) {

        // Load the webview template
        var html = $($('#account-template').html()
            .format(account, chrome.runtime.id, this.clientId));

        // Add the webview to the document.
        $('#accounts').append(html);

        // Get the webview.
        var webview = $('#accounts webview[account="' + account + '"]')[0];

        // Create the account object.
        var acc = {
            account: account,
            webview: webview
        };
        // Add the account object to our list.
        this.accounts.push(acc);

        potato.guide.loading.channels++;
        potato.guide.loading.videos++;
        potato.guide.loading.games++;

        // Register an event for when the webview has finished loading.
        webview.addEventListener('contentload', function() {

            if ($(webview).attr('src').indexOf('https://api.twitch.tv/kraken/oauth2/authorize') !== -1) { //}?client_id=60wzh4fjbowe6jwtofuc1jakjfgekry&redirect_uri=https%3A%2F%2Fdl.dropboxusercontent.com%2Fspa%2Ftn9l4tkx2yhpiv3%2Ftwitch%2520potato%2Fpublic%2Fredirect.html&response_type=token&scope=user_read+channel_read') {
                $(webview).show();
                $('#accounts').show();
                this.updateVisibility(acc);
            } else {
                $(webview).hide();
                this.updateVisibility(acc);

                // Initialize the webview.
                this.post(account, 'Init', [this.clientId]);
            }

        }.bind(this));

        // Hook the console message event.
        webview.addEventListener('consolemessage', function(e) {
            //console.log(e);
        });

        return acc;

    };

    Twitch.prototype.logout = function(acount) {

        this.post(account, 'Logout');

    };
    Twitch.prototype.onLogout = function(account) {};

    Twitch.prototype.onError = function(account, json) {
        console.log(account, 'Error:', json.error);
    };

    Twitch.prototype.followChannel = function(account, channel) {
        this.post(account, 'FollowChannel', [channel]);
    };
    Twitch.prototype.unfollowChannel = function(account, channel) {
        this.post(account, 'UnfollowChannel', [channel]);
    };
    Twitch.prototype.followGame = function(account, game) {
        this.post(account, 'FollowGame', [game]);
    };
    Twitch.prototype.unfollowGame = function(account, game) {
        this.post(account, 'UnfollowGame', [game]);
    };
    Twitch.prototype.followedChannels = function(account) {
        this.post(account, 'FollowedChannels');
    };
    Twitch.prototype.followedGames = function(account) {
        this.post(account, 'FollowedGames');
    };
    Twitch.prototype.followedVideos = function(account) {
        this.post(account, 'FollowedVideos');
    };

    Twitch.prototype.updateVisibility = function(account) {

        if ($('#accounts webview:visible').length === 0) {
            $('#accounts').hide();
        } else {
            console.log(account);
            // Hide all webviews
            $('#accounts webview').hide();
            // Show the first one
            ///$('#accounts webview:eq(0)').show();
            $(account.webview).show();
            // Set the title
            $('#accounts .head').text('Enter the login for {0} | Press ESC to Cancel'.format(account.account));
            // Show the container
            $('#accounts').show();
        }

    };

    Twitch.prototype.getTwitch = function(account) {

        for (var i in this.accounts) {
            var acc = this.accounts[i];

            if (acc.account == account) {
                return acc;
            }
        }

    };

    Twitch.prototype.post = function(account, method, args) {

        // Get the account
        var acc = this.getTwitch(account);

        if (acc !== undefined) {
            // Get the webview for this account.
            var webview = acc.webview;

            if (webview !== undefined) {

                // Default args if needed.
                args = args || [];

                // Add the account to the beginning of the args.
                args.unshift(account);

                // Data object we are posting.
                var data = {
                    method: method,
                    args: args
                };

                // Post the message to the webview.
                webview.contentWindow.postMessage(JSON.stringify(data), '*');
            }
        }
    };

    potato.twitch = new Twitch();

    window.addEventListener('message', function(event) {

        // Parse the json message.
        var json = JSON.parse(event.data);

        // Call the method based on the message.
        this['on' + json.method].apply(this, json.args);

    }.bind(potato.twitch));

}(window.Potato, window.jQuery, window.chrome));