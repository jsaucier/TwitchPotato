module TwitchPotato {

    export class TwitchHandler {

        private _limit = 100;
        private _lastSearch: string;

        private _token: string;
        private _user: string;

        private _followed: { [type: number]: { [id: string]: boolean } } = {};

        private _channels: TwitchChannels = {};
        private _games: TwitchGames = {};
        private _videos: TwitchVideos = {};
        private _search: TwitchChannels = {};

        constructor(user: string, token: string) {
            this._user = user;
            this._token = token;

            this.Refresh();
        }

        /** Gets whether the user is following a channel or game. */
        IsFollowing(followType: FollowType, id: string): boolean {
            return this._followed[followType][id] !== undefined;
        }

        /** Gets the followed information. */
        GetFollows(followType: FollowType): any { return this._followed[followType]; }

        /** Gets the channel information. */
        GetChannel(channel: string): TwitchChannel { return this._channels[channel]; }

        /** Gets the game information. */
        GetGame(game: string): TwitchGame { return this._games[game]; }

        /** Gets the menu information. */
        GetMenuItems(menu: MenuType): any {
            if (menu === MenuType.Channels) return this._channels;
            if (menu === MenuType.Games) return this._games;
            if (menu === MenuType.Game) return this._search;
            if (menu === MenuType.Videos) return this._videos;
        }

        GetChannels(): TwitchChannels { return this._channels; }
        GetGames(): TwitchGames { return this._games; }
        GetVideos(): TwitchVideos { return this._videos; }
        GetSearch(): TwitchChannels { return this._search; }

        /** Upates all the twitch data. */
        Refresh(skipFollowed = false): void {

            App.Guide.SetUpdateType(UpdateType.All);

            this._followed[FollowType.Channel] = {};
            this._followed[FollowType.Game] = {};

            this._channels = {};
            this._games = {};

            if (this._lastSearch !== undefined)
                this._search = {};

            this.RefreshChannels();
            this.RefreshGames();

            this.RefreshFollowedChannels();
            this.RefreshFollowedGames();
        }

        /** Determines if the channel is partnered. */
        IsPartnered(channel: string, callback: (isPartnered: boolean) => void): void {
            $.ajax({
                url: 'https://api.twitch.tv/kraken/channels/{0}'.format(channel),
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (data) => callback(data.partner),
            })
        }

        /** Follows or unfollows the channel or game for the user. */
        Follow(name: string, type: FollowType, unfollow = false) {

            App.Guide.SetUpdateType(UpdateType.Refresh);

            var url = (type === FollowType.Channel) ?
                'https://api.twitch.tv/kraken/users/{0}/follows/channels/{1}?oauth_token={2}&scope=user_read+user_follows_edit' :
                'https://api.twitch.tv/api/users/{0}/follows/games/{1}?oauth_token={2}&scope=user_read+user_follows_edit';

            url = url.format(this._user, name, this._token);

            $.ajax({
                url: url,
                type: (unfollow === true) ? 'DELETE' : 'PUT',
                error: (xhr, status, error) => this.AuthenticationError(xhr, status, error),
                success: () => {
                    if (type === FollowType.Channel)
                        setTimeout(() => this.RefreshFollowedChannels(), 500);
                    else
                        setTimeout(() => this.RefreshFollowedGames(), 500);
                }
            });
        }

        /** Updates the top channels. */
        RefreshChannels(getAll = false): void {

            var url = 'https://api.twitch.tv/kraken/streams?limit={0}'.format(this._limit);

            $.ajax({
                url: url,
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (json) => {

                    this.ParseChannelItems(json.streams, this._channels);

                    if (getAll === true && json._total > this._limit)
                        for (var offset = this._limit; offset < json._total; offset += this._limit)
                            this.GetNextChannels(url, offset, this._channels);
                }
            });
        }

        /** Gets all of the games. */
        RefreshGames(getAll = true): void {

            var url = 'https://api.twitch.tv/kraken/games/top?limit={0}'.format(this._limit);

            $.ajax({
                url: url,
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (json) => {

                    this.ParseGameItems(json.top);

                    if (getAll === true && json._total > this._limit)
                        for (var offset = this._limit; offset < json._total; offset += this._limit)
                            this.GetNextGames(url, offset);
                }
            });
        }

        /** Gets the channels for a game. */
        RefreshGameChannels(searchGame: string, getAll = true) {

            this._search = {};

            this._lastSearch = searchGame;

            var url = 'https://api.twitch.tv/kraken/streams?game={0}&limit={1}'.format(searchGame, this._limit);

            /** Ajax call to get the game channels. */
            $.ajax({
                url: url,
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (json) => {

                    this.ParseChannelItems(json.streams, this._search);

                    if (getAll === true && json._total > this._limit)
                        for (var offset = this._limit; offset < json._total; offset += this._limit)
                            this.GetNextChannels(url, offset, this._search);
                }
            });
        }

        /** Get the vidoes for a channe. */
        RefreshChannelVideos(channel, getAll = true) {

            this._videos = {};

            /** Format the url for the ajax call. */
            var url = 'https://api.twitch.tv/kraken/channels/{0}/videos?&limit={1}'.format(channel, this._limit);

            /** Ajax call to get the game channels. */
            $.ajax({
                url: url,
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (json) => {
                    /** Process the ajax results. */
                    this.ParseVideosObject(json.videos);

                    /** Load the next page of results. */
                    if (getAll === true && json._total > this._limit)
                        for (var offset = this._limit; offset < json._total; offset += this._limit)
                            this.GetNextVideos(url, offset);
                }
            });
        }

        /** Get the followed channels for the Twitch user. */
        RefreshFollowedChannels(): void {

            var url = 'https://api.twitch.tv/kraken/streams/followed?oauth_token={0}'.format(this._token);

            $.ajax({
                url: url,
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (json) => {
                    this.ParseChannelItems(json.streams, this._channels, true)
                }
            });
        }

        /** Get the followed games for the Twitch user. */
        RefreshFollowedGames(): void {

            var url = 'https://api.twitch.tv/api/users/{0}/follows/games?limit={1}'.format(this._user, this._limit);

            $.ajax({
                url: url,
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (json) => {

                    for (var index in json.follows) {

                        var game = json.follows[index];

                        if (this._games[game.name] === undefined)

                            this._games[game.name] = {
                                name: game.name,
                                channels: -1,
                                viewers: -1,
                                boxArt: null,
                            };

                        this._followed[FollowType.Game][game.name] = true;
                    }
                }
            });
        }

        /** Fired when an error is encountered. */
        private ShowError(xhr, status, error) {

            var json = xhr.responseJSON;

            if (json === undefined)
                App.ShowMessage('{0} - {1}'.format(xhr.status, xhr.statusText));
            else
                App.ShowMessage('{0} - {1}: {2}'.format(json.status, json.error, json.message));
        }

        /** Fired when an authentication error is encountered. */
        private AuthenticationError(xhr: XMLHttpRequest, status, error) {
            /** Clear the partition data and reauthorize the user. */
            // if (xhr.status === 401 ||
            //     xhr.status === 403)
            //     this.ClearPartitions(user, () => this.Authorize(user));

            /** Show the error. */
            this.ShowError(xhr, status, error);
        }

        /** Loads the next page of channels. */
        private GetNextChannels(url: string, offset: number, items: TwitchChannels, followed = false) {

            $.ajax({
                url: url + '&offset={0}'.format(offset),
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (json) => this.ParseChannelItems(json.streams, items, followed),
            });
        }

        /** Loads the next page of games. */
        private GetNextGames(url: string, offset: number): void {

            $.ajax({
                url: url + '&offset={0}'.format(offset),
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (json) => this.ParseGameItems(json.top),
            });
        }

        /** Loads the next page of videos. */
        private GetNextVideos(url: string, offset: number): void {

            $.ajax({
                url: url + '&offset={0}'.format(offset),
                error: (xhr, status, error) => this.ShowError(xhr, status, error),
                success: (json) => this.ParseVideosObject(json.videos),
            });
        }

        /** Converts a json object to a channel. */
        private ParseChannelItems(object, items: TwitchChannels, followed = false): void {

            for (var key in object) {

                var data = object[key];

                if (data.stream !== undefined) data = data.stream;

                items[data.channel.name] = {
                    name: data.channel.name,
                    streamer: data.channel.display_name,
                    title: data.channel.status || '',
                    viewers: data.viewers,
                    game: data.game || '',
                    preview: data.preview.large
                }

                if (followed)
                    this._followed[FollowType.Channel][data.channel.name] = true;
            }
        }

        /** Converts a json object to a game.*/
        private ParseGameItems(object): void {

            for (var key in object) {

                var data = object[key];

                if (data.game.name !== '') {
                    /** Create the channel dictionary entry. */
                    this._games[data.game.name] = {
                        name: data.game.name,
                        channels: data.channels || -1,
                        viewers: data.viewers || -1,
                        boxArt: data.game.box.large
                    };
                }
            }
        }

        /** Converts a json object to a video. */
        private ParseVideosObject(object): void {

            for (var key in object) {

                var data = object[key];

                this._videos[data._id] = {
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

        /** Twitch API item limits. */
        // static limit = 100;
        /** Twitch API urls. */
        // static urls = {
        //     followChannel: ,
        //     followGame: '',
        //     followedChannels: '',//'https://api.twitch.tv/kraken/users/{0}/follows/channels?limit={1}',
        //     followedGames: '',
        //     game: ,
        //     videos: ,
        //     searchChannels: 'https://api.twitch.tv/kraken/streams?channel={0}&limit={1}',
        //     searchGame: 'https://api.twitch.tv/kraken/search/games?q={0}&type=suggest&limit={1}',
        //     user: 'https://api.twitch.tv/kraken/users/{0}'
        // }
    }

    export interface TwitchChannel {
        name: string;
        streamer: string;
        title: string;
        viewers: number;
        game: string;
        preview: string;
    }

    export interface TwitchGame {
        name: string;
        channels: number;
        viewers: number;
        boxArt: string;
    }

    export interface TwitchVideo {
        id: string;
        name: string;
        streamer: string;
        title: string;
        views: number;
        length: number;
        preview: string;
    }

    export interface TwitchChannels {
        [channel: string]: TwitchChannel
    }

    export interface TwitchGames {
        [game: string]: TwitchGame;
    }

    export interface TwitchVideos {
        [video: string]: TwitchVideo;
    }
}
