module TwitchPotato {
    "use strict";

    export class Twitch {
        static clientId = '60wzh4fjbowe6jwtofuc1jakjfgekry';
        static scope = 'user_read+user_follows_edit';
        static limit = 100;

        static urls = {
            followChannel: 'https://api.twitch.tv/kraken/users/{0}/follows/channels/{1}?oauth_token={2}&scope={3}',
            followGame: 'https://api.twitch.tv/api/users/{0}/follows/games/{1}?oauth_token={2}&scope={3}',
            followedChannels: 'https://api.twitch.tv/kraken/users/{0}/follows/channels?limit={1}',
            followedGames: 'https://api.twitch.tv/api/users/{0}/follows/games?limit={1}',
            channels: 'https://api.twitch.tv/kraken/streams?limit={0}',
            games: 'https://api.twitch.tv/kraken/games/top?limit={0}',
            game: 'https://api.twitch.tv/kraken/streams?game={0}&limit={1}',
            videos: 'https://api.twitch.tv/kraken/channels/{0}/videos?&limit={1}',
            searchChannels: 'https://api.twitch.tv/kraken/streams?channel={0}&limit={1}',
            searchGame: 'https://api.twitch.tv/kraken/search/games?q={0}&type=suggest&limit={1}'
        }

        public users: Dictionary<string> = {};
        public menus: TwitchItems = {
            0: {},
            1: {},
            2: {},
            3: {}
        };
        public followed: Dictionary<Dictionary<boolean>> = {};

        constructor() {
            window.addEventListener('message', (event) => {
                /* Parse the json message. */
                var json = JSON.parse(event.data);

                /* Call the method based on the message. */
                this['On' + json.method].apply(this, json.args);
            });
        }

        /*
         * Creates a new webview to authorize and retrieve the oauth code.
         */
        public Authorize(username: string): void {
            if ($('#users .webview[username="' + username + '"]').length !== 0) {
                /* Webview has already been created. */
                return;
            }

            /* Load the webview template */
            var html = $(Utils.Format($('#twitch-template').html(), username));

            /* Add the webview to the document. */
            $('#users').append(html);

            /* Get the webview. */
            var webview = $('#users webview[username="' + username + '"]')[0];

            /* Register an event for when the webview has finished loading. */
            webview.addEventListener('contentload', () => this.InitializeWebView(username));

            /* Hook the console message event. */
            webview.addEventListener('consolemessage', (e) => Utils.ConsoleMessage(e));

            /* Update the followed channels and games if requested. */
            this.GetFollowedChannels(username);
            this.GetFollowedGames(username);
        }

        /*
         * Initializes the webview and loads the remote url to handle the oauth redirect.
         */
        private InitializeWebView(username): void {
            /* Hide all of the webviews. */
            $('#users webview').hide();

            /* Iterate the webviews
             * Show remote webviews that need interaction
             * Initialize remote webviews that do not. */
            var webview: Webview = <Webview>$(Utils.Format('#users webview[username="{0}"]', username))[0];

            if ($(webview).attr('src').indexOf('https://api.twitch.tv/kraken/oauth2/') === 0) {
                /* Set the title head. */
                $('#users .head').text(Utils.Format('Enter the login for {0} | Press ESC to Cancel', $(webview).attr('username')));

                /* Show the webview. */
                $(webview).show();
                $('#users').fadeIn();
            } else {
                /* Data to post. */
                var data = {
                    method: 'Init',
                    args: [username, Twitch.clientId, Twitch.scope]
                };

                /* Post the data to the remote webview. */
                webview.contentWindow.postMessage(JSON.stringify(data), '*');
            }
        }

        /*
         * Removes and clears all of the partition data.
         */
        public ClearPartition(username: string, callback = () => { }) {
            /* Get the webview. */
            var webview = <Webview>$('#users webview[username="' + username + '"]')[0];

            if (webview !== undefined) {
                /* Load the webview template */
                var html = $(Utils.Format($('#twitch-template').html(), username));

                /* Add the webview to the document. */
                $('#users').append(html);

                /* Get the webview. */
                webview = <Webview>$('#users webview[username="' + username + '"]')[0];
            }

            /* Clear the partition data. */
            webview.clearData({}, {
                appcache: true,
                cookies: true,
                fileSystems: true,
                indexedDB: true,
                localStorage: true,
                webSQL: true
            },
                () => {
                    /* Remove the webview. */
                    $(webview).remove();

                    /* Call the callback. */
                    callback();
                });
        }

