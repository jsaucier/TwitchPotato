module TwitchPotato {
    export class TwitchHandler {
        private menus: IDictionary<any> = {};

        private onAuthorizedCallback: ITwitchUserCallback;

        /** The last game searched. */
        private _game: string;

        private _token: string;
        private _user: string;

        private _followed: { [type: number]: { [id: string]: boolean } } = {};

        constructor(user: string, token: string) {
            this._user = user;
            this._token = token;

            this.Refresh();
        }

        /** Gets whether the user is following a channel or game. */
        IsFollowing(followType: FollowType, id: string): boolean {
            if (this._followed[followType][id] === undefined) return false;

            return this._followed[followType][id] !== undefined;
        }

        /** Gets the followed information. */
        GetFollows(followType: FollowType): any {
            return this._followed[followType];
        }

        /** Gets the channel information. */
        GetChannel(key: string): IChannel {
            return this.menus[MenuType.Channels][key];
        }

        /** Gets the game information. */
        GetGame(key: string): IGame {
            return this.menus[MenuType.Games][key];
        }

        /** Gets the menu information. */
        GetMenu(menu: MenuType): any {
            return this.menus[menu];
        }

        /** Upates all the twitch data. */
        Refresh(skipFollowed = false): void {
            /** Set the guide update type. */
            Guide.SetUpdateType(UpdateType.All);

            /** Resets the followed channels dictionary. */
            this._followed[FollowType.Channel] = {};

            /** Resets the followed games dictionary. */
            this._followed[FollowType.Game] = {};

            /** Reset the top channels dictionary. */
            this.menus[MenuType.Channels] = {};

            /** Reset the top games dictionary. */
            this.menus[MenuType.Games] = {};

            if (this._game !== undefined)
                this.GetGameChannels(this._game);

            this.GetChannels();
            this.GetGames();

            this.GetFollowedChannels();
            //this.GetFollowedGames();
        }

        /** Follows or unfollows the channel or game for the user. */
        Follow(user: string, follow: string, type: FollowType, unfollow = false) {
            // /** Set the update type. */
            // Guide.SetUpdateType(UpdateType.Refresh);
            //
            // /** Array of users to follow the game. */
            // var users: IDictionary<ITwitchUser> = {};
            //
            // /** The followed games. */
            // var followed = this.followed[type];
            //
            // if (user !== 'all') {
            //     if (this.users[user] !== undefined)
            //         users[user] = this.users[user];
            // }
            // else {
            //     for (var u in this.users) {
            //         /** Only unfollow the game if the user is following the game. */
            //         if ((unfollow === true && followed[follow][u] !== undefined) ||
            //             unfollow !== true)
            //             users[u] = this.users[u];
            //     }
            // }
            //
            // for (var u in users) {
            //     var url = (type === FollowType.Channel) ?
            //         TwitchHandler.urls.followChannel : TwitchHandler.urls.followGame;
            //
            //     url = url.format(u, follow, this.users[u].token, TwitchHandler.scope);
            //
            //     $.ajax({
            //         url: url,
            //         type: (unfollow === true) ? 'DELETE' : 'PUT',
            //         error: (xhr, status, error) => this.AuthenticationError(xhr, status, error, u),
            //         success: () => {
            //             if (type === FollowType.Channel)
            //                 /** Update the followed channels after a delay. */
            //                 setTimeout(() => this.GetFollowedChannels(), 500);
            //             else
            //                 /** Update the followed channels after a delay. */
            //                 setTimeout(() => this.GetFollowedGames(u), 500);
            //         }
            //     });
            // }
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

            /** Save the game. */
            this._game = game;

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
        GetFollowedChannels(): void {
            /** Format the url for the ajax call. */
            var url = TwitchHandler.urls.followedChannels.format(this._token, TwitchHandler.limit);

            /** Ajax call to get the game channels. */
            $.ajax({
                url: url,
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (json) => {
                    this.ParseChannelsObject(json.streams, MenuType.Channels, true)
                }
            });
        }

        /** Get the followed games for the Twitch user. */
        GetFollowedGames(user: string) {
            // /** Array of channels to search because they aren't known at this point. */
            // var search: string[] = [];
            //
            // /** Format the url for the ajax call. */
            // var url = TwitchHandler.urls.followedGames.format(user, TwitchHandler.limit);
            //
            // /** Ajax call to get the games. */
            // $.ajax({
            //     url: url,
            //     error: (xhr, status, error) => this.ShowError(xhr, status, error),
            //     success: (json) => {
            //         for (var index in json.follows) {
            //             var game = json.follows[index];
            //             /** Create a new game if needed.. */
            //             if (this.menus[MenuType.Games][game.name] === undefined)
            //                 /** Create an empty game. */
            //                 this.menus[MenuType.Games][game.name] = {
            //                     name: game.name,
            //                     channels: -1,
            //                     viewers: -1,
            //                     boxArt: null,
            //                 };
            //
            //             /** Handle followed games. */
            //             var followed = this.followed[FollowType.Game];
            //
            //             if (followed[game.name] === undefined)
            //                 followed[game.name] = {};
            //
            //             followed[game.name][user] = true;
            //         }
            //     }
            // });
        }

        /** Fired when an error is encountered. */
        private ShowError(xhr, status, error) {
            /** Response object. */
            var json = xhr.responseJSON;

            /** Show the error. */
            App.ShowMessage('{0} - {1}: {2}'.format(json.status, json.error, json.message));
        }

        /** Fired when an authentication error is encountered. */
        private AuthenticationError(xhr: XMLHttpRequest, status, error, user) {
            /** Clear the partition data and reauthorize the user. */
            // if (xhr.status === 401 ||
            //     xhr.status === 403)
            //     this.ClearPartitions(user, () => this.Authorize(user));

            /** Show the error. */
            this.ShowError(xhr, status, error);
        }

        /** Gets the channels by comma delimited names. */
        // private GetChannelsByName(channels: string[], menu: MenuType, username: string): void {
        //     /** Format the url for the ajax call. */
        //     var url = TwitchHandler.urls.searchChannels.format(channels.join(), TwitchHandler.limit);
        //
        //     /** Ajax call to get the games. */
        //     $.ajax({
        //         url: url,
        //         error: (xhr, status, error) => this.ShowError(xhr, status, error),
        //         success: (json) => {
        //             this.ParseChannelsObject(json.streams, menu, username);
        //
        //             /** Load the next page of results */
        //             if (json._total > TwitchHandler.limit)
        //                 for (var offset = TwitchHandler.limit; offset < json._total; offset += TwitchHandler.limit)
        //                     this.GetNextChannels(url, offset, menu, username);
        //         }
        //     });
        // }

        /** Loads the next page of channels. */
        private GetNextChannels(url: string, offset: number, menu: MenuType, followed = false) {
            $.ajax({
                url: url + '&offset={0}'.format(offset),
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (json) => this.ParseChannelsObject(json.streams, menu, followed),
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
        private ParseChannelsObject(object, menu: MenuType, followed = false): void {
            for (var key in object) {
                var data = object[key];
                /** Get the featured channel data. */
                if (data.stream !== undefined)
                    data = data.stream;

                /** Create the channel dictionary entry. */
                var channel: IChannel = {
                    name: data.channel.name,
                    streamer: data.channel.display_name,
                    title: data.channel.status || '',
                    viewers: data.viewers,
                    game: data.game || '',
                    preview: data.preview.large
                }

                /** Handle followed channels. */
                if (followed)
                    this._followed[FollowType.Channel][data.channel.name] = true;

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
        /* ----------------------- STATIC PROPERTIES------------------------- */
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
            followedChannels: 'https://api.twitch.tv/kraken/streams/followed?oauth_token={0}&limit={1}',//'https://api.twitch.tv/kraken/users/{0}/follows/channels?limit={1}',
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
