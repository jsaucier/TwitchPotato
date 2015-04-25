module TwitchPotato {

    export class TimerHandler {

        /** The update timer timeout id. */
        private _updateTimeout: number;

        /** The refresh timer timeout id. */
        private _refreshTimeout: number;

        constructor() {

            $(() => {
                this.Update();
            });
        }

        /** Updates the current date and time. */
        Update(): void {

            /** Set the current time. */
            $('#time .current').text(new Date().toLocaleTimeString());

            /** Clear the timeout. */
            clearTimeout(this._updateTimeout);

            /** Create a new timeout. */
            this._updateTimeout = setTimeout(() => this.Update(), 1000);
        }

        /** Updates the refreshed time. */
        Refresh(): void {

            /** The current time and date. */
            var date = new Date();

            /** Set the last refresh time. */
            $('#time .updated').text('{0} - {1}'.format(
                date.toLocaleDateString(),
                date.toLocaleTimeString()));

            /** Clear the timeout. */
            clearTimeout(this._refreshTimeout);

            /** Create a new timeout. */
            this._refreshTimeout = setTimeout(() => this.Refresh(), 1000 * 60);
        }

    }
}
