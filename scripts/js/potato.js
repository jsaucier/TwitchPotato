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
        InputType[InputType['Global'] = 0] = 'Global';
        InputType[InputType['Guide'] = 1] = 'Guide';
        InputType[InputType['Player'] = 2] = 'Player';
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
    var Player = (function () {
        function Player() {
        }
        Player.prototype.LoadInputs = function () {
            TwitchPotato.Application.Input.RegisterInputs(TwitchPotato.InputType.Player);
        };
        Player.prototype.OnInput = function (input) {
        };
        return Player;
    })();
    TwitchPotato.Player = Player;
})(TwitchPotato || (TwitchPotato = {}));
var TwitchPotato;
(function (TwitchPotato) {
    var Utils;
    (function (Utils) {
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
var TwitchPotato;
(function (TwitchPotato) {
    "use strict";
    var Twitch = (function () {
        function Twitch() {
            this.users = {};
            this.games = {};
            this.InitializeWebView = function (username) {
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
            this.OnAuthorized = function (username, token) {
                this.users[username] = token;
                $('#users webview[username="' + username + '"]').remove();
                if ($('#users webview').length === 0) {
                    $('#users').fadeOut();
                    $('#guide').fadeIn();
                    TwitchPotato.Application.Guide.LoadInputs();
                }
            };
            this.ShowError = function (xhr, status, error) {
                var json = xhr.responseJSON;
                TwitchPotato.Application.ShowError(TwitchPotato.Utils.Format('{0} - {1}: {2}', json.status, json.error, json.message));
            };
            this.UpdateGames = function () {
                var _this = this;
                this.games = {};
                $.ajax({
                    url: Twitch.urls.games,
                    error: this.ShowError,
                    success: function (json) {
                        _this.ParseGameJson(json);
                        if (json._total > Twitch.limit)
                            for (var offset = Twitch.limit; offset < json._total; offset += Twitch.limit)
                                _this.GetNextGames(Twitch.urls.games, offset);
                    }
                });
            };
        }
        Twitch.prototype.Authorize = function (username, update) {
            var _this = this;
            if ($('#users .webview[username="' + username + '"]').length !== 0) {
                return;
            }
            var html = $($('#twitch-template').html().format(username));
            $('#users').append(html);
            var webview = $('#users webview[username="' + username + '"]')[0];
            webview.addEventListener('contentload', function () {
                return _this.InitializeWebView(username);
            });
            webview.addEventListener('consolemessage', function (e) {
                console.log(e);
            });
            console.log('Uncomment');
        };
        Twitch.prototype.ClearPartition = function (username, callback) {
            if (callback === void 0) { callback = function () {
            }; }
            var webview = $('#users webview[username="' + username + '"]')[0];
            if (webview !== undefined) {
                var html = $($('#twitch-template').html().format(username));
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
        Twitch.prototype.GetNextGames = function (url, offset) {
            var _this = this;
            $.ajax({
                url: TwitchPotato.Utils.Format('&offset={0}', offset),
                error: this.ShowError,
                success: function (json) {
                    return _this.ParseGameJson(json);
                },
            });
        };
        Twitch.prototype.ParseGameJson = function (json) {
            var _this = this;
            $.each(json.top, function (index, g) {
                _this.games[g.game.name] = {
                    name: g.game.name,
                    channels: g.channels,
                    viewers: g.viewers,
                    boxArt: g.game.box.large
                };
            });
        };
        Twitch.clientId = '60wzh4fjbowe6jwtofuc1jakjfgekry';
        Twitch.scope = 'user_read+user_follows_edit';
        Twitch.limit = 100;
        Twitch.urls = {
            featured: '',
            streams: '',
            games: TwitchPotato.Utils.Format('https://api.twitch.tv/kraken/games/top?limit={0}', Twitch.limit),
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
        ZoomType[ZoomType['Update'] = 0] = 'Update';
        ZoomType[ZoomType['In'] = 1] = 'In';
        ZoomType[ZoomType['Out'] = 2] = 'Out';
        ZoomType[ZoomType['Reset'] = 3] = 'Reset';
    })(ZoomType || (ZoomType = {}));
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