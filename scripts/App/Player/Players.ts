module TwitchPotato {

    export class Players {

        private _players: { [id: number]: Player } = {};
        private _layout: PlayerLayout = PlayerLayout.Full;
        private _previousMode: PlayerLayout;
        private _multiLayout = MultiLayout.Default;
        private _selectionTimeout: number;

        constructor() {
        }

        HandleInput(input: Inputs): boolean {
            return false;
        }

        /** Gets whether a player is playing. */
        IsPlaying(): boolean {

            for (var i in this._players) {

                if (this._players[i].State() === PlayerState.Playing)
                    return true;
            }

            return false;
        }

        /** Gets the player by the given number. */
        GetByNumber(num: number): Player {

            for (var i in this._players) {

                if (this._players[i].Number() === num)
                    return this._players[i];
            }

            return undefined;
        }

        /** Gets the selected or first player. */
        GetSelected(): Player {

            var num = parseInt($('#players .player.selected').attr('number')) || 0;

            return this.GetByNumber(num);
        }

        /** Plays the channel or video. */
        Play(id: string, isVideo = false, multi = false): void {

            var player = this.GetByNumber(0);

            if (multi || player === undefined)
                player = this.Add(id, isVideo);
            else
                player.Load(id, isVideo);

            this.PlayerMode(true, PlayerLayout.Full);

            this.MultiLayout();

            App.Guide.Toggle(false, true);
        }

        /** Add a new player. */
        Add(id: string, isVideo: boolean): Player {

            var num = Object.keys(this._players).length;

            /** Only allow four players open at once. */
            if (num >= 4) return undefined;

            var player = new Player(num, id, isVideo);

            this._players[num] = player;

            return player;
        }

        /** Removes the selected player. */
        Remove(): void {

            this.ClearSelected();

            var removed = this.GetSelected().Number();

            this.GetSelected().Remove();
            delete this._players[removed];

            for (var i in this._players) {

                var player = this._players[i];
                var num = player.Number();

                if (num > removed) {

                    num--;
                    player.Number(num);

                    this._players[num] = player;
                    delete this._players[num + 1];
                }
            }
        }

        /** Updates the player mode. */
        PlayerMode(fadeIn: boolean, layout?: PlayerLayout): void {

            if (layout === undefined)
                layout = this._previousMode;

            if (layout === PlayerLayout.Guide)
                this._previousMode = this._layout;

            var lo = PlayerLayout[layout];

            if (this._layout === layout) {

                if ($('#players').attr('mode') === lo) {

                    if (fadeIn === true)
                        $('#players').fadeIn();
                    else
                        $('#players').show();

                    return;
                }
            }

            if (fadeIn === true)
                $('#players').hide().attr('mode', lo).fadeIn();
            else
                $('#players').hide().attr('mode', lo).show();

            this._layout = layout;
        }

        /** Sets the multi layout for the players. */
        MultiLayout(layout?: MultiLayout): void {

            if (layout !== undefined) this._multiLayout = layout;

            var multi = MultiLayout[this._multiLayout];

            if (Object.keys(this._players).length === 1)
                multi = 'Default';

            $('#players .player, #players .selector').each(function() {
                if ($(this).attr('multi') !== multi)
                    $(this).hide()
                        .attr('multi', multi)
                        .fadeIn();
            })
        }

        /** Updates the selected player. */
        private UpdateSelector(direction: Direction): void {

            this.ClearSelected();

            var num = parseInt($('#players .player.selected').attr('number')) || 0;

            if (direction === Direction.Up) num--;
            else if (direction === Direction.Down) num++;

            var numPlayers = $('#players .player').length;

            if (num < 0)
                num = numPlayers - 1;
            else if (num > numPlayers - 1)
                num = 0;

            $('#players .player[number="' + num + '"]').addClass('selected');

            $('#players .selector').attr('number', num);

            clearTimeout(this._selectionTimeout);

            this._selectionTimeout = setTimeout(this.ClearSelected, 5000);
        }

        /** Clears the selected player. */
        private ClearSelected(): void {

            $('#players .player').removeClass('selected');
            $('#players .selector').removeAttr('number');
        }
    }
}