        /*
         * Callback function when the remote webview has authorized the user.
         */
        public OnAuthorized(username: string, token: string): void {
            /* Store the token. */
            this.users[username] = token;

            /* Remove the webview from the document. */
            $('#users webview[username="' + username + '"]').remove();

            /* No webviews are open. */
            if ($('#users webview').length === 0) {
                $('#users').fadeOut();
                $('#guide').fadeIn();

                Application.Input.RegisterInputs(InputType.Guide);
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
                for (var user in this.users) {
                    users.push(user);
                }
            } else {
                users = [username];
            }

            for (var user in this.users) {
                var url = Utils.Format(Twitch.urls.followChannel,
                    user, channel, this.users[user], Twitch.scope);

                $.ajax({
                    url: url,
                    type: (unfollow === true) ? 'DELETE' : 'PUT',
                    error: this.ShowError,
                    success: () => {
                        /* Update the followed channels immediately. */
                        this.GetFollowedChannels(user);

                        /* Get the time to delay. */
                        var time = (unfollow === true) ? 5000 : 1000;

                        /* Update the followed channels after a delay. */
                        setTimeout(() => this.GetFollowedChannels(user), time);
                    }
                });
            }
        }

        /*
         * Follows the game.
         */
        public FollowGame(username: string, game: string, unfollow = false) {
            var users = [];

            if (username === 'all')
                for (var user in this.users)
                    users.push(user);
            else
                users = [username];

            for (var user in this.users) {
                var url = Utils.Format(Twitch.urls.followGame,
                    user, game, this.users[user], Twitch.scope);

                $.ajax({
                    url: url,
                    type: (unfollow === true) ? 'DELETE' : 'PUT',
                    error: this.ShowError,
                    success: () => {
                        /* Update the followed games immediately. */
                        this.GetFollowedGames(user);

                        /* Get the time to delay. */
                        var time = (unfollow === true) ? 5000 : 1000;

                        /* Update the followed games after a delay. */
                        setTimeout(() => this.GetFollowedGames(user), time);
                    }
                });
            }
        }

        /*
         * Upates all the twitch data.
         */
        public Refresh(): void {
            this.GetChannels();
            this.GetGames();

            for (var user in this.users) {
                this.GetFollowedChannels(user);
                this.GetFollowedGames(user);
            }
        }

        /*
         * Updates the top channels.
         */
        public GetChannels(getAll = false): void {
            /* Reset the top channels dictionary. */
            this.menus[MenuType.Channels] = {};

            /* Format the url for the ajax call. */
            var url = Utils.Format(Twitch.urls.channels, Twitch.limit);

            /* Ajax call to get the top channels. */
            $.ajax({
                url: url,
                error: this.ShowError,
                success: (json) => {
                    /* Process the ajax results. */
                    this.ParseChannelsObject(json.streams, MenuType.Channels);

                    /* Load the next page of results. */
                    if (getAll === true && json._total > Twitch.limit)
                        for (var offset = Twitch.limit; offset < json._total; offset += Twitch.limit)
                            this.GetNextChannels(url, offset, MenuType.Channels);
                }
            });
        }

        /*
         * Gets all of the games.
         */
        public GetGames(getAll = true): void {
            /* Reset the top games dictionary. */
            this.menus[MenuType.Games] = {};

            /* Format the url for the ajax call. */
            var url = Utils.Format(Twitch.urls.games, Twitch.limit);

            /* Ajax call to get the games. */
            $.ajax({
                url: url,
                error: this.ShowError,
                success: (json) => {
                    /* Process the ajax results. */
                    this.ParseGamesObject(json.top, MenuType.Games);

                    /* Load the next page of results. */
                    if (getAll === true && json._total > Twitch.limit)
                        for (var offset = Twitch.limit; offset < json._total; offset += Twitch.limit)
                            this.GetNextGames(url, offset, MenuType.Games);
                }
            });
        }

        /*
         * Gets the channels for a game.
         */
        public GetGameChannels(game: string, getAll = true) {
            /* Resets the game dictionary. */
            this.menus[MenuType.Game] = {};

            /* Format the url for the ajax call. */
            var url = Utils.Format(Twitch.urls.game, game, Twitch.limit);

            /* Ajax call to get the game channels. */
            $.ajax({
                url: url,
                error: this.ShowError,
                success: (json) => {
                    /* Process the ajax results. */
                    this.ParseChannelsObject(json.streams, MenuType.Game);

                    /* Load the next page of results. */
                    if (getAll === true && json._total > Twitch.limit)
                        for (var offset = Twitch.limit; offset < json._total; offset += Twitch.limit)
                            this.GetNextChannels(url, offset, MenuType.Game);
                }
            });
        }

