module TwitchPotato {
    "use strict";

    export interface StorageData {
        users: Array<string>
        zoom: number
    }

    export class Storage {

        /** An array list of our settings. */
        public settings: StorageData;

        constructor() {
            this.Load();
        }

        /** Loads the settings. */
        public Load() {
            chrome.storage.local.get(null, (store) => {
                // Set the default value.
                if ($.isEmptyObject(store) === true)
                    store.settings = this.LoadDefaults(true);

                // Set the settings.
                this.settings = store.settings;

                // Call the callback.
                Application.OnStorageLoaded(store.settings);
            });
        }

        /** Loads the default settings. */
        private LoadDefaults(clearStorage = false): StorageData {
            this.settings = {
                zoom: 100,
                users: ['creditx']
            };

            if (clearStorage)
                this.ClearStorage(() => { this.Save() })

            return this.settings;
        }

        /** Clears the storage. */
        private ClearStorage(callback = () => { }): void {
            chrome.storage.local.clear(function() {
                chrome.storage.sync.clear(function() {
                    callback();
                });
            });
        }

        /** Savaes the settings. */
        public Save(callback = () => { }): void {
            chrome.storage.local.set({
                settings: this.settings
            }, () => callback());
        }
    }
}
