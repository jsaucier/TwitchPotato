module TwitchPotato {
    "use strict";

    export interface UserTokens {
        [key: string]: string;
    }

    export interface Game {
        name: string,
        channels: number,
        viewers: number,
        boxArt: string,
        followed?: boolean
    }

    export interface Games {
        [name: string]: Game
    }

    export class Twitch {

        static clientId = '60wzh4fjbowe6jwtofuc1jakjfgekry';
        static scope = 'user_read+user_follows_edit';
        static limit = 100;

        static urls = {
            featured: '',
            streams: '',

            games: Utils.Format('https://api.twitch.tv/kraken/games/top?limit={0}', Twitch.limit),

        }

        public users: UserTokens = {};
        public games: Games = {};

        constructor() { }

        public Authorize(username, update): void {

            if ($('#users .webview[username="' + username + '"]').length !== 0) {
                // Webview has already been created.
                return;
            }

            // Add the user to the users list.
            //this.users[username] = true;

            // Load the webview template
            var html = $($('#twitch-template').html().format(username));

            // Add the webview to the document.
            $('#users').append(html);

            // Get the webview.
            var webview = $('#users webview[username="' + username + '"]')[0];

            // Register an event for when the webview has finished loading.
            webview.addEventListener('contentload', () => this.InitializeWebView(username));

            // Hook the console message event.
            webview.addEventListener('consolemessage', function(e) {
                console.log(e);
            });

            // Update the followed channels and games if requested.
            //this.FollowedChannels(username);
            //this.FollowedGames(username);
            console.log('Uncomment');
        }

        private InitializeWebView = function(username): void {
            // Hide all of the webviews.
            $('#users webview').hide();

            // Iterate the webviews
            // Show remote webviews that need interaction
            // Initialize remote webviews that do not.
            $('#users webview').each((index: number, webview: Webview) => {
                // Webview needs user interaction, show this webview.
                if ($(webview).attr('src').indexOf('https://api.twitch.tv/kraken/oauth2') === 0) {
                    // Load the global inputs.
                    Application.Input.RegisterInputs(InputType.Global);

                    // Set the title head.
                    $('#users .head').text(Utils.Format('Enter the login for {0} | Press ESC to Cancel', $(webview).attr('username')));

                    // Show the webview.
                    $(webview).show();
                    $('#users').fadeIn();

                    return false;

                } else {
                    // Data to post.
                    var data = {
                        method: 'Init',
                        args: [username, Twitch.clientId, Twitch.scope]
                    };

                    // Post the data to the remote webview.
                    webview[0].contentWindow.postMessage(JSON.stringify(data), '*');
                }
            });
        }

        // Removes and clears all of the partition data.
        public ClearPartition(username: string, callback = () => { }) {
            // Get the webview.
            var webview = <Webview>$('#users webview[username="' + username + '"]')[0];

            if (webview !== undefined) {
                // Load the webview template
                var html = $($('#twitch-template').html().format(username));

                // Add the webview to the document.
                $('#users').append(html);

                // Get the webview.
                webview = <Webview>$('#users webview[username="' + username + '"]')[0];
            }

            // Clear the partition data.
            webview.clearData({}, {
                appcache: true,
                cookies: true,
                fileSystems: true,
                indexedDB: true,
                localStorage: true,
                webSQL: true
            },
                () => {
                    // Remove the webview.
                    $(webview).remove();

                    // Call the callback.
                    callback();
                });
        }

        public OnAuthorized = function(username, token) {
            // Store the token.
            this.users[username] = token;

            // Remove the webview from the document.
            $('#users webview[username="' + username + '"]').remove();

            // No webviews are open.
            if ($('#users webview').length === 0) {
                $('#users').fadeOut();
                $('#guide').fadeIn();

                Application.Guide.LoadInputs();
            }
        }

        private ShowError = function(xhr, status, error) {
            var json = xhr.responseJSON;
            Application.ShowError(Utils.Format('{0} - {1}: {2}', json.status, json.error, json.message));
        };

















        public UpdateGames = function(): void {
            this.games = {};

            $.ajax({
                url: Twitch.urls.games,
                error: this.ShowError,
                success: (json) => {
                    this.ParseGameJson(json);

                    // Load the next page of results
                    if (json._total > Twitch.limit)
                        for (var offset = Twitch.limit; offset < json._total; offset += Twitch.limit)
                            this.GetNextGames(Twitch.urls.games, offset);
                }
            });
        }

        private GetNextGames(url: string, offset: number): void {
            $.ajax({
                url: Utils.Format('&offset={0}', offset),
                error: this.ShowError,
                success: (json) => this.ParseGameJson(json),
            });
        }



























        private ParseGameJson(json): void {
            $.each(json.top, (index, g) => {
                this.games[g.game.name] = {
                    name: g.game.name,
                    channels: g.channels,
                    viewers: g.viewers,
                    boxArt: g.game.box.large
                };
            });
        }


    }
}
/*(function(potato, $, chrome, undefined) {


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
                url: 'https://api.twitch.tv/api/users/{0}/follows/games/{1}?oauth_token={2}&scope={3}'
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

        var getUserChannels = function(channels, next, current) {

            var limit = 100;
            var url = next || 'https://api.twitch.tv/kraken/streams?channel={0}&limit={1}'.format(channels.join(','), limit);

            current = current || 0;

            // Get the online channels.
            $.ajax({
                url: url,

                error: function(xhr, status, error) {
                    this.showError(xhr, status, error);
                }.bind(this),

                success: function(json) {
                    // Return the json to the guide.
                    potato.guide.onFollowedChannels(username, json);

                    // Load the next page of results
                    if (current + limit < json._total) {
                        getUserChannels(channels, json._links.next, current + limit);
                    }
                }.bind(this)
            });
        };

        $.ajax({
            url: 'https://api.twitch.tv/kraken/users/{0}/follows/channels'.format(username),

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

                // Get the channels the user is following.
                getUserChannels(channels);

            }.bind(this)
        });

    };

    Twitch.prototype.followedGames = function(username, next, current) {

        var limit = 100;
        var url = next || 'https://api.twitch.tv/api/users/{0}/follows/games?limit={1}'.format(username, limit);

        current = current || 0;

        $.ajax({
            url: url,

            error: function(xhr, status, error) {
                this.showError(xhr, status, error);
            }.bind(this),

            success: function(json) {
                // Update the guide.
                potato.guide.onFollowedGames(username, json);

                // Load the next page of results
                if (current + limit < json._total) {
                    this.followedGames(username, json._links.next, current + limit);
                }
            }.bind(this)
        });

    };



    Twitch.prototype.featured = function(next, current) {

        var limit = 100;
        var url = next || 'https://api.twitch.tv/kraken/streams/featured?limit={0}'.format(limit);

        current = current || 0;

        $.ajax({
            url: url,

            error: function(xhr, status, error) {
                this.showError(xhr, status, error);
            }.bind(this),

            success: function(json) {
                // Update the guide.
                potato.guide.onFeatured(json);

                // Load the next page of results
                if (current + limit < json._total) {
                    this.featured(json._links.next, current + limit);
                }
            }.bind(this)
        });

    };

    Twitch.prototype.channels = function(next, current) {

        var limit = 100;
        var url = next || 'https://api.twitch.tv/kraken/streams?limit={0}'.format(limit);

        current = current || 0;

        $.ajax({
            url: url,

            error: function(xhr, status, error) {
                this.showError(xhr, status, error);
            }.bind(this),

            success: function(json) {
                // Update the guide.
                potato.guide.onChannels(json);

                // Load the next page of results
                //if (current + limit < json._total) {
                    this.channels(json._links.next, current + limit);
                //}
            }.bind(this)
        });

    };

    Twitch.prototype.game = function(game, next, current) {

        var limit = 100;
        var url = next || 'https://api.twitch.tv/kraken/streams?game={0}&limit={1}'.format(game, limit);

        current = current || 0;

        $.ajax({
            url: url,

            error: function(xhr, status, error) {
                this.showError(xhr, status, error);
            }.bind(this),

            success: function(json) {
                // Update the guide.
                potato.guide.onGame(game, json);

                // Load the next page of results
                if (current + limit < json._total) {
                    this.game(game, json._links.next, current + limit);
                }
            }.bind(this)
        });

    };

    Twitch.prototype.video = function(channel) {

        var limit = 100;
        var url = next || 'https://api.twitch.tv/kraken/channels/{0}/videos?&limit={1}'.format(channel, limit);

        current = current || 0;

        $.ajax({
            url: url,

            error: function(xhr, status, error) {
                this.showError(xhr, status, error);
            }.bind(this),

            success: function(json) {
                // Update the guide.
                potato.guide.onVideo(channel, json);

                // Load the next page of results
                if (current + limit < json._total) {
                    this.video(channel, json._links.next, current + limit);
                }
            }.bind(this)
        });
    };

    potato.twitch = new Twitch();

    window.addEventListener('message', function(event) {

        // Parse the json message.
        var json = JSON.parse(event.data);

        // Call the method based on the message.
        this['on' + json.method].apply(this, json.args);

    }.bind(potato.twitch));

}(window.Potato, window.jQuery, window.chrome));*/
