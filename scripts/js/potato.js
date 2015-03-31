var TwitchPotato;
(function (TwitchPotato) {
    "use strict";
    var Guide = (function () {
        function Guide() {
            this.Initialize();
        }
        Guide.prototype.Initialize = function () {
            $('#time .version').text(TwitchPotato.Utils.Format('v{0}', chrome.runtime.getManifest().version));
        };
        Guide.prototype.LoadInputs = function () {
            TwitchPotato.Application.Input.RegisterInputs(TwitchPotato.InputType.Guide);
        };
        Guide.prototype.OnInput = function (input) {
        };
        return Guide;
    })();
    TwitchPotato.Guide = Guide;
})(TwitchPotato || (TwitchPotato = {}));
var TwitchPotato;
(function (TwitchPotato) {
    "use strict";
    (function (InputType) {
        InputType[InputType["Global"] = 0] = "Global";
        InputType[InputType["Guide"] = 1] = "Guide";
        InputType[InputType["Player"] = 2] = "Player";
    })(TwitchPotato.InputType || (TwitchPotato.InputType = {}));
    var InputType = TwitchPotato.InputType;
    var Input = (function () {
        function Input() {
            var _this = this;
            this.registered = {};
            this.inputs = {};
            this.AddInput(InputType.Global, 'globalExit', 27, 'Exit');
            this.AddInput(InputType.Global, 'globalGuideToggle', 71, 'Toggle Guide');
            this.AddInput(InputType.Global, 'globalZoomIn', 187, 'Zoom In');
            this.AddInput(InputType.Global, 'globalZoomOut', 189, 'Zoom Out');
            this.AddInput(InputType.Global, 'globalZoomReset', 48, 'Zoom Reset');
            this.AddInput(InputType.Global, 'globalSaveSetting', 13, 'Save Setting');
            this.AddInput(InputType.Guide, 'guideUp', 38, 'Scroll Up');
            this.AddInput(InputType.Guide, 'guideDown', 40, 'Scroll Down');
            this.AddInput(InputType.Guide, 'guideLeft', 37, 'Move Up');
            this.AddInput(InputType.Guide, 'guideRight', 39, 'Move Down');
            this.AddInput(InputType.Guide, 'guidePageUp', 33, 'Jump Up');
            this.AddInput(InputType.Guide, 'guidePageDown', 33, 'Jump Down');
            this.AddInput(InputType.Guide, 'guideSelect', 13, 'Select Item');
            this.AddInput(InputType.Guide, 'guideRefresh', 82, 'Refresh Guide');
            this.AddInput(InputType.Guide, 'guideMenu', 80, 'Guide Menu');
            this.AddInput(InputType.Player, 'playerUp', 38, 'Previous Playing');
            this.AddInput(InputType.Player, 'playerDown', 40, 'Next Playing');
            this.AddInput(InputType.Player, 'playerStop', 83, 'Stop Player');
            this.AddInput(InputType.Player, 'playerPause', 32, 'Pause Player');
            this.AddInput(InputType.Player, 'playerMute', 77, 'Mute Volume');
            this.AddInput(InputType.Player, 'playerFlashback', 70, 'Previous Channel');
            this.AddInput(InputType.Player, 'playerSelect', 13, 'Select Channel');
            this.AddInput(InputType.Player, 'playerLayout', 72, 'Change Layout');
            this.AddInput(InputType.Player, 'playerFullscreenToggle', 85, 'Toggle Fullscreen');
            this.AddInput(InputType.Player, 'playerFullscreenEnter', 79, 'Enter Fullscreen');
            this.AddInput(InputType.Player, 'playerFullscreenExit', 73, 'Exit Fullscreen');
            $(document).keydown(function (event) {
                _this.OnInputEvent(event);
            });
        }
        Input.prototype.AddInput = function (type, id, code, name, desc) {
            if (desc === void 0) { desc = ''; }
            this.inputs[id] = {
                id: id,
                type: type,
                code: code,
                name: name,
                desc: desc
            };
        };
        Input.prototype.GetInputsByType = function (type) {
            var inputs = {};
            $.each(this.inputs, function (id, input) {
                if (input.type === type) {
                    inputs[id] = input;
                }
            });
            return inputs;
        };
        Input.prototype.RegisterInput = function (id) {
            var input = this.inputs[id];
            if (this.registered[input.code] === undefined)
                this.registered[input.code] = [];
            this.registered[input.code].push(input);
        };
        Input.prototype.RegisterInputs = function (type) {
            this.registered = {};
            for (var id in this.GetInputsByType(InputType.Global))
                this.RegisterInput(id);
            if (type !== InputType.Global)
                for (var id in this.GetInputsByType(type))
                    this.RegisterInput(id);
        };
        Input.prototype.OnInputEvent = function (event) {
            if (this.registered[event.keyCode] !== undefined) {
                $.each(this.registered[event.keyCode], function (index, input) {
                    var context = (input.type === InputType.Global) ? TwitchPotato.Application : TwitchPotato.Application[InputType[input.type]];
                    context['OnInput'].call(context, input);
                });
            }
        };
        return Input;
    })();
    TwitchPotato.Input = Input;
})(TwitchPotato || (TwitchPotato = {}));
var TwitchPotato;
(function (TwitchPotato) {
    var Notification = (function () {
        function Notification() {
            this.online = {};
        }
        Notification.prototype.notify = function (online) {
        };
        return Notification;
    })();
    TwitchPotato.Notification = Notification;
})(TwitchPotato || (TwitchPotato = {}));
var TwitchPotato;
(function (TwitchPotato) {
    "use strict";
    var PlayerLayout;
    (function (PlayerLayout) {
        PlayerLayout[PlayerLayout["Default"] = 0] = "Default";
        PlayerLayout[PlayerLayout["Equal"] = 1] = "Equal";
    })(PlayerLayout || (PlayerLayout = {}));
    var Fullscreen;
    (function (Fullscreen) {
        Fullscreen[Fullscreen["Enter"] = 0] = "Enter";
        Fullscreen[Fullscreen["Exit"] = 1] = "Exit";
        Fullscreen[Fullscreen["Toggle"] = 2] = "Toggle";
    })(Fullscreen || (Fullscreen = {}));
    var Player = (function () {
        function Player() {
            this.layout = PlayerLayout.Default;
        }
        Player.prototype.LoadInputs = function () {
            TwitchPotato.Application.Input.RegisterInputs(TwitchPotato.InputType.Player);
        };
        Player.prototype.OnInput = function (input) {
            switch (input.id) {
                case 'playerUp':
                    this.UpdateSelected(-1);
                    break;
                case 'playerDown':
                    this.UpdateSelected(1);
                    break;
                case 'playerStop':
                    this.Stop();
                    break;
                case 'playerPause':
                    this.Pause();
                    break;
                case 'playerMute':
                    this.Mute(undefined);
                    break;
                case 'playerFlashback':
                    this.Flashback();
                    break;
                case 'playerSelect':
                    this.Select();
                    break;
                case 'playerLayout':
                    this.UpdateLayout();
                    break;
                case 'playerFullscreenToggle':
                    this.Fullscreen(Fullscreen.Toggle);
                    break;
                case 'playerFullscreenEnter':
                    this.Fullscreen(Fullscreen.Enter);
                    break;
                case 'playerFullscreenExit':
                    this.Fullscreen(Fullscreen.Exit);
                    break;
                default:
                    break;
            }
        };
        Player.prototype.GetPlayerById = function (id) {
            for (var i in this.players) {
                var player = this.players[i];
                if (player.id === id) {
                    return player;
                }
            }
            return undefined;
        };
        Player.prototype.GetPlayerByNumber = function (number) {
            for (var i in this.players) {
                var player = this.players[i];
                if (player.number === number) {
                    return player;
                }
            }
            return undefined;
        };
        Player.prototype.GetSelectedPlayer = function () {
            var number = parseInt($('#players .player.selected').attr('number')) || 0;
            return this.GetPlayerByNumber(number);
        };
        Player.prototype.Create = function (id, isVideo) {
            var _this = this;
            if (isVideo === void 0) { isVideo = false; }
            var player = this.GetPlayerById(id);
            if (player === undefined) {
                var numPlayers = TwitchPotato.Utils.DictionarySize(this.players);
                $('#players').append($(TwitchPotato.Utils.Format($('#player-template').html(), id, numPlayers)));
                player = {
                    id: id,
                    isLoaded: false,
                    isPlaying: false,
                    isMuted: false,
                    number: numPlayers,
                    flashback: undefined,
                    webview: $('#players webview[number="' + numPlayers + '"]')[0]
                };
                player.webview.addEventListener('loadcommit', function () {
                    player.webview.executeScript({
                        file: 'js/jquery-2.1.1.min.js'
                    });
                    player.webview.executeScript({
                        file: 'js/inject.js'
                    });
                    setTimeout(function () {
                        _this.Load(player, id, isVideo);
                        player.isLoaded = true;
                    });
                });
                player.webview.addEventListener('consolemessage', function (e) {
                    console.log(e);
                });
                this.players[player.id] = player;
            }
            return player;
        };
        Player.prototype.Play = function (id, create, isVideo) {
            if (create === void 0) { create = false; }
            if (isVideo === void 0) { isVideo = false; }
            this.LoadInputs();
            var numPlayers = TwitchPotato.Utils.DictionarySize(this.players);
            if (numPlayers === 4)
                return;
            var player = this.GetPlayerById(id);
            if (player !== undefined) {
                this.Select();
                this.ExecuteEmbedMethod(player, 'playVideo');
                player.isPlaying = true;
                return;
            }
            if (create === true) {
                player = this.GetPlayerById(id) || this.Create(id);
            }
            else {
                player = this.GetPlayerByNumber(0) || this.Create(id);
            }
            if (player.isLoaded === true) {
                this.Load(player, id, isVideo);
            }
            $('#players').fadeIn();
            this.UpdateLayout();
        };
        Player.prototype.Select = function () {
            var current = this.GetPlayerByNumber(0);
            var player = this.GetSelectedPlayer();
            if (player !== undefined) {
                current.number = player.number;
                $(current.webview).attr('number', player.number);
                player.number = 0;
                $(player.webview).attr('number', 0);
            }
            this.ClearSelected();
        };
        Player.prototype.Stop = function () {
            var player = this.GetSelectedPlayer();
            if (player !== undefined) {
                if (TwitchPotato.Utils.DictionarySize(this.players) > 1) {
                    this.Remove(player);
                }
                else {
                    this.ExecuteEmbedMethod(player, 'pauseVideo');
                    player.isPlaying = false;
                    TwitchPotato.Application.ToggleGuide();
                }
            }
        };
        Player.prototype.Pause = function () {
            var player = this.GetSelectedPlayer();
            if (player !== undefined) {
                if (player.isPlaying) {
                    this.ExecuteEmbedMethod(player, 'pauseVideo');
                }
                else {
                    this.ExecuteEmbedMethod(player, 'playVideo');
                }
                player.isPlaying = !player.isPlaying;
            }
        };
        Player.prototype.Remove = function (player) {
            $(player.webview).remove();
            delete this.players[player.id];
            this.UpdateNumbers();
            this.ClearSelected();
        };
        Player.prototype.UpdateNumbers = function () {
            console.log('UpdateNumbers sort?');
            for (var i in this.players) {
                var player = this.players[i];
                player.number = parseInt(i);
                $(player.webview).attr('number', i);
            }
        };
        Player.prototype.UpdateLayout = function (update) {
            if (update === void 0) { update = false; }
            if (update !== true) {
                if (this.layout === PlayerLayout.Default)
                    this.layout = PlayerLayout.Equal;
                else
                    this.layout = PlayerLayout.Default;
            }
            $('#players .player').removeClass('default').removeClass('equal').addClass(PlayerLayout[this.layout]);
            $('#players .selector').removeClass('default').removeClass('equal').addClass(PlayerLayout[this.layout]);
        };
        Player.prototype.UpdateSelected = function (direction) {
            var index = parseInt($('#players .player.selected').attr('number')) || 0;
            $('#players .player').removeClass('selected');
            $('#players .selector').removeAttr('number');
            if (direction === TwitchPotato.Direction.Up)
                index--;
            else if (direction === TwitchPotato.Direction.Down)
                index++;
            if (index < 0) {
                index = $('#players .player').length - 1;
            }
            else if (index > $('#players .player').length - 1) {
                index = 0;
            }
            $('#players .player[number="' + index + '"]').addClass('selected');
            $('#players .selector').attr('number', index);
            $('#players .selector').attr('number', index);
            this.UpdateNumbers();
            clearTimeout(this.selectionTimer);
            this.selectionTimer = setTimeout(this.ClearSelected, 5000);
        };
        Player.prototype.ClearSelected = function () {
            $('#players .player').removeClass('selected');
            $('#players .selector').removeAttr('number');
        };
        Player.prototype.Flashback = function () {
            var player = this.GetSelectedPlayer();
            if (player.flashback !== undefined) {
                this.Load(player, player.flashback);
            }
        };
        Player.prototype.Fullscreen = function (fullscreen) {
            var player = this.GetSelectedPlayer();
            this.ExecuteMethod(player, 'updateFullscreen', [
                Fullscreen[fullscreen]
            ]);
        };
        Player.prototype.Load = function (player, id, video) {
            if (video === void 0) { video = false; }
            player.flashback = (player.id !== id) ? player.id : player.flashback;
            player.id = id;
            if (video !== true) {
                this.ExecuteEmbedMethod(player, 'loadStream', [
                    id
                ]);
            }
            else {
                this.ExecuteEmbedMethod(player, 'loadVideo', [
                    id
                ]);
            }
            this.ExecuteEmbedMethod(player, 'playVideo');
            player.isPlaying = true;
        };
        Player.prototype.Mute = function (mute) {
            var player = this.GetSelectedPlayer();
            player.isMuted = mute || !player.isMuted;
            if (player.isMuted === true) {
                this.ExecuteEmbedMethod(player, 'mute');
            }
            else {
                this.ExecuteEmbedMethod(player, 'unmute');
            }
        };
        Player.prototype.ExecuteMethod = function (player, method, args) {
            var data = {
                method: method,
                args: args || []
            };
            var code = "window.potato.executeMethod.call(window.potato, '" + JSON.stringify(data) + "');";
            player.webview.executeScript({
                code: code
            });
        };
        Player.prototype.ExecuteEmbedMethod = function (player, method, arg) {
            if (arg === void 0) { arg = []; }
            var code = TwitchPotato.Utils.Format('document.getElementsByTagName("embed")[0].{0}()', method);
            if (arg !== undefined)
                code = TwitchPotato.Utils.Format('document.getElementsByTagName("embed")[0].{0}("{1}")', method, arg);
            player.webview.executeScript({
                code: code
            });
        };
        return Player;
    })();
    TwitchPotato.Player = Player;
})(TwitchPotato || (TwitchPotato = {}));
var TwitchPotato;
(function (TwitchPotato) {
    var Utils;
    (function (Utils) {
        function DictionarySize(dictionary) {
            var count = 0;
            for (var key in dictionary) {
                count++;
            }
            return count;
        }
        Utils.DictionarySize = DictionarySize;
        function FormatSeconds(seconds) {
            var hours = Math.floor(seconds / (60 * 60));
            var minDiv = seconds % (60 * 60);
            var mins = Math.floor(minDiv / 60);
            var secDiv = minDiv % 60;
            var secs = Math.ceil(secDiv);
            return ((hours > 0) ? hours + ':' : '') + ':' + ((mins < 10) ? '0' + mins : mins) + ':' + ((secs < 10) ? '0' + secs : secs);
        }
        Utils.FormatSeconds = FormatSeconds;
        function Format(str) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return str.replace(/\{\{|\}\}|\{(\d+)\}/g, function (m, n) {
                if (m === "{{") {
                    return "{";
                }
                if (m === "}}") {
                    return "}";
                }
                return args[n];
            });
        }
        Utils.Format = Format;
        function Deliminate(num, char) {
            if (char === void 0) { char = ','; }
            var str = num + '';
            var x = str.split('.');
            var x1 = x[0];
            var x2 = x.length > 1 ? '.' + x[1] : '';
            var rgx = /(\d+)(\d{3})/;
            while (rgx.test(x1)) {
                x1 = x1.replace(rgx, '$1' + char + '$2');
            }
            return x1 + x2;
        }
        Utils.Deliminate = Deliminate;
    })(Utils = TwitchPotato.Utils || (TwitchPotato.Utils = {}));
})(TwitchPotato || (TwitchPotato = {}));
var TwitchPotato;
(function (TwitchPotato) {
    "use strict";
    var Storage = (function () {
        function Storage() {
            this.Load();
        }
        Storage.prototype.Load = function () {
            var _this = this;
            chrome.storage.local.get(null, function (store) {
                if ($.isEmptyObject(store) === true)
                    store.settings = _this.LoadDefaults(true);
                _this.settings = store.settings;
                TwitchPotato.Application.OnStorageLoaded(store.settings);
            });
        };
        Storage.prototype.LoadDefaults = function (clearStorage) {
            var _this = this;
            if (clearStorage === void 0) { clearStorage = false; }
            this.settings = {
                zoom: 100,
                users: [
                    'creditx'
                ]
            };
            if (clearStorage)
                this.ClearStorage(function () {
                    _this.Save();
                });
            return this.settings;
        };
        Storage.prototype.ClearStorage = function (callback) {
            if (callback === void 0) { callback = function () {
            }; }
            chrome.storage.local.clear(function () {
                chrome.storage.sync.clear(function () {
                    callback();
                });
            });
        };
        Storage.prototype.Save = function (callback) {
            if (callback === void 0) { callback = function () {
            }; }
            chrome.storage.local.set({
                settings: this.settings
            }, function () {
                return callback();
            });
        };
        return Storage;
    })();
    TwitchPotato.Storage = Storage;
})(TwitchPotato || (TwitchPotato = {}));
"use strict";
var TwitchPotato;
(function (TwitchPotato) {
    var Twitch = (function () {
        function Twitch() {
            var _this = this;
            this.channelsTable = {};
            this.gamesTable = {};
            this.videosTable = {};
            this.followedChannels = {};
            this.followedGames = {};
            this.featuredChannels = {};
            this.topChannels = {};
            this.gameChannels = {};
            this.topGames = {};
            this.gameVideos = {};
            this.users = {};
            window.addEventListener('message', function (event) {
                var json = JSON.parse(event.data);
                _this['on' + json.method].apply(_this, json.args);
            });
        }
        Twitch.prototype.Authorize = function (username) {
            var _this = this;
            if ($('#users .webview[username="' + username + '"]').length !== 0) {
                return;
            }
            var html = $(TwitchPotato.Utils.Format($('#twitch-template').html(), username));
            $('#users').append(html);
            var webview = $('#users webview[username="' + username + '"]')[0];
            webview.addEventListener('contentload', function () {
                return _this.InitializeWebView(username);
            });
            webview.addEventListener('consolemessage', function (e) {
                console.log(e);
            });
            this.GetFollowedChannels(username);
            this.GetFollowedGames(username);
        };
        Twitch.prototype.InitializeWebView = function (username) {
            $('#users webview').hide();
            $('#users webview').each(function (index, webview) {
                if ($(webview).attr('src').indexOf('https://api.twitch.tv/kraken/oauth2') === 0) {
                    TwitchPotato.Application.Input.RegisterInputs(TwitchPotato.InputType.Global);
                    $('#users .head').text(TwitchPotato.Utils.Format('Enter the login for {0} | Press ESC to Cancel', $(webview).attr('username')));
                    $(webview).show();
                    $('#users').fadeIn();
                    return false;
                }
                else {
                    var data = {
                        method: 'Init',
                        args: [
                            username,
                            Twitch.clientId,
                            Twitch.scope
                        ]
                    };
                    webview[0].contentWindow.postMessage(JSON.stringify(data), '*');
                }
            });
        };
        Twitch.prototype.ClearPartition = function (username, callback) {
            if (callback === void 0) { callback = function () {
            }; }
            var webview = $('#users webview[username="' + username + '"]')[0];
            if (webview !== undefined) {
                var html = $(TwitchPotato.Utils.Format($('#twitch-template').html(), username));
                $('#users').append(html);
                webview = $('#users webview[username="' + username + '"]')[0];
            }
            webview.clearData({}, {
                appcache: true,
                cookies: true,
                fileSystems: true,
                indexedDB: true,
                localStorage: true,
                webSQL: true
            }, function () {
                $(webview).remove();
                callback();
            });
        };
        Twitch.prototype.OnAuthorized = function (username, token) {
            this.users[username] = token;
            $('#users webview[username="' + username + '"]').remove();
            if ($('#users webview').length === 0) {
                $('#users').fadeOut();
                $('#guide').fadeIn();
                TwitchPotato.Application.Guide.LoadInputs();
            }
        };
        Twitch.prototype.ShowError = function (xhr, status, error) {
            var json = xhr.responseJSON;
            TwitchPotato.Application.ShowError(TwitchPotato.Utils.Format('{0} - {1}: {2}', json.status, json.error, json.message));
        };
        Twitch.prototype.FollowChannel = function (username, channel, unfollow) {
            var _this = this;
            if (unfollow === void 0) { unfollow = false; }
            var users = [];
            if (username === 'all') {
                $.each(this.users, function (user, value) {
                    users.push(user);
                });
            }
            else {
                users = [
                    username
                ];
            }
            $.each(users, function (index, user) {
                var url = TwitchPotato.Utils.Format(Twitch.urls.followChannel, user, channel, _this.users[user], Twitch.scope);
                $.ajax({
                    url: url,
                    type: (unfollow === true) ? 'DELETE' : 'PUT',
                    error: _this.ShowError,
                    success: function () {
                        _this.GetFollowedChannels(user);
                        var time = (unfollow === true) ? 5000 : 1000;
                        setTimeout(function () {
                            return _this.GetFollowedChannels(user);
                        }, time);
                    }
                });
            });
        };
        Twitch.prototype.FollowGame = function (username, game, unfollow) {
            var _this = this;
            if (unfollow === void 0) { unfollow = false; }
            var users = [];
            if (username === 'all') {
                $.each(this.users, function (user, value) {
                    users.push(user);
                });
            }
            else {
                users = [
                    username
                ];
            }
            $.each(users, function (index, user) {
                var url = TwitchPotato.Utils.Format(Twitch.urls.followGame, user, game, _this.users[user], Twitch.scope);
                $.ajax({
                    url: url,
                    type: (unfollow === true) ? 'DELETE' : 'PUT',
                    error: _this.ShowError,
                    success: function () {
                        _this.GetFollowedGames(user);
                        var time = (unfollow === true) ? 5000 : 1000;
                        setTimeout(function () {
                            return _this.GetFollowedGames(user);
                        }, time);
                    }
                });
            });
        };
        Twitch.prototype.GetFeatured = function (getAll) {
            var _this = this;
            if (getAll === void 0) { getAll = true; }
            this.featuredChannels = {};
            var url = TwitchPotato.Utils.Format(Twitch.urls.featured, Twitch.limit);
            $.ajax({
                url: url,
                error: this.ShowError,
                success: function (json) {
                    _this.ParseChannelsObject(json.featured, _this.featuredChannels);
                    if (getAll === true && json._total > Twitch.limit)
                        for (var offset = Twitch.limit; offset < json._total; offset += Twitch.limit)
                            _this.GetNextChannels(url, offset, _this.featuredChannels);
                }
            });
        };
        Twitch.prototype.GetTopChannels = function (getAll) {
            var _this = this;
            if (getAll === void 0) { getAll = false; }
            this.topChannels = {};
            var url = TwitchPotato.Utils.Format(Twitch.urls.topChannels, Twitch.limit);
            $.ajax({
                url: url,
                error: this.ShowError,
                success: function (json) {
                    _this.ParseChannelsObject(json.streams, _this.topChannels);
                    if (getAll === true && json._total > Twitch.limit)
                        for (var offset = Twitch.limit; offset < json._total; offset += Twitch.limit)
                            _this.GetNextChannels(url, offset, _this.topChannels);
                }
            });
        };
        Twitch.prototype.GetTopGames = function (getAll) {
            var _this = this;
            if (getAll === void 0) { getAll = true; }
            this.topGames = {};
            var url = TwitchPotato.Utils.Format(Twitch.urls.games, Twitch.limit);
            $.ajax({
                url: url,
                error: this.ShowError,
                success: function (json) {
                    _this.ParseGamesObject(json.top, _this.topGames);
                    if (getAll === true && json._total > Twitch.limit)
                        for (var offset = Twitch.limit; offset < json._total; offset += Twitch.limit)
                            _this.GetNextGames(url, offset, _this.topGames);
                }
            });
        };
        Twitch.prototype.GetGameChannels = function (game, getAll) {
            var _this = this;
            if (getAll === void 0) { getAll = true; }
            this.gameChannels = {};
            var url = TwitchPotato.Utils.Format(Twitch.urls.game, game, Twitch.limit);
            $.ajax({
                url: url,
                error: this.ShowError,
                success: function (json) {
                    _this.ParseChannelsObject(json.streams, _this.gameChannels);
                    if (getAll === true && json._total > Twitch.limit)
                        for (var offset = Twitch.limit; offset < json._total; offset += Twitch.limit)
                            _this.GetNextChannels(url, offset, _this.gameChannels);
                }
            });
        };
        Twitch.prototype.GetChannelVideos = function (channel, getAll) {
            var _this = this;
            if (getAll === void 0) { getAll = true; }
            this.gameVideos = {};
            var url = TwitchPotato.Utils.Format(Twitch.urls.videos, channel, Twitch.limit);
            $.ajax({
                url: url,
                error: this.ShowError,
                success: function (json) {
                    _this.ParseVideosObject(json.videos, _this.gameVideos);
                    if (getAll === true && json._total > Twitch.limit)
                        for (var offset = Twitch.limit; offset < json._total; offset += Twitch.limit)
                            _this.GetNextVideos(url, offset, _this.gameVideos);
                }
            });
        };
        Twitch.prototype.GetFollowedChannels = function (username) {
            var _this = this;
            var search = [];
            this.followedChannels = {};
            var url = TwitchPotato.Utils.Format(Twitch.urls.followedChannels, username);
            $.ajax({
                url: url,
                error: this.ShowError,
                success: function (json) {
                    $.each(json.follows, function (index, channel) {
                        search.push(channel.channel.name);
                    });
                    _this.GetChannelsByName(search, _this.followedChannels);
                }
            });
        };
        Twitch.prototype.GetFollowedGames = function (username) {
            var _this = this;
            var search = [];
            this.followedGames = {};
            var url = TwitchPotato.Utils.Format(Twitch.urls.followedGames, username);
            $.ajax({
                url: url,
                error: this.ShowError,
                success: function (json) {
                    $.each(json.follows, function (index, game) {
                        _this.followedGames[game.name] = game.name;
                    });
                }
            });
        };
        Twitch.prototype.GetChannelsByName = function (channels, dictionary) {
            var _this = this;
            var url = TwitchPotato.Utils.Format(Twitch.urls.searchChannels, channels.join(), Twitch.limit);
            $.ajax({
                url: url,
                error: this.ShowError,
                success: function (json) {
                    _this.ParseChannelsObject(json.streams, dictionary);
                    if (json._total > Twitch.limit)
                        for (var offset = Twitch.limit; offset < json._total; offset += Twitch.limit)
                            _this.GetNextChannels(url, offset, dictionary);
                }
            });
        };
        Twitch.prototype.GetNextChannels = function (url, offset, dictionary) {
            var _this = this;
            $.ajax({
                url: TwitchPotato.Utils.Format(url + '&offset={0}', offset),
                error: this.ShowError,
                success: function (json) {
                    return _this.ParseChannelsObject(json.streams, dictionary);
                },
            });
        };
        Twitch.prototype.GetNextGames = function (url, offset, dictionary) {
            var _this = this;
            $.ajax({
                url: TwitchPotato.Utils.Format(url + '&offset={0}', offset),
                error: this.ShowError,
                success: function (json) {
                    return _this.ParseGamesObject(json.top, dictionary);
                },
            });
        };
        Twitch.prototype.GetNextVideos = function (url, offset, dictionary) {
            var _this = this;
            $.ajax({
                url: TwitchPotato.Utils.Format(url + '&offset={0}', offset),
                error: this.ShowError,
                success: function (json) {
                    return _this.ParseVideosObject(json.videos, dictionary);
                },
            });
        };
        Twitch.prototype.ParseChannelsObject = function (object, dictionary) {
            var _this = this;
            $.each(object, function (index, data) {
                if (data.stream !== undefined)
                    data = data.stream;
                dictionary[data.channel.name] = data.channel.name;
                _this.channelsTable[data.channel.name] = {
                    name: data.channel.name,
                    streamer: data.channel.display_name,
                    title: data.channel.status,
                    viewers: data.viewers,
                    game: data.game,
                    preview: data.preview.large
                };
            });
        };
        Twitch.prototype.ParseGamesObject = function (object, dictionary, followed) {
            var _this = this;
            if (followed === void 0) { followed = false; }
            $.each(object, function (index, data) {
                dictionary[data.game.name] = data.game.name;
                _this.gamesTable[data.game.name] = {
                    name: data.game.name,
                    channels: data.channels || -1,
                    viewers: data.viewers || -1,
                    boxArt: data.game.box.large
                };
            });
        };
        Twitch.prototype.ParseVideosObject = function (object, dictionary) {
            var _this = this;
            $.each(object, function (index, data) {
                dictionary[data._id] = data._id;
                _this.videosTable[data._id] = {
                    id: data._id,
                    name: data.channel.name,
                    streamer: data.channel.display_name,
                    title: data.title,
                    views: data.views,
                    length: data.length,
                    preview: (data.preview || '').replace(/320x240/, '640x360')
                };
            });
        };
        Twitch.clientId = '60wzh4fjbowe6jwtofuc1jakjfgekry';
        Twitch.scope = 'user_read+user_follows_edit';
        Twitch.limit = 100;
        Twitch.urls = {
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
        };
        return Twitch;
    })();
    TwitchPotato.Twitch = Twitch;
})(TwitchPotato || (TwitchPotato = {}));
/// <reference path="./potato.d.ts" />
/// <reference path="./jquery.d.ts" />
/// <reference path="./utils.ts" />
/// <reference path="./storage"/>
/// <reference path="./input.ts" />
/// <reference path="./guide.ts" />
/// <reference path="./player.ts" />
/// <reference path="./twitch.ts" />
var TwitchPotato;
(function (TwitchPotato) {
    "use strict";
    var ZoomType;
    (function (ZoomType) {
        ZoomType[ZoomType["Update"] = 0] = "Update";
        ZoomType[ZoomType["In"] = 1] = "In";
        ZoomType[ZoomType["Out"] = 2] = "Out";
        ZoomType[ZoomType["Reset"] = 3] = "Reset";
    })(ZoomType || (ZoomType = {}));
    (function (Direction) {
        Direction[Direction["Up"] = 0] = "Up";
        Direction[Direction["Down"] = 1] = "Down";
        Direction[Direction["Left"] = 2] = "Left";
        Direction[Direction["Right"] = 3] = "Right";
    })(TwitchPotato.Direction || (TwitchPotato.Direction = {}));
    var Direction = TwitchPotato.Direction;
    var Main = (function () {
        function Main() {
            var _this = this;
            $(function () {
                return _this.Initialize();
            });
        }
        Main.prototype.ShowError = function (error) {
            $('#error .error').html(error);
            $('#error').fadeIn(function () {
                return setTimeout(function () {
                    $('#error').fadeOut();
                }, 10000);
            });
        };
        Main.prototype.Initialize = function () {
            this.Storage = new TwitchPotato.Storage();
            this.Input = new TwitchPotato.Input();
            this.Guide = new TwitchPotato.Guide();
            this.Player = new TwitchPotato.Player();
            this.Twitch = new TwitchPotato.Twitch();
            this.Guide.LoadInputs();
        };
        Main.prototype.OnStorageLoaded = function (storage) {
            this.UpdateZoom(ZoomType.Update);
        };
        Main.prototype.OnInput = function (input) {
            console.log(input);
            switch (input.id) {
                case 'globalExit':
                    this.GlobalExit();
                    break;
                case 'globalGuideToggle':
                    this.ToggleGuide();
                    break;
                case 'globalZoomIn':
                    this.UpdateZoom(ZoomType.In);
                    break;
                case 'globalZoomOut':
                    this.UpdateZoom(ZoomType.Out);
                    break;
                case 'globalZoomReset':
                    this.UpdateZoom(ZoomType.Reset);
                    break;
                case 'globalSaveSetting':
                    break;
                default:
                    break;
            }
        };
        Main.prototype.GlobalExit = function () {
            if ($('#webviews webview:visible').length === 0) {
                window.close();
            }
            else {
                if ($('#webviews #users webview').length !== 0) {
                    var webview = $('#webviews #users webview:eq(0)');
                    var username = webview.attr('username');
                }
                else if ($('#webviews #login webview').length !== 0) {
                    $('#webviews #login webview').attr('src', 'about:blank');
                    $('#webviews #login').fadeOut();
                }
                this.Guide.LoadInputs();
            }
        };
        Main.prototype.ToggleGuide = function () {
            if ($('#guide:visible').length !== 0) {
                $('#players').fadeIn();
                $('#guide').fadeOut();
                this.Player.LoadInputs();
            }
            else {
                $('#players').fadeOut();
                $('#guide').fadeIn();
                this.Guide.LoadInputs();
            }
        };
        Main.prototype.UpdateZoom = function (type) {
            if (type === ZoomType.In) {
                this.Storage.settings.zoom += 1;
            }
            else if (type === ZoomType.Out) {
                this.Storage.settings.zoom -= 1;
            }
            else if (type === ZoomType.Reset) {
                this.Storage.settings.zoom = 100;
            }
            if (type !== ZoomType.Update)
                this.Storage.Save();
            $('body').css('font-size', this.Storage.settings.zoom + '%');
            console.log('Update guide size');
            if ($('#players .chat webview').length > 0) {
                var webview = $('#players .chat webview')[0];
                webview.insertCSS({
                    code: TwitchPotato.Utils.Format('body { font-size: {0}%!important; }', this.Storage.settings.zoom)
                });
            }
        };
        return Main;
    })();
    TwitchPotato.Main = Main;
    TwitchPotato.Application = new Main();
})(TwitchPotato || (TwitchPotato = {}));
//# sourceMappingURL=potato.js.map