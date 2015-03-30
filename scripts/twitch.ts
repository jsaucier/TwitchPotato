"use strict";

module TwitchPotato {
    export class Twitch {
        static clientId = '60wzh4fjbowe6jwtofuc1jakjfgekry';
        static scope = 'user_read+user_follows_edit';
        static limit = 100;

        static urls = {
            followChannel: 'https://api.twitch.tv/kraken/users/{0}/follows/channels/{1}?oauth_token={2}&scope={3}',
            followGame: 'https://api.twitch.tv/api/users/{0}/follows/games/{1}?oauth_token={2}&scope={3}',
            followedChannels: 'https://api.twitch.tv/kraken/users/{0}/follows/channels',
            followedGames: 'https://api.twitch.tv/api/users/{0}/follows/games',
            featured: 'https://api.twitch.tv/kraken/streams/featured?limit={0}',
            topChannels: 'https://api.twitch.tv/kraken/streams?limit={0}',
            games: 'https://api.twitch.tv/kraken/games/top?limit={0}',
            game: 'https://api.twitch.tv/kraken/streams?game={0}&limit={1}',
            videos: 'https://api.twitch.tv/kraken/channels/{0}/videos?&limit={1}',
            searchChannels: 'https://api.twitch.tv/kraken/streams?channel={0}&limit={1}',
            searchGame: 'https://api.twitch.tv/kraken/search/games?q={0}&type=suggest&limit={1}'
        }

        public channelsTable: Dictionary<Channel> = {};
        public gamesTable: Dictionary<Game> = {};
        public videosTable: Dictionary<Video> = {};

        public followedChannels: Dictionary<string> = {};
        public followedGames: Dictionary<string> = {};
        public featuredChannels: Dictionary<string> = {};
        public topChannels: Dictionary<string> = {};
        public gameChannels: Dictionary<string> = {};
        public topGames: Dictionary<string> = {};
        public gameVideos: Dictionary<string> = {};

        public users: Dictionary<string> = {};

        constructor() {
            window.addEventListener('message', (event) => {
                // Parse the json message.
                var json = JSON.parse(event.data);

                // Call the method based on the message.
                this['on' + json.method].apply(this, json.args);
            });
        }

        /*
         * Creates a new webview to authorize and retrieve the oauth code.
         */
        public Authorize(username: string): void {

            if ($('#users .webview[username="' + username + '"]').length !== 0) {
                // Webview has already been created.
                return;
            }

            // Load the webview template
            var html = $(Utils.Format($('#twitch-template').html(), username));

            // Add the webview to the document.
            $('#users').append(html);

            // Get the webview.
            var webview = $('#users webview[username="' + username + '"]')[0];

            // Register an event for when the webview has finished loading.
            webview.addEventListener('contentload', () => this.InitializeWebView(username));

            // Hook the console message event.
            webview.addEventListener('consolemessage', (e) => {
                console.log(e);
            });

            // Update the followed channels and games if requested.
            this.GetFollowedChannels(username);
            this.GetFollowedGames(username);
        }

