var TwitchPotato;
(function (TwitchPotato) {
    "use strict";
    followed = false;
})(TwitchPotato || (TwitchPotato = {}));
var Twitch = (function () {
    function Twitch() {
        this.users = {};
        this.InitializeWebView = function (username) {
            $('#users webview').hide();
            $('#users webview').each(function (index, webview) {
                if ($(webview).attr('src').indexOf('https://api.twitch.tv/kraken/oauth2') === 0) {
                    Application.Input.RegisterInputs(InputType.Global);
                    $('#users .head').text(Utils.Format('Enter the login for {0} | Press ESC to Cancel', $(webview).attr('username')));
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
                Application.Guide.LoadInputs();
            }
        };
        this.ShowError = function (xhr, status, error) {
            var json = xhr.responseJSON;
            Application.ShowError(Utils.Format('{0} - {1}: {2}', json.status, json.error, json.message));
        };
        this.Games = function () {
            var _this = this;
            $.ajax({
                url: Twitch.urls.games,
                error: function (xhr, status, error) {
                    return _this.Error(xhr, status, error);
                },
                success: function (json) {
                    potato.guide.onGames(json);
                    if (current + limit < json._total) {
                        _this.games(json._links.next, current + limit);
                    }
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
        this.FollowedChannels(username);
        this.FollowedGames(username);
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
    Twitch.prototype.TwitchError = function (xhr, status, error) {
    };
    Twitch.prototype.GetNextGames = function (url, current) {
        url += Utils.Format('&offset={0}', Twitch.limit);
    };
    Twitch.clientId = '60wzh4fjbowe6jwtofuc1jakjfgekry';
    Twitch.scope = 'user_read+user_follows_edit';
    Twitch.limit = 100;
    Twitch.urls = {
        featured: '',
        streams: '',
        games: Utils.Format('https://api.twitch.tv/kraken/games/top?limit={0}', Twitch.limit),
    };
    return Twitch;
})();
exports.Twitch = Twitch;
//# sourceMappingURL=twitch.js.map