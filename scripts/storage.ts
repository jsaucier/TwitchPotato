module TwitchPotato {
    export class StorageHandler {
        /** The storage settings. */
        private settings: StorageData;

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

        /** Loads the settings. */
        Load(callback?: EmptyCallback): void {
            chrome.storage.local.get(null, (store) => {
                /** Set the default value. */
                if ($.isEmptyObject(store) === true)
                    this.LoadDefaults(callback);
                else
                    /** Set the settings. */
                    this.settings = store.settings;

                /** Fire the callback. */
                if (typeof (callback) === 'function')
                    callback();
            });
        }

        /** Loads the default settings. */
        LoadDefaults(callback?: EmptyCallback): void {
            this.settings = {
                zoom: 100,
                users: []
            };

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
