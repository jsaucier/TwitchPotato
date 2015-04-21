module TwitchPotato {
    export class StorageHandler {

        /** The storage settings. */
        private _settings: IStorage = { fontSize: 100, hidden: [], users: [] };

        /** Default settings. */
        private _defaults: IStorage = { fontSize: 100, hidden: [], users: [] };

        /** Gets, adds, or removes users. */
        Users(user?: string, remove?: boolean, callback?: (settings: IStorage) => void): Array<string> {

            /** Gets whether the users list has changed and needs to be saved. */
            var save = false;

            /** Handle removing of the user. */
            if (user !== undefined &&
                remove === true &&
                this._settings.users.indexOf(user) !== -1) {

                /** Remove the user from the users list. */
                this._settings.users.splice(this._settings.users.indexOf(user), 1);
                /** Save the users list. */
                save = true;
            }
            /** Handle adding of the user. */
            else if (user !== undefined &&
                remove !== true &&
                this._settings.users.indexOf(user) === -1) {

                /** Add the user to the users list. */
                this._settings.users.push(user);
                /** Save the users list. */
                save = true;
            }

            /** Save the user list if it has been updated. */
            if (save) this.Save(callback);

            return this._settings.users;
        }

        /** Gets or sets the font size setting. */
        FontSize(fontSize?: number, callback?: (settings: IStorage) => void): number {

            /** Set the font size value. */
            if (fontSize !== undefined) {

                /** Set the new font size. */
                this._settings.fontSize = fontSize;
                /** Save the font size. */
                this.Save(callback);
            }

            /** Return the font size value. */
            return this._settings.fontSize;
        }

        /** Hide a game. */
        HideGame(game: string, hide?: boolean, callback?: (settings: IStorage) => void): void {

            /** The index of the game in the hidden array. */
            var index = this._settings.hidden.indexOf(game.toLowerCase())

            if (hide === undefined)
                /** Determine if we need to show or hide the game. */
                hide = (index === -1) ? true : false;

            if (hide === true)
                /** Add the game to the hidden array. */
                this._settings.hidden.push(game.toLowerCase());
            else
                /** Remove the game from the hidden array. */
                this._settings.hidden.splice(index, 1);

            this.Save(callback);
        }

        /** Gets whether the game is hidden. */
        IsGameHidden(game: string): boolean {
            return (this._settings.hidden.indexOf(game.toLowerCase()) !== -1)
        }

        /** Loads the settings. */
        Load(callback?: (settings: IStorage) => void, defaults?: boolean): void {

            if (defaults === true) {
                /** Load the defaults. */
                this._settings = this._defaults;

                /** Save the settings. */
                this.Save(callback);
            }
            else {
                /** Load the settings from storage. */
                chrome.storage.local.get(null, (store) => {

                    /** Set the default value. */
                    this._settings = <IStorage>$.extend(
                        true,
                        this._settings,
                        this._defaults,
                        store.settings);

                    /** Fire the callback. */
                    if (typeof (callback) === 'function')
                        callback(this._settings);
                });
            }
        }

        /** Saves the settings. */
        Save(callback?: (settings: IStorage) => void): void {

            chrome.storage.local.set({
                settings: this._settings
            }, () => {
                    if (typeof (callback) === 'function')
                        callback(this._settings);
                });
        }

        /** Clears the storage. */
        private ClearStorage(callback?: (settings: IStorage) => void): void {

            chrome.storage.local.clear(() => {
                chrome.storage.sync.clear(() => {
                    App.ShowMessage('The settings have been reset to defaults.')
                    this.Save(callback);
                });
            });
        }
    }
}
