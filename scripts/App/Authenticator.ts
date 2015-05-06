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
            this._webview.addEventListener('contentload', () => this.CheckAuthentication());
        }

        /** Gets whether the user is authenticated. */
        IsAuthenticated(): boolean { return this._isAuthenticated; }

        /** Gets the user's token. */
        GetAuthentication(): { name: string, displayName: string, token: string } {

            /** Return the authenticated user name and token. */
            return {
                name: this._user,
                displayName: this._name,
                token: this._token
            };
        }

        /** Logs into Twitch.tv */
        LogIn(): void {

            /** Navigate to the twitch.tv login page. */
            this.Navigate('https://secure.twitch.tv/login');
        }

        /** Logs out of Twitch.tv */
        LogOut(): void {

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
        private CheckAuthentication(): void {

            /** Get the webview element. */
            var element = $('#login webview');

            /** Do nothing if the page is blank. */
            if (element.attr('src') === 'about:blank') return;

            if (element.attr('src') === 'https://secure.twitch.tv/login')
                this.Visibility(true, true);

            /** Redirect to the token page. */
            if (element.attr('src') === 'http://www.twitch.tv/') {
                if (this._isAuthenticated)
                    this.Navigate('about:blank', false, false);
                else
                    /** Redirect to retrieve token. */
                    this.Navigate('https://api.twitch.tv/api/viewer/token', false);
            }

            /** Only check if we are on the token page. */
            else if (element.attr('src').indexOf('https://api.twitch.tv/api/viewer/token') === 0) {

                this._webview.executeScript({
                    /** Get the body text. */
                    code: '(function () { return document.body.innerText; })();'
                }, (data: any) => {

                        /** Update the authentication status. */
                        this._isAuthenticated = data[0].indexOf(':error=>') === -1;

                        if (this._isAuthenticated) {

                            /** Hide the webview. */
                            this.Navigate('about:blank', false, false);

                            /** Update the token. */
                            this._token = JSON.parse(data[0]).token;

                            /** Get the users name. */
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
                        else
                            /** Log the user in. */
                            this.LogIn();
                    });
            }
        }
    }
}
