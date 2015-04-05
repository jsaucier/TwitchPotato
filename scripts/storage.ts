module TwitchPotato {
    "use strict";

    export class Storage {
        /* An array list of our settings. */
        public settings: StorageData;

        /* Loads the settings. */
        public Load(callback?: Callback): void {
            chrome.storage.local.get(null, (store) => {
                /* Set the default value. */
                if ($.isEmptyObject(store) === true)
                    this.LoadDefaults(callback);
                else
                    /* Set the settings. */
                    this.settings = store.settings;

                /* Call the callback. */
                Application.OnStorageLoaded();
                if (typeof (callback) === 'function')
                    callback();
            });
        }

        /* Loads the default settings. */
        public LoadDefaults(callback?: Callback): void {
            this.settings = {
                zoom: 100,
                users: ['creditx']
            };

            this.ClearStorage(callback);
        }

        /* Clears the storage. */
        private ClearStorage(callback?: Callback): void {
            chrome.storage.local.clear(() => {
                chrome.storage.sync.clear(() => {
                    this.Save(callback);
                });
            });
        }

        /* Savaes the settings. */
        public Save(callback?: Callback): void {
            chrome.storage.local.set({
                settings: this.settings
            }, callback);
        }
    }
}
