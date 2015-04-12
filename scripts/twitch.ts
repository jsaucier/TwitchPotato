module TwitchPotato {
    export class TwitchHandler {
        private users: Dictionary<TwitchUser> = {};
        private menus: Dictionary<any> = {};
        private followed: Dictionary<Dictionary<Dictionary<boolean>>> = {};
        private onAuthorizedCallback: TwitchUserCallback;

        constructor() {
            window.addEventListener('message', (event) => {
                /** Parse the json message. */
                var json = JSON.parse(event.data);

                /** Call the method based on the message. */
                this['On' + json.method].apply(this, json.args);
            });

            /** Default the followed dictionaries. */
            this.followed[FollowType.Channel] = {};
            this.followed[FollowType.Game] = {};
        }


        /* ------------------------------------------------------------------ */
        /* ----------------------- PUBLIC FUNCTIONS ------------------------- */
        /* ------------------------------------------------------------------ */


        /** Gets whether the user is following a channel or game. */
        IsFollowing(followType: FollowType, key: string, user = ''): boolean {
            if (this.followed[followType][key] === undefined) return false;

            if (user !== '')
                return this.followed[followType][key] === undefined;
            else
                return this.followed[followType][key][user] === undefined;
        }

        /** Gets the followed information. */
        GetFollows(followType: FollowType): any {
            return this.followed[followType];
        }

        /** Gets the channel information. */
        GetChannel(key: string): Channel {
            return this.menus[MenuType.Channels][key];
        }

        /** Gets the game information. */
        GetGame(key: string): Game {
            return this.menus[MenuType.Games][key];
        }

        /** Gets the menu information. */
        GetMenu(menu: MenuType): any {
            return this.menus[menu];
        }

        /** Gets the users information. */
        GetUsers(): string[] {
            var users: string[] = [];

            for (var user in this.users)
                users.push(user);

            return users.sort();
        }

        /** Gets the users following the item. */
        GetFollowing(followType: FollowType, key: string): string[] {
            if (this.followed[followType][key] === undefined) return [];

            var users: string[] = [];

            for (var user in this.followed[followType][key])
                users.push(user);

            return users.sort();
        }

        /** Gets the user's display name. */
        GetDisplayName(user: string): string {
            if (this.users[user] === undefined) return user;

            return this.users[user].name;
        }

        /** Gets the user's twitch account information. */
        GetTwitchUser(user: string, callback?: TwitchUserCallback): void {
            $.ajax({
                url: TwitchHandler.urls.user.format(user),
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                global: false,
                success: (json) => {
                    /** Create a new twitch user. */
                    this.users[user] = {
                        id: user,
                        name: json.display_name,
                        token: undefined
                    };

                    if (typeof (callback) === 'function')
                        /** Fire the callback. */
                        callback(this.users[user]);
                }
            });
        }

        /** Login the user. */
        Login(user: string): void {
            /** Create a temporary user. */
            this.users[user] = {
                id: user,
                name: user,
                token: undefined
            }

            /** Authorize the user. */
            this.Authorize(user);
        }

        /** Creates a new webview to authorize and retrieve the oauth code. */
        Authorize(user: string, callback?: TwitchUserCallback): void {
            /** Set the callback. */
            this.onAuthorizedCallback = callback;

            /** Get the webview for the user. */
            var webview = this.GetWebview(user, true, (webview) => {
                console.log('init');
                this.InitializeWebView(user);
            });

            /** Register an event for when the webview has finished loading. */
            // webview.addEventListener('did-start-loading', () =>
            //     this.InitializeWebView(user));

            /** Hook the console message event. */
            webview.addEventListener('console-message', (e) =>
                ConsoleMessage(e));
        }

        /** Removes and clears all of the partition data. */
        ClearPartitions(username = undefined, callback?: TwitchUserCallback) {
            /** String array containing the users' partition to clear. */
            var users = this.users;

            if (username !== undefined) {
                users = {};
                users[username] = username;
            }

            /** Get or create the webview for the users. */
            for (var user in users)
                this.GetWebview(user, true, (webview) =>
                    this.ClearData(user, webview, callback));
        }

        /** Upates all the twitch data. */
        Refresh(skipFollowed = false): void {
            /** Set the guide update type. */
            Application.Guide.SetUpdateType(UpdateType.All);

            /** Resets the followed channels dictionary. */
            this.followed[FollowType.Channel] = {};

            /** Resets the followed games dictionary. */
            this.followed[FollowType.Game] = {};

            /** Reset the top channels dictionary. */
            this.menus[MenuType.Channels] = {};

            /** Reset the top games dictionary. */
            this.menus[MenuType.Games] = {};

            this.GetChannels();
            this.GetGames();

            if (skipFollowed === false) {
                for (var user in this.users) {
                    this.GetFollowedChannels(user);
                    this.GetFollowedGames(user);
                }
            }
        }

        /** Follows or unfollows the channel or game for the user. */
        Follow(user: string, follow: string, type: FollowType, unfollow = false) {
            /** Set the update type. */
            Application.Guide.SetUpdateType(UpdateType.Refresh);

            /** Array of users to follow the game. */
            var users: Dictionary<TwitchUser> = {};

            /** The followed games. */
            var followed = this.followed[type];

            if (user !== 'all') {
                if (this.users[user] !== undefined)
                    users[user] = this.users[user];
            }
            else {
                for (var u in this.users) {
                    /** Only unfollow the game if the user is following the game. */
                    if ((unfollow === true && followed[follow][user] !== undefined) ||
                        unfollow !== true)
                        users[user] = this.users[user];
                }
            }

            for (var u in users) {
                var url = (type === FollowType.Channel) ?
                    TwitchHandler.urls.followChannel : TwitchHandler.urls.followGame;

                url = url.format(u, follow, this.users[u].token, TwitchHandler.scope);

                $.ajax({
                    url: url,
                    type: (unfollow === true) ? 'DELETE' : 'PUT',
                    error: (xhr, status, error) => this.AuthenticationError(xhr, status, error, user),
                    success: () => {
                        if (type === FollowType.Channel)
                            /** Update the followed channels after a delay. */
                            setTimeout(() => this.GetFollowedChannels(user), 500);
                        else
                            /** Update the followed channels after a delay. */
                            setTimeout(() => this.GetFollowedGames(user), 500);
                    }
                });
            }
        }

        /** Updates the top channels. */
        GetChannels(getAll = false): void {
            /** Format the url for the ajax call. */
            var url = TwitchHandler.urls.channels.format(TwitchHandler.limit);

            /** Ajax call to get the top channels. */
            $.ajax({
                url: url,
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (json) => {
                    /** Process the ajax results. */
                    this.ParseChannelsObject(json.streams, MenuType.Channels);

                    /** Load the next page of results. */
                    if (getAll === true && json._total > TwitchHandler.limit)
                        for (var offset = TwitchHandler.limit; offset < json._total; offset += TwitchHandler.limit)
                            this.GetNextChannels(url, offset, MenuType.Channels);
                }
            });
        }

        /** Gets all of the games. */
        GetGames(getAll = true): void {
            /** Format the url for the ajax call. */
            var url = TwitchHandler.urls.games.format(TwitchHandler.limit);

            /** Ajax call to get the games. */
            $.ajax({
                url: url,
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (json) => {
                    /** Process the ajax results. */
                    this.ParseGamesObject(json.top, MenuType.Games);

                    /** Load the next page of results. */
                    if (getAll === true && json._total > TwitchHandler.limit)
                        for (var offset = TwitchHandler.limit; offset < json._total; offset += TwitchHandler.limit)
                            this.GetNextGames(url, offset, MenuType.Games);
                }
            });
        }

        /** Gets the channels for a game. */
        GetGameChannels(game: string, getAll = true) {
            /** Resets the game dictionary. */
            this.menus[MenuType.Game] = {};

            /** Format the url for the ajax call. */
            var url = TwitchHandler.urls.game.format(game, TwitchHandler.limit);

            /** Ajax call to get the game channels. */
            $.ajax({
                url: url,
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (json) => {
                    /** Process the ajax results. */
                    this.ParseChannelsObject(json.streams, MenuType.Game);

                    /** Load the next page of results. */
                    if (getAll === true && json._total > TwitchHandler.limit)
                        for (var offset = TwitchHandler.limit; offset < json._total; offset += TwitchHandler.limit)
                            this.GetNextChannels(url, offset, MenuType.Game);
                }
            });
        }

        /** Get the vidoes for a channe. */
        GetChannelVideos(channel, getAll = true) {
            /** Resets the videos dictionary. */
            this.menus[MenuType.Videos] = {};

            /** Format the url for the ajax call. */
            var url = TwitchHandler.urls.videos.format(channel, TwitchHandler.limit);

            /** Ajax call to get the game channels. */
            $.ajax({
                url: url,
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (json) => {
                    /** Process the ajax results. */
                    this.ParseVideosObject(json.videos, MenuType.Videos);

                    /** Load the next page of results. */
                    if (getAll === true && json._total > TwitchHandler.limit)
                        for (var offset = TwitchHandler.limit; offset < json._total; offset += TwitchHandler.limit)
                            this.GetNextVideos(url, offset, MenuType.Videos);
                }
            });
        }

        /** Get the followed channels for the Twitch user. */
        GetFollowedChannels(user: string): void {
            /** Array of channels to search because they aren't known at this point. */
            var search: string[] = [];

            /** Format the url for the ajax call. */
            var url = TwitchHandler.urls.followedChannels.format(user, TwitchHandler.limit);

            /** Ajax call to get the game channels. */
            $.ajax({
                url: url,
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (json) => {
                    for (var index in json.follows) {
                        var channel = json.follows[index];
                        /** Add the channel to the search list. */
                        search.push(channel.channel.name);
                    }

                    /** Get the online followed channels. */
                    this.GetChannelsByName(search, MenuType.Channels, user);
                }
            });
        }

        /** Get the followed games for the Twitch user. */
        GetFollowedGames(user: string) {
            /** Array of channels to search because they aren't known at this point. */
            var search: string[] = [];

            /** Format the url for the ajax call. */
            var url = TwitchHandler.urls.followedGames.format(user, TwitchHandler.limit);

            /** Ajax call to get the games. */
            $.ajax({
                url: url,
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (json) => {
                    for (var index in json.follows) {
                        var game = json.follows[index];
                        /** Create a new game if needed.. */
                        if (this.menus[MenuType.Games][game.name] === undefined)
                            /** Create an empty game. */
                            this.menus[MenuType.Games][game.name] = {
                                name: game.name,
                                channels: -1,
                                viewers: -1,
                                boxArt: null,
                            };

                        /** Handle followed games. */
                        var followed = this.followed[FollowType.Game];

                        if (followed[game.name] === undefined)
                            followed[game.name] = {};

                        followed[game.name][user] = true;
                    }
                }
            });
        }


        /* ------------------------------------------------------------------ */
        /* ----------------------- Private FUNCTIONS ------------------------ */
        /* ------------------------------------------------------------------ */


        /** Gets the webview for the user. */
        private GetWebview(user: string, create: boolean, callback?: WebviewCallback): Webview {
            /** The webview for the user. */
            var webview = <Webview>$('#users webview[username="{0}"]'.format(user))[0]

            /** Create the webview if requested */
            if (webview === undefined && create === true) {
                /** Load the webview template */
                var html = $('#twitch-template').html().format(user);

                /** Add the webview to the document. */
                $('#users').append(html);
                $('#users').show();

                /** Get the newly created webview for the user. */
                webview = <Webview>$('#users webview[username="{0}"]'.format(user))[0];
                console.log(webview);
                // webview.reload();

                /** Content loaded event listener. */
                webview.addEventListener('did-start-loading', () => {
                    console.log('asd');
                    if (typeof (callback) === 'function')
                        /** Fire the callback. */
                        callback(webview);
                });
            }
            else {
                if (typeof (callback) === 'function')
                    /** Fire the callback. */
                    callback(webview);
            }
            return webview;
        }

        /** Removes the webview for the user. */
        private RemoveWebview(user: string): void {
            /** Remove the webview from the document. */
            $('#users webview[username="' + user + '"]').remove();
        }

        /** Clears the stored data for the webview's partition. */
        private ClearData(user: string, webview: Webview, callback?: TwitchUserCallback): void {
            /** The data types to clear. */
            var clearTypes = {
                appcache: true,
                cookies: true,
                fileSystems: true,
                indexedDB: true,
                localStorage: true,
                webSQL: true
            };

            /** Clear the partition data. */
            webview.clearData(
                { since: 0 },
                clearTypes, () => {
                    /** Remove the webview. */
                    $(webview).remove();

                    if (typeof (callback) === 'function')
                        /** Fire the callback. */
                        callback(this.users[user]);

                    /** Delete the user from the dictionary. */
                    delete this.users[user];
                });
        }

        /** Initializes the webview and loads the remote url to handle the oauth redirect. */
        private InitializeWebView(user): void {
            /** Hide all of the webviews. */
            $('#users webview').hide();

            this.GetWebview(user, true, (webview) => {
                if ($(webview).attr('src').indexOf('https://api.twitch.tv/kraken/oauth2/') === 0) {
                    /** Set the title head. */
                    $('#users .head').text('Enter the login for {0} | Press ESC to Cancel'.format(this.users[user].name));

                    /** Show the webview. */
                    $(webview).show();
                    $('#users').fadeIn();

                    /** Hide the loading window. */
                    Application.Loading(false);

                    /** Register the global inputs. */
                    Application.Input.RegisterInputs(InputType.Global);

                    /** Insert the script and execute the code. */
                    webview.focus();
                    webview.executeScript({ file: 'js/jquery-2.1.1.min.js' });
                    webview.executeScript({ code: '$("#login").val("{0}")'.format(user) });
                    webview.executeScript({ code: '$("#password").focus();' });
                } else {
                    /** Data to post. */
                    var data = {
                        method: 'Init',
                        args: [user, TwitchHandler.clientId, TwitchHandler.scope]
                    };

                    /** Post the data to the remote webview. */
                    //webview.contentWindow.postMessage(JSON.stringify(data), '*');
                    //webview.send('Init', user, TwitchHandler.clientId, TwitchHandler.scope);
                    //webview.executeScript('window.potato.onInit', user, TwitchHandler.clientId, TwitchHandler.scope);
                }
            });
        }

        /** Callback function when the remote webview has authorized the user. */
        private OnAuthorized(user: string, token: string): void {
            /** Remove the webview. */
            this.RemoveWebview(user);

            /** No webviews are open. */
            if ($('#users webview').length === 0) {
                $('#users').fadeOut();
                $('#guide').fadeIn();

                Application.Input.RegisterInputs(InputType.Guide);
            }

            /** Fire the callback. */
            if (typeof (this.onAuthorizedCallback) === 'function')
                this.onAuthorizedCallback(this.users[user]);
        }

        /** Fired when an error is encountered. */
        private ShowError(xhr, status, error) {
            /** Response object. */
            var json = xhr.responseJSON;

            /** Show the error. */
            Application.ShowError('{0} - {1}: {2}'.format(json.status, json.error, json.message));
        }

        /** Fired when an authentication error is encountered. */
        private AuthenticationError(xhr: XMLHttpRequest, status, error, user) {
            /** Clear the partition data and reauthorize the user. */
            if (xhr.status === 401 ||
                xhr.status === 403)
                this.ClearPartitions(user, () => this.Authorize(user));

            /** Show the error. */
            this.ShowError(xhr, status, error);
        }

        /** Gets the channels by comma delimited names. */
        private GetChannelsByName(channels: string[], menu: MenuType, username: string): void {
            /** Format the url for the ajax call. */
            var url = TwitchHandler.urls.searchChannels.format(channels.join(), TwitchHandler.limit);

            /** Ajax call to get the games. */
            $.ajax({
                url: url,
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (json) => {
                    this.ParseChannelsObject(json.streams, menu, username);

                    /** Load the next page of results */
                    if (json._total > TwitchHandler.limit)
                        for (var offset = TwitchHandler.limit; offset < json._total; offset += TwitchHandler.limit)
                            this.GetNextChannels(url, offset, menu, username);
                }
            });
        }

        /** Loads the next page of channels. */
        private GetNextChannels(url: string, offset: number, menu: MenuType, username?: string) {
            $.ajax({
                url: url + '&offset={0}'.format(offset),
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (json) => this.ParseChannelsObject(json.streams, menu, username),
            });
        }

        /** Loads the next page of games. */
        private GetNextGames(url: string, offset: number, menu: MenuType): void {
            $.ajax({
                url: url + '&offset={0}'.format(offset),
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (json) => this.ParseGamesObject(json.top, menu),
            });
        }

        /** Loads the next page of videos. */
        private GetNextVideos(url: string, offset: number, menu: MenuType): void {
            $.ajax({
                url: url + '&offset={0}'.format(offset),
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (json) => this.ParseVideosObject(json.videos, menu),
            });
        }

        /** Converts a json object to a channel. */
        private ParseChannelsObject(object, menu: MenuType, username?: string): void {
            for (var key in object) {
                var data = object[key];
                /** Get the featured channel data. */
                if (data.stream !== undefined)
                    data = data.stream;

                /** Create the channel dictionary entry. */
                var channel: Channel = {
                    name: data.channel.name,
                    streamer: data.channel.display_name,
                    title: data.channel.status || '',
                    viewers: data.viewers,
                    game: data.game || '',
                    preview: data.preview.large
                }

                        /** Handle followed channels. */
                        if (username !== undefined) {
                    var followed = this.followed[FollowType.Channel]

                            if (followed[data.channel.name] === undefined)
                        followed[data.channel.name] = {};

                    followed[data.channel.name][username] = true;
                }

                /** Create the dictionary entry. */
                this.menus[menu][data.channel.name] = channel;
            }
        }

        /** Converts a json object to a game.*/
        private ParseGamesObject(object, menu: MenuType, followed = false): void {
            for (var key in object) {
                var data = object[key];
                if (data.game.name !== '') {
                    /** Create the channel dictionary entry. */
                    this.menus[MenuType.Games][data.game.name] = {
                        name: data.game.name,
                        channels: data.channels || -1,
                        viewers: data.viewers || -1,
                        boxArt: data.game.box.large
                    };
                }
            }
        }

        /** Converts a json object to a video. */
        private ParseVideosObject(object, menu: MenuType): void {
            for (var key in object) {
                var data = object[key];
                /** Create the channel dictionary entry. */
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


        /* ------------------------------------------------------------------ */
        /* ------------------------ STATIC MEMBERS -------------------------- */
        /* ------------------------------------------------------------------ */


        /** Twitch Application Client Id */
        static clientId = '60wzh4fjbowe6jwtofuc1jakjfgekry';
        /** Twitch Application Scope */
        static scope = 'user_read+user_follows_edit';
        /** Twitch API item limits. */
        static limit = 100;
        /** Twitch API urls. */
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
            searchGame: 'https://api.twitch.tv/kraken/search/games?q={0}&type=suggest&limit={1}',
            user: 'https://api.twitch.tv/kraken/users/{0}'
        }
    }
}
