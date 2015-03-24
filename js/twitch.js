(function(potato, $, chrome, undefined) {

    var Twitch = function() {
        this.users = {};
        this.clientId = '60wzh4fjbowe6jwtofuc1jakjfgekry';
        this.scope = 'user_read+user_follows_edit';
    };

    Twitch.prototype.authorize = function(username, update) {

        if ($('#accounts .webview[username="' + username + '"]').length !== 0) {
            // Webview has already been created.
            return false;
        }

        // Add the user to the users list.
        this.users[username] = true;

        // Load the webview template
        var html = $($('#twitch-template').html().format(username));

        // Add the webview to the document.
        $('#accounts').append(html);

        // Get the webview.
        var webview = $('#accounts webview[username="' + username + '"]')[0];

        // Register an event for when the webview has finished loading.
        webview.addEventListener('contentload', function() {
            this.initializeWebView(username);
        }.bind(this));

        // Hook the console message event.
        webview.addEventListener('consolemessage', function(e) {
            console.log(e);
        });

        // Update the followed channels and games if requested.
        this.followedChannels(username);
        this.followedGames(username);

    };

    Twitch.prototype.initializeWebView = function(username) {

        // Reference to this.
        var that = this;

        // Hide all of the webviews.
        $('#accounts webview').hide();

        // Iterate the webviews
        // Show remote webviews that need interaction
        // Initialize remote webviews that do not.
        $('#accounts webview').each(function() {

            // Webview needs user interaction, show this webview.
            if ($(this).attr('src').indexOf('https://api.twitch.tv/kraken/oauth2') === 0) {
                // Register online the global inputs
                potato.input.registerInputs(potato);

                // Set the title head.
                $('#accounts .head').text('Enter the login for {0} | Press ESC to Cancel'.format($(this).attr('username')));

                // Show the webview.
                $(this).show();
                $('#accounts').fadeIn();

                return false;

            } else {
                // Data to post.
                var data = {
                    method: 'Init',
                    args: [username, that.clientId, that.scope]
                };

                // Post the data to the remote webview.
                $(this)[0].contentWindow.postMessage(JSON.stringify(data), '*');
            }
        });

    };

    // Removes and clears all of the partition data.
    Twitch.prototype.remove = function(username, callback) {

        // Load the webview template
        var html = $($('#twitch-template').html().format(username));

        // Add the webview to the document.
        $('#accounts').append(html);

        // Get the webview.
        var webview = $('#accounts webview[username="' + username + '"]')[0];

        // Clear the partition data.
        webview.clearData({}, {
                appcache: true,
                cookies: true,
                fileSystems: true,
                indexedDB: true,
                localStorage: true,
                webSQL: true
            },
            function() {
                if (callback !== undefined && typeof(callback) === 'function') {
                    callback();
                }
            }.bind(this));

    };

    Twitch.prototype.onAuthorized = function(username, token) {

        // Store the token.
        this.users[username] = token;

        // Remove the webview from the document.
        $('#accounts webview[username="' + username + '"]').remove();

        // No webviews are open.
        if ($('#accounts webview').length === 0) {
            $('#accounts').fadeOut();
            $('#guide').fadeIn();

            potato.input.registerInputs(potato.guide);
        }

    };

    Twitch.prototype.showError = function(xhr, status, error) {

        var json = xhr.responseJSON;
        potato.showError('{0} - {1}: {2}'.format(json.status, json.error, json.message));
    };

    Twitch.prototype.followChannel = function(username, channel, unfollow) {

        var users = [];

        if (username === 'all') {
            $.each(this.users, function(user, value) {
                users.push(user);
            });
        } else {
            users = [username];
        }

        $.each(users, function(index, user) {
            $.ajax({
                url: 'https://api.twitch.tv/kraken/users/{0}/follows/channels/{1}?oauth_token={2}&scope={3}'
                    .format(user, channel, this.users[user], this.scope),
                type: (unfollow === true) ? 'DELETE' : 'PUT',

                error: function(xhr, status, error) {
                    this.showError(xhr, status, error);
                }.bind(this),

                success: function() {
                    // Update the followed channels immediately.
                    this.followedChannels(user);

                    // Get the time to delay.
                    var time = (unfollow === true) ? 5000 : 1000;

                    // Update the followed channels after a delay.
                    setTimeout(function() {
                        this.followedChannels(user);
                    }.bind(this), time);
                }.bind(this)
            });
        }.bind(this));

    };

    Twitch.prototype.followGame = function(username, game, unfollow) {

        var users = [];

        if (username === 'all') {
            $.each(this.users, function(user, value) {
                users.push(user);
            });
        } else {
            users = [username];
        }

        $.each(users, function(index, user) {
            $.ajax({
                url: 'https://api.twitch.tv/api/users/{0}/follows/games/{1}?oauth_token={2}&scope={3}&limit=100'
                    .format(user, game, this.users[user], this.scope),
                type: (unfollow === true) ? 'DELETE' : 'PUT',

                error: function(xhr, status, error) {
                    this.showError(xhr, status, error);
                }.bind(this),

                success: function() {
                    // Update the followed games immediately.
                    this.followedGames(user);

                    // Get the time to delay.
                    var time = (unfollow === true) ? 5000 : 1000;

                    // Update the followed games after a delay.
                    setTimeout(function() {
                        this.games(user);
                    }.bind(this), time);
                }.bind(this)
            });
        }.bind(this));

    };

    Twitch.prototype.followedChannels = function(username) {

        $.ajax({
            url: 'https://api.twitch.tv/kraken/users/{0}/follows/channels?limit=100'.format(username),

            error: function(xhr, status, error) {
                this.showError(xhr, status, error);
            }.bind(this),

            success: function(json) {
                // Channels list.
                var channels = [];

                // Iterate the followed channels.
                $.each(json.follows, function(index, value) {
                    channels.push(value.channel.name);
                });

                // Get the online channels.
                $.ajax({
                    url: 'https://api.twitch.tv/kraken/streams?channel={0}&limit=100'.format(channels.join(',')),
                    error: function(xhr, status, error) {
                        this.showError(xhr, status, error);
                    }.bind(this),
                    success: function(json) {
                        // Return the json to the guide.
                        potato.guide.onFollowedChannels(username, json);
                    }.bind(this)
                });
            }.bind(this)
        });

    };

    Twitch.prototype.followedGames = function(username) {
        $.ajax({
            url: 'https://api.twitch.tv/api/users/{0}/follows/games?limit=100'.format(username),

            error: function(xhr, status, error) {
                this.showError(xhr, status, error);
            }.bind(this),

            success: function(json) {
                // Update the guide.
                potato.guide.onFollowedGames(username, json);
            }
        });
    };

    Twitch.prototype.games = function() {
        $.ajax({
            url: 'https://api.twitch.tv/kraken/games/top?limit=100',

            error: function(xhr, status, error) {
                this.showError(xhr, status, error);
            }.bind(this),

            success: function(json) {
                potato.guide.onGames(json);
            }
        });
    };

    Twitch.prototype.featured = function() {
        $.ajax({
            url: 'https://api.twitch.tv/kraken/streams/featured?limit=100',

            error: function(xhr, status, error) {
                this.showError(xhr, status, error);
            }.bind(this),

            success: function(json) {
                potato.guide.onFeatured(json);
            }
        });
    };

    Twitch.prototype.channels = function() {
        $.ajax({
            url: 'https://api.twitch.tv/kraken/streams?limit=100',

            error: function(xhr, status, error) {
                this.showError(xhr, status, error);
            }.bind(this),

            success: function(json) {
                potato.guide.onChannels(json);
            }
        });
    };

    Twitch.prototype.game = function(game) {
        $.ajax({
            url: 'https://api.twitch.tv/kraken/streams?game={0}&limit=100'.format(game),

            error: function(xhr, status, error) {
                this.showError(xhr, status, error);
            }.bind(this),

            success: function(json) {
                potato.guide.onGame(game, json);
            }
        });
    };

    Twitch.prototype.video = function(channel) {
        $.ajax({
            url: 'https://api.twitch.tv/kraken/channels/{0}/videos?limit=100'.format(channel),

            error: function(xhr, status, error) {
                this.showError(xhr, status, error);
            }.bind(this),

            success: function(json) {
                potato.guide.onVideo(channel, json);
            }
        });
    };

    potato.twitch = new Twitch();

    window.addEventListener('message', function(event) {

        // Parse the json message.
        var json = JSON.parse(event.data);

        // Call the method based on the message.
        this['on' + json.method].apply(this, json.args);

    }.bind(potato.twitch));

}(window.Potato, window.jQuery, window.chrome));