        /*
         * Get the vidoes for a channe.
         */
        public GetChannelVideos(channel, getAll = true) {
            /* Resets the videos dictionary. */
            this.menus[MenuType.Videos] = {};

            /* Format the url for the ajax call. */
            var url = Utils.Format(Twitch.urls.videos, channel, Twitch.limit);

            /* Ajax call to get the game channels. */
            $.ajax({
                url: url,
                error: this.ShowError,
                success: (json) => {
                    /* Process the ajax results. */
                    this.ParseVideosObject(json.videos, MenuType.Videos);

                    /* Load the next page of results. */
                    if (getAll === true && json._total > Twitch.limit)
                        for (var offset = Twitch.limit; offset < json._total; offset += Twitch.limit)
                            this.GetNextVideos(url, offset, MenuType.Videos);
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
            this.followed[FollowType.Channel] = {};

            /* Format the url for the ajax call. */
            var url = Utils.Format(Twitch.urls.followedChannels, username, Twitch.limit);

            /* Ajax call to get the game channels. */
            $.ajax({
                url: url,
                error: this.ShowError,
                success: (json) => {
                    for (var index in json.follows) {
                        var channel = json.follows[index];
                        /* Add the channel to the search list. */
                        search.push(channel.channel.name);
                    }

                    /* Get the online followed channels. */
                    this.GetChannelsByName(search, MenuType.Channels);
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
            this.followed[FollowType.Game] = {}

            /* Format the url for the ajax call. */
            var url = Utils.Format(Twitch.urls.followedGames, username, Twitch.limit);

            /* Ajax call to get the games. */
            $.ajax({
                url: url,
                error: this.ShowError,
                success: (json) => {
                    for (var index in json.follows) {
                        var game = json.follows[index];
                        /* Create a new game if needed.. */
                        if (this.menus[MenuType.Games][game.name] === undefined)
                            /* Create an empty game. */
                            this.menus[MenuType.Games][game.name] = {
                                name: game.name,
                                channels: -1,
                                viewers: -1,
                                boxArt: null,
                            };
                        this.followed[FollowType.Game][game.name] = true;
                    }
                }
            });

        }

        /*
         * Gets the channels by comma delimited names.
         */
        private GetChannelsByName(channels: string[], menu: MenuType) {
            /* Format the url for the ajax call. */
            var url = Utils.Format(Twitch.urls.searchChannels, channels.join(), Twitch.limit);

            /* Ajax call to get the games. */
            $.ajax({
                url: url,
                error: this.ShowError,
                success: (json) => {
                    this.ParseChannelsObject(json.streams, menu, true);

                    /* Load the next page of results */
                    if (json._total > Twitch.limit)
                        for (var offset = Twitch.limit; offset < json._total; offset += Twitch.limit)
                            this.GetNextChannels(url, offset, menu, true);
                }
            });
        }

        /*
         * Loads the next page of channels.
         */
        private GetNextChannels(url: string, offset: number, menu: MenuType, isFollowed = false) {
            $.ajax({
                url: Utils.Format(url + '&offset={0}', offset),
                error: this.ShowError,
                success: (json) => this.ParseChannelsObject(json.streams, menu),
            });
        }

        /*
         * Loads the next page of games.
         */
        private GetNextGames(url: string, offset: number, menu: MenuType): void {
            $.ajax({
                url: Utils.Format(url + '&offset={0}', offset),
                error: this.ShowError,
                success: (json) => this.ParseGamesObject(json.top, menu),
            });
        }

        /*
         * Loads the next page of videos.
         */
        private GetNextVideos(url: string, offset: number, menu: MenuType): void {
            $.ajax({
                url: Utils.Format(url + '&offset={0}', offset),
                error: this.ShowError,
                success: (json) => this.ParseVideosObject(json.videos, menu),
            });
        }

        /*
         * Converts a json object to a channel.
         */
        private ParseChannelsObject(object, menu: MenuType, isFollowed = false): void {
            for (var key in object) {
                var data = object[key];
                /* Get the featured channel data. */
                if (data.stream !== undefined)
                    data = data.stream;

                /* Create the channel dictionary entry. */
                var channel: Channel = {
                    name: data.channel.name,
                    streamer: data.channel.display_name,
                    title: data.channel.status,
                    viewers: data.viewers,
                    game: data.game,
                    preview: data.preview.large
                }

                /* Handle followed channels. */
                if (isFollowed === true)
                    this.followed[FollowType.Channel][data.channel.name] = true;

                /* Create the dictionary entry. */
                this.menus[menu][data.channel.name] = channel;
            }
        }

        /*
         * Converts a json object to a game.
         */
        private ParseGamesObject(object, menu: MenuType, followed = false): void {
            for (var key in object) {
                var data = object[key];
                if (data.game.name !== '') {
                    /* Create the channel dictionary entry. */
                    this.menus[MenuType.Games][data.game.name] = {
                        name: data.game.name,
                        channels: data.channels || -1,
                        viewers: data.viewers || -1,
                        boxArt: data.game.box.large
                    };
                }
            }
        }

        /*
         * Converts a json object to a video.
         */
        private ParseVideosObject(object, menu: MenuType): void {
            for (var key in object) {
                var data = object[key];
                /* Create the channel dictionary entry. */
                this.menus[MenuType.Videos][data._id] = {
                    id: data._id,
                    name: data.channel.name,
                    streamer: data.channel.display_name,
                    title: data.title,
                    views: data.views,
                    length: data.length,
                    preview: (data.preview || '').replace(/320x240/, '640x360')
                };
            }
        }
    }
}
