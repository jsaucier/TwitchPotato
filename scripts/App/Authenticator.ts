module TwitchPotato {

    export class AuthenticatorHandler {

        /** The authentication webview. */
        private _webview: Webview;

        /** Gets or sets if the user is authenticated. */
        private _isAuthenticated = false;

        /** Gets or sets the user's authentication token. */
        private _token: string;

        /** Gets or sets the user's name. */
        private _user: string;

        /** Gets or sets the user's display name. */
        private _name: string;

        /** The callback function when authentication is checked. */
        private _callback: (user: string, name: string, token: string) => void;

        /** Creates an instance of the AuthenticationHandler. */
        constructor(onAuthenticated?: (user: string, name: string, token: string) => void) {

            /** Set the webview. */
            this._webview = <Webview>$('#login webview')[0];

            /** Set the callback function. */
            this._callback = onAuthenticated;

            /** Setup the event listener. */
            this._webview.addEventListener('contentload', () => this.ContentLoaded());

            /** Get the access token. */
            this.GetToken();
        }

        /** Logs into Twitch.tv */
        LogIn(): void {

            /** Navigate to the twitch.tv login page. */
            this.Navigate('https://secure.twitch.tv/login', true, true);
        }

        /** Logs out of Twitch.tv */
        LogOut(): void {

            /** Display the loading screen. */
            App.Loading(true);

            /** The user is no longer authenticated. */
            this._isAuthenticated = false;

            /** Navigate to the twitch.tv logout page. */
            this.Navigate('http://www.twitch.tv/logout');
        }

        /** Navigate the webview to the url. */
        private Navigate(url: string, show?: boolean, fade?: boolean) {

            $('#login webview').attr('src', url);

            if (show !== undefined || fade !== undefined)
                this.Visibility(show, fade);
        }

        /** Update the webviews visibility. */
        private Visibility(show = true, fade?: boolean) {

            if (show !== undefined)
                $('#login webview').toggle(show);

            if (fade !== undefined) {
                if (fade)
                    $('#login').fadeIn();
                else
                    $('#login').fadeOut();
            }
        }

        /** Checks to see if the user is authenticated. */
        private ContentLoaded(): void {

            /** Get the webview element. */
            var element = $('#login webview');

            /** Do nothing if the page is blank. */
            if (element.attr('src') === 'about:blank') return;

            /** User interaction is required. */
            if (element.attr('src') === 'https://secure.twitch.tv/login' ||
                element.attr('src').indexOf('https://api.twitch.tv/kraken/oauth2/authorize') === 0) {

                this.Visibility(true, true);

                return App.Loading(false);
            }

            /** Redirect to the token page. */
            if (element.attr('src') === 'http://www.twitch.tv/') {

                this.GetToken();
            }

            /** User needs to authenticate. */
            else if (element.attr('src').indexOf('https://api.twitch.tv/kraken/oauth2/authenticate') === 0) {

                this.LogIn();
            }

            /** Get the token and user name. */
            else if (element.attr('src').indexOf('https://dl.dropboxusercontent.com/spa/tn9l4tkx2yhpiv3/') === 0) {

                this._token = element.attr('src').match(/#access_token=(.*)&/i)[1];

                this.Navigate('about:blank', false, false);

                $.ajax({
                    url: 'https://api.twitch.tv/kraken/user?oauth_token={0}'.format(this._token),
                    error: (xhr, status, error) => console.log(xhr, status, error),
                    global: false,
                    success: (json) => {

                        this._user = json.name;
                        this._name = json.display_name;

                        /** Return the token to the callback function */
                        this._callback(this._user, this._name, this._token);
                    }
                });
            }
        }

        /** Get the OAuth2 access token. */
        private GetToken(): void {

            var url =
                'https://api.twitch.tv/kraken/oauth2/authorize?response_type=token' +
                '&client_id=60wzh4fjbowe6jwtofuc1jakjfgekry' +
                '&redirect_uri=https%3A%2F%2Fdl.dropboxusercontent.com%2Fspa%2Ftn9l4tkx2yhpiv3%2Ftwitch%2520potato%2Fpublic%2Ftoken.html' +
                '&scope=user_read%20user_follows_edit';

            this.Navigate(url, false, false);
        }
    }
}
