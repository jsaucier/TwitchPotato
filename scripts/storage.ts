module TwitchPotato {
    export class StorageHandler {
        /** The storage settings. */
        private settings: StorageData;

        /** Default settings. */
        private defaults: StorageData = {
            zoom: 100,
            hidden: [],
            users: []
        }

        /** Gets the stored users. */
        GetUsers(): string[] {
            return this.settings.users;
        }

        /** Adds the users to the storage. */
        AddUser(user: string): boolean {
            /** Ensure the user isn't already added. */
            if (this.settings.users.indexOf(user) !== -1) return false;

            this.settings.users.push(user);

            this.Save();

            return true;
        }

        /** Removes the user from the storage. */
        RemoveUser(user: string): void {
            this.settings.users.splice(
                this.settings.users.indexOf(user), 1);

            this.Save();
        }

        /** Set the zoom level. */
        SetZoom(zoom: number): void {
            this.settings.zoom = zoom;

            this.Save();
        }

        /** Get the zoom level. */
        GetZoom(): number {
            return this.settings.zoom;
        }

        /** Hide a game. */
        HideGame(game: string, hide?: boolean): void {

            /** The index of the game in the hidden array. */
            var index = this.settings.hidden.indexOf(game.toLowerCase())

            if (hide === undefined)
                /** Determine if we need to show or hide the game. */
                hide = (index === -1) ? true : false;

            if (hide === true)
                /** Add the game to the hidden array. */
                this.settings.hidden.push(game.toLowerCase());
            else
                /** Remove the game from the hidden array. */
                this.settings.hidden.splice(index, 1);

            this.Save();
        }

        /** Gets whether the game is hidden. */
        IsGameHidden(game: string): boolean {
            return (this.settings.hidden.indexOf(game.toLowerCase()) !== -1)
        }

        /** Loads the settings. */
        Load(callback?: EmptyCallback): void {
            chrome.storage.local.get(null, (store) => {
                /** Set the default value. */
                this.settings = <StorageData>$.extend(true, store.settings, this.defaults);

                /** Fire the callback. */
                if (typeof (callback) === 'function')
                    callback();
            });
        }

        /** Loads the default settings. */
        LoadDefaults(callback?: EmptyCallback): void {
            this.settings = this.defaults;

            this.ClearStorage(callback);
        }

        /** Savaes the settings. */
        Save(callback?: EmptyCallback): void {
            chrome.storage.local.set({
                settings: this.settings
            }, callback);
        }

        /** Clears the storage. */
        private ClearStorage(callback?: EmptyCallback): void {
            chrome.storage.local.clear(() => {
                chrome.storage.sync.clear(() => {
                    Application.ShowError('The settings have been reset to defaults.')
                    this.Save(callback);
                });
            });
        }
    }
}