        /*
         * Initializes the webview and loads the remote url to handle the oauth redirect.
         */
        private InitializeWebView(username): void {
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

        /*
         * Removes and clears all of the partition data.
         */
        public ClearPartition(username: string, callback = () => { }) {
            // Get the webview.
            var webview = <Webview>$('#users webview[username="' + username + '"]')[0];

            if (webview !== undefined) {
                // Load the webview template
                var html = $(Utils.Format($('#twitch-template').html(), username));

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

        /*
         * Callback function when the remote webview has authorized the user.
         */
        public OnAuthorized(username: string, token: string): void {
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

        /*
         * Shows the json error.
         */
        private ShowError(xhr, status, error) {
            var json = xhr.responseJSON;
            Application.ShowError(Utils.Format('{0} - {1}: {2}', json.status, json.error, json.message));
        }

        /*
         * Follows the channel.
         */
        public FollowChannel(username: string, channel: string, unfollow = false) {
            var users = [];

            if (username === 'all') {
                $.each(this.users, (user, value) => {
                    users.push(user);
                });
            } else {
                users = [username];
            }

            $.each(users, (index, user) => {
                var url = Utils.Format(Twitch.urls.followChannel,
                    user, channel, this.users[user], Twitch.scope);

                $.ajax({
                    url: url,
                    type: (unfollow === true) ? 'DELETE' : 'PUT',
                    error: this.ShowError,
                    success: () => {
                        // Update the followed channels immediately.
                        this.GetFollowedChannels(user);

                        // Get the time to delay.
                        var time = (unfollow === true) ? 5000 : 1000;

                        // Update the followed channels after a delay.
                        setTimeout(() => this.GetFollowedChannels(user), time);
                    }
                });
            });
        }

        /*
         * Follows the game.
         */
        public FollowGame(username: string, game: string, unfollow = false) {
            var users = [];

            if (username === 'all') {
                $.each(this.users, (user, value) => {
                    users.push(user);
                });
            } else {
                users = [username];
            }

            $.each(users, (index, user) => {
                var url = Utils.Format(Twitch.urls.followGame,
                    user, game, this.users[user], Twitch.scope);

                $.ajax({
                    url: url,
                    type: (unfollow === true) ? 'DELETE' : 'PUT',
                    error: this.ShowError,
                    success: () => {
                        // Update the followed games immediately.
                        this.GetFollowedGames(user);

                        // Get the time to delay.
                        var time = (unfollow === true) ? 5000 : 1000;

                        // Update the followed games after a delay.
                        setTimeout(() => this.GetFollowedGames(user), time);
                    }
                });
            });
        }

        /*
         * Updates the featured channels.
         */
        public GetFeatured(getAll = true): void {
            /* Reset the featured dictionary. */
            this.featuredChannels = {};

            /* Format the url for the ajax call. */
            var url = Utils.Format(Twitch.urls.featured, Twitch.limit);

            /* Ajax call to get the games. */
            $.ajax({
                url: url,
                error: this.ShowError,
                success: (json) => {
                    /* Process the ajax results. */
                    this.ParseChannelsObject(json.featured, this.featuredChannels);

                    /* Load the next page of results. */
                    if (getAll === true && json._total > Twitch.limit)
                        for (var offset = Twitch.limit; offset < json._total; offset += Twitch.limit)
                            this.GetNextChannels(url, offset, this.featuredChannels);
                }
            });
        }

        /*
         * Updates the top channels.
         */
        public GetTopChannels(getAll = false): void {
            /* Reset the top channels dictionary. */
            this.topChannels = {};

            /* Format the url for the ajax call. */
            var url = Utils.Format(Twitch.urls.topChannels, Twitch.limit);

            /* Ajax call to get the top channels. */
            $.ajax({
                url: url,
                error: this.ShowError,
                success: (json) => {
                    /* Process the ajax results. */
                    this.ParseChannelsObject(json.streams, this.topChannels);

                    /* Load the next page of results. */
                    if (getAll === true && json._total > Twitch.limit)
                        for (var offset = Twitch.limit; offset < json._total; offset += Twitch.limit)
                            this.GetNextChannels(url, offset, this.topChannels);
                }
            });
        }

        /*
         * Gets all of the games.
         */
        public GetTopGames(getAll = true): void {
            /* Reset the top games dictionary. */
            this.topGames = {};

            /* Format the url for the ajax call. */
            var url = Utils.Format(Twitch.urls.games, Twitch.limit);

            /* Ajax call to get the games. */
            $.ajax({
                url: url,
                error: this.ShowError,
                success: (json) => {
                    /* Process the ajax results. */
                    this.ParseGamesObject(json.top, this.topGames);

                    /* Load the next page of results. */
                    if (getAll === true && json._total > Twitch.limit)
                        for (var offset = Twitch.limit; offset < json._total; offset += Twitch.limit)
                            this.GetNextGames(url, offset, this.topGames);
                }
            });
        }

        /*
         * Gets the channels for a game.
         */
        public GetGameChannels(game: string, getAll = true) {
            /* Resets the game dictionary. */
            this.gameChannels = {};

            /* Format the url for the ajax call. */
            var url = Utils.Format(Twitch.urls.game, game, Twitch.limit);

            /* Ajax call to get the game channels. */
            $.ajax({
                url: url,
                error: this.ShowError,
                success: (json) => {
                    /* Process the ajax results. */
                    this.ParseChannelsObject(json.streams, this.gameChannels);

                    /* Load the next page of results. */
                    if (getAll === true && json._total > Twitch.limit)
                        for (var offset = Twitch.limit; offset < json._total; offset += Twitch.limit)
                            this.GetNextChannels(url, offset, this.gameChannels);
                }
            });
        }

        /*
         * Get the vidoes for a channe.
         */
        public GetChannelVideos(channel, getAll = true) {
            /* Resets the videos dictionary. */
            this.gameVideos = {};

            /* Format the url for the ajax call. */
            var url = Utils.Format(Twitch.urls.videos, channel, Twitch.limit);

            /* Ajax call to get the game channels. */
            $.ajax({
                url: url,
                error: this.ShowError,
                success: (json) => {
                    /* Process the ajax results. */
                    this.ParseVideosObject(json.videos, this.gameVideos);

                    /* Load the next page of results. */
                    if (getAll === true && json._total > Twitch.limit)
                        for (var offset = Twitch.limit; offset < json._total; offset += Twitch.limit)
                            this.GetNextVideos(url, offset, this.gameVideos);
                }
            });
        }

        /*
         * Get the followed channels for the Twitch user.
         */
        public GetFollowedChannels(username) {
            /* Array of channels to search because they aren't known at this point. */
            var search: string[] = [];

            /* Resets the followed channels dictionary. */
            this.followedChannels = {};

            /* Format the url for the ajax call. */
            var url = Utils.Format(Twitch.urls.followedChannels, username);

            /* Ajax call to get the game channels. */
            $.ajax({
                url: url,
                error: this.ShowError,
                success: (json) => {
                    $.each(json.follows, (index, channel) => {
                        /* Add the channel to the search list. */
                        search.push(channel.channel.name);
                    });

                    /* Get the online followed channels. */
                    this.GetChannelsByName(search, this.followedChannels);
                }
            });

        }

        /*
         * Get the followed games for the Twitch user.
         */
        public GetFollowedGames(username) {
            /* Array of channels to search because they aren't known at this point. */
            var search: string[] = [];

            /* Resets the followed channels dictionary. */
            this.followedGames = {};

            /* Format the url for the ajax call. */
            var url = Utils.Format(Twitch.urls.followedGames, username);

            /* Ajax call to get the games. */
            $.ajax({
                url: url,
                error: this.ShowError,
                success: (json) => {
                    /* Get the followed games. */
                    $.each(json.follows, (index, game) => {
                        this.followedGames[game.name] = game.name;
                    });
                }
            });

        }

        /*
         * Gets the channels by comma delimited names.
         */
        private GetChannelsByName(channels: string[], dictionary: Dictionary<string>) {
            /* Format the url for the ajax call. */
            var url = Utils.Format(Twitch.urls.searchChannels, channels.join(), Twitch.limit);

            /* Ajax call to get the games. */
            $.ajax({
                url: url,
                error: this.ShowError,
                success: (json) => {
                    this.ParseChannelsObject(json.streams, dictionary);

                    // Load the next page of results
                    if (json._total > Twitch.limit)
                        for (var offset = Twitch.limit; offset < json._total; offset += Twitch.limit)
                            this.GetNextChannels(url, offset, dictionary);
                }
            });
        }

        /*
         * Loads the next page of channels.
         */
        private GetNextChannels(url: string, offset: number, dictionary: Dictionary<string>) {
            $.ajax({
                url: Utils.Format(url + '&offset={0}', offset),
                error: this.ShowError,
                success: (json) => this.ParseChannelsObject(json.streams, dictionary),
            });
        }

        /*
         * Loads the next page of games.
         */
        private GetNextGames(url: string, offset: number, dictionary: Dictionary<string>): void {
            $.ajax({
                url: Utils.Format(url + '&offset={0}', offset),
                error: this.ShowError,
                success: (json) => this.ParseGamesObject(json.top, dictionary),
            });
        }

        /*
         * Loads the next page of videos.
         */
        private GetNextVideos(url: string, offset: number, dictionary: Dictionary<string>): void {
            $.ajax({
                url: Utils.Format(url + '&offset={0}', offset),
                error: this.ShowError,
                success: (json) => this.ParseVideosObject(json.videos, dictionary),
            });
        }

        /*
         * Converts a json object to a channel.
         */
        private ParseChannelsObject(object, dictionary: Dictionary<string>): void {
            $.each(object, (index, data) => {
                /* Get the featured channel data. */
                if (data.stream !== undefined)
                    data = data.stream;

                /* Create the dictionary entry. */
                dictionary[data.channel.name] = data.channel.name;

                /* Create the channel dictionary entry. */
                this.channelsTable[data.channel.name] = {
                    name: data.channel.name,
                    streamer: data.channel.display_name,
                    title: data.channel.status,
                    viewers: data.viewers,
                    game: data.game,
                    preview: data.preview.large
                }
            });
        }

        /*
         * Converts a json object to a game.
         */
        private ParseGamesObject(object, dictionary: Dictionary<string>, followed = false): void {
            $.each(object, (index, data) => {
                /* Create the dictionary entry. */
                dictionary[data.game.name] = data.game.name;

                /* Create the channel dictionary entry. */
                this.gamesTable[data.game.name] = {
                    name: data.game.name,
                    channels: data.channels || -1,
                    viewers: data.viewers || -1,
                    boxArt: data.game.box.large
                };
            });
        }

        /*
         * Converts a json object to a video.
         */
        private ParseVideosObject(object, dictionary: Dictionary<string>): void {
            $.each(object, (index, data) => {
                /* Create the dictionary entry. */
                dictionary[data._id] = data._id;

                /* Create the channel dictionary entry. */
                this.videosTable[data._id] = {
                    id: data._id,
                    name: data.channel.name,
                    streamer: data.channel.display_name,
                    title: data.title,
                    views: data.views,
                    length: data.length,
                    preview: (data.preview || '').replace(/320x240/, '640x360')
                };
            });
        }
    }
}
