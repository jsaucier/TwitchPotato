module TwitchPotato {

    export interface StorageInterface {
        hidden: Array<string>;
        videoPreview: boolean;
        fontSize: number;
        quality: TwitchPotato.Quality;
    }

    export class StorageHandler {

        /** The storage settings. */
        private _settings: StorageInterface;

        /** Default settings. */
        private _defaults: StorageInterface = {
            fontSize: 100,
            videoPreview: false,
            hidden: [],
            quality: Quality.Medium
        };

        /** Hide a game. */
        HideGame(game: string, hide?: boolean, callback?: (settings: StorageInterface) => void): void {

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

        /** Gets or sets the font size setting. */
        FontSize(fontSize?: number,
            callback?: (settings: StorageInterface) => void): number {
            return this.HandleNumber('fontSize', fontSize, callback);
        }

        /** Gets or sets whether to use a video as a preview. */
        UseVideoPreview(videoPreview?: boolean,
            callback?: (settings: StorageInterface) => void): boolean {
            return this.HandleBoolean('videoPreview', videoPreview, callback);
        }


        /** Gets or sets the default stream quality. */
        Quality(quality?: Quality,
            callback?: (settings: StorageInterface) => void): Quality {

            return this.HandleNumber('quality', quality, callback)
        }

        /** Loads the settings. */
        Load(callback?: (settings: StorageInterface) => void, defaults?: boolean): void {

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
                    this._settings = <StorageInterface>$.extend(
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
        Save(callback?: (settings: StorageInterface) => void): void {

            chrome.storage.local.set({
                settings: this._settings
            }, () => {
                    if (typeof (callback) === 'function')
                        callback(this._settings);
                });
        }

        /** Gets or sets a boolean value. */
        private HandleBoolean(
            setting: string,
            value?: boolean,
            callback?: (settings: StorageInterface) => void): boolean {

            /** Update the boolean value. */
            if (value !== undefined) {

                /** Set the value. */
                this._settings[setting] = value;

                /** Save the settings. */
                this.Save(callback);
            }

            /** Return the value. */
            return this._settings[setting];
        }

        /** Gets or sets a string value. */
        private HandleString(
            setting: string,
            value?: string,
            callback?: (settings: StorageInterface) => void): string {

            /** Update the string value. */
            if (value !== undefined) {

                /** Set the value. */
                this._settings[setting] = value;

                /** Save the settings. */
                this.Save(callback);
            }

            /** Return the value. */
            return this._settings[setting];
        }

        /** Gets or sets a string value. */
        private HandleNumber(
            setting: string,
            value?: number,
            callback?: (settings: StorageInterface) => void): number {

            /** Update the string value. */
            if (value !== undefined) {

                /** Set the value. */
                this._settings[setting] = value;

                /** Save the settings. */
                this.Save(callback);
            }

            /** Return the value. */
            return this._settings[setting];
        }

        /** Clears the storage. */
        private ClearStorage(callback?: (settings: StorageInterface) => void): void {

            chrome.storage.local.clear(() => {
                chrome.storage.sync.clear(() => {
                    App.ShowMessage('The settings have been reset to defaults.')
                    this.Save(callback);
                });
            });
        }
    }
}
