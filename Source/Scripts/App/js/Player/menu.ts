module TwitchPotato {

    export class PlayerMenu {

        private _player: Player;
        private _isShown = false;

        private _sources: Array<string>

        private _highlight: JQuery;
        private _hlTimeout: number;

        private _notification: JQuery;
        private _ntTimeout: number;

        private _menu: JQuery;
        private _menuTimeout: number;

        constructor(player: Player) {

            this._player = player;

            this.CreateHighlight();
            this.CreateNotification;
            this.CreateMenu();
        }

        HandleInput(input: Inputs): boolean {

            if (!this._isShown) return false;

            switch (input) {

                case Inputs.Left:
                    this.UpdateSelection(Direction.Left);
                    return true;

                case Inputs.Right:
                    this.UpdateSelection(Direction.Right);
                    return true;

                case Inputs.Select:
                    this.SelectItem();
                    return true;

                case Inputs.ContextMenu:
                    this.ShowMenu(undefined, false, true)
                    return true;

                default:
                    return false;
            }
        }

        /** Gets if the menu is shown. */
        IsShown(): boolean { return this._isShown; }

        /** Highlights the selected player. */
        Highlight(showOrHide: boolean): void {

            clearTimeout(this._hlTimeout);

            if (showOrHide) {
                this._highlight.fadeIn();
                setTimeout(() => this._highlight.fadeOut(), 2500);
            }
            else
                this._highlight.fadeOut();
        }

        /** Creates the highlight element. */
        private CreateHighlight(): void {

            if (this._player.Container().find('.highlight').length !== 0) return;

            var highlight = $('<div/>').addClass('highlight');

            this._player.Container().append(highlight).hide();

            this._highlight = this._player.Container().find('.highlight');
        }

        /** Displays the notification. */
        Notify(): void { }

        /** Creates the notification element. */
        private CreateNotification(): void {

            if (this._player.Container().find('.notification').length !== 0) return;

            var notification = $('<div/>').addClass('notification');

            this._player.Container().append(notification).hide();

            this._notification = this._player.Container().find('.notification');
        }

        /** Shows the player menu. */
        ShowMenu(action?: PlayerActions, show = true, fade = true): void {

            this._menu.find('.items').empty();

            if (action !== undefined) {

                switch (action) {

                    case -1:
                        this.ShowMainMenu();
                        break;

                    case PlayerActions.Quality:
                        this.ShowQualityMenu();
                        break;

                    default:
                        break;
                }
            }

            if (!fade)
                this._menu.toggle(show);
            else {
                if (show)
                    this._menu.fadeIn();
                else
                    this._menu.fadeOut();
            }

            this._isShown = show;

            this.ResetTimeout();
        }

        /** Creates the Main menu item.s */
        private ShowMainMenu(): void {

            this.AddMenuItem(PlayerActions.Position, -1, -1, 'fullscreen');
            this.AddMenuItem(PlayerActions.Mute, -1, 0, 'fullscreen');
            this.AddMenuItem(PlayerActions.Quality, -1, 0, 'fullscreen');
            this.AddMenuItem(PlayerActions.ViewMode, -1, 0, 'fullscreen');
            this.AddMenuItem(PlayerActions.Chat, -1, 0, 'fullscreen');
            this.AddMenuItem(PlayerActions.Layout, -1, 0, 'fullscreen');
            this.AddMenuItem(-1, -1, 0, 'fullscreen');
        }

        /** Creates the Quality menu items. */
        private ShowQualityMenu(): void {

            for (var i = 0; i < Object.keys(Quality).length / 2; i++) {
                this.AddMenuItem(
                    PlayerActions.Quality,
                    i,
                    this._player.Quality(),
                    Quality[i]);
            }
        }

        /** Creates the Position menu items. */
        private ShowPositionMenu(): void {

            var positions: Array<MultiPosition>;

            if (this._player.MultiLayout() === MultiLayout.Equal) {
                positions.push(MultiPosition.TopLeft);
                positions.push(MultiPosition.TopRight);
                positions.push(MultiPosition.BottomLeft);
                positions.push(MultiPosition.BottomRight);
            }
            else if (this._player.MultiLayout() === MultiLayout.Default) {
                positions.push(MultiPosition.TopLeft);
                positions.push(MultiPosition.Top);
                positions.push(MultiPosition.TopRight);
                positions.push(MultiPosition.Left);
                positions.push(MultiPosition.Middle);
                positions.push(MultiPosition.Right);
                positions.push(MultiPosition.BottomLeft);
                positions.push(MultiPosition.Bottom);
                positions.push(MultiPosition.BottomRight);
            }

            for (var i = 0; i < positions.length; i++) {
                this.AddMenuItem(
                    PlayerActions.Position,
                    i,
                    this._player.Position(),
                    MultiPosition[i]);
            }
        }

        /** Creates the menu element. */
        private CreateMenu(): void {

            var menu = $('<div/>')
                .addClass('menu')
                .append($('<div/>')
                    .addClass('items'))

            this._player.Container().append(menu).hide();

            this._menu = this._player.Container().find('.menu');
        }

        /** Adds an item to the menu. */
        private AddMenuItem(action: PlayerActions, value: number, selected: number, image: string): void {

            var item = $('<div/>')
                .addClass('item')
                .attr({
                    action: action,
                    value: value
                });

            item.append($('<img/>').
                attr('src', 'images/{0}.png'
                    .format(image.toLowerCase())));

            if (selected === value) item.addClass('selected');

            this._menu.find('.items').append(item);
        }

        /** Updates the selected menu item. */
        private UpdateSelection(direction: Direction): void {

            var index = this._menu
                .find('.item')
                .index(this._menu
                    .find('.item.selected'));

            if (index === - 1) index = 0;

            if (direction === Direction.Left) index--;
            else if (direction === Direction.Right) index++;

            var numItems = this._menu.find('.item').length;

            if (index < 0)
                index = numItems - 1;
            else if (index > numItems - 1)
                index = 0;

            this._menu
                .find('.item.selected')
                .removeClass('selected');

            this._menu
                .find('.item')
                .eq(index)
                .addClass('selected');

            this.ResetTimeout();
        }

        /** Selects the menu item. */
        private SelectItem(): void {
            console.log(this._menu.find('.item.selected')[0]);
        }

        /** Resets the menu timeout. */
        private ResetTimeout(): void {

            clearTimeout(this._menuTimeout);

            this._menuTimeout = setTimeout(() => this.ShowMenu(undefined, false, true), 5000);
        }
    }
}
