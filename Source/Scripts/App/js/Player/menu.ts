module TwitchPotato {

    export class PlayerMenu {

        private _player: Player;

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


        /** Creates the Qaulity menu items. */
        CreateQualityMenu(): void {

            for (var i = 0; i < Object.keys(Quality).length / 2; i++) {

                var item = $('<div/>')
                    .addClass('item')
                    .attr({
                        action: PlayerActions.Quality,
                        quality: i
                    });

                item.append($('<img/>').
                    attr('src', 'images/quality-{0}.png'.format(Quality[i].toLowerCase())));

                // item.append($('<div/>')
                //     .addClass('text')
                //     .text(Quality[i]));

                if (this._player.Quality() === i)
                    item.addClass('selected');

                this._menu.find('.items').append(item);
            }
        }

        /** Creates the Position menu items. */
        CreatePositionMenu(): void {

            var size = Object.keys(MultiPosition).length / 2;

            var html = $('<')
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

        private ShowMenu(action?: PlayerActions, show = true, fade = true): void {

            clearTimeout(this._menuTimeout);

            this._menu.find('.items').empty();

            if (action !== undefined) {

                switch (action) {

                    case PlayerActions.Quality:
                        this.CreateQualityMenu();
                        break;
                    default:
                        break;
                }
            }

            if (show) {
                if (fade)
                    this._menu.fadeIn();
                else
                    this._menu.show();
            }
            else {
                if (fade)
                    this._menu.fadeOut();
                else
                    this._menu.hide();
            }

            // this._menuTimeout = setTimeout(() => this.ShowMenu(undefined, false, true), 5000);
        }
    }
}
//
//     export enum PipMode {
//         Default,
//         Equal
//     }
//
//     export enum PipPosition {
//         Full,
//         Top,
//         Left,
//         Right,
//         Bottom,
//         Middle,
//         TopLeft,
//         TopRight,
//         BottomLeft,
//         BottomRight
//     }
//
//     export enum ViewMode {
//         Fullscreen,
//         Windowed
//     }
//
//     interface OptionButtonData {
//         id: string;
//         text: string;
//     }
//
//     /** Instance of the PlayerOptionsHandler */
//     export class PlayerOptionsHandler {
//
//         /** The picture in picture mode. */
//         private _pipMode = PipMode.Default;
//
//         /** The default picture in picture mode position. */
//         private _defaultPipModePosition = DefaultPipModePosition.Full;
//
//         /** The equal picture in picture mode position. */
//         private _equalPipModePosition = EqualPipModePosition.TopLeft;
//
//         /** The current view mode. */
//         private _viewMode = ViewMode.Fullscreen;
//
//         /** The current quality mode. */
//         private _quality: Quality;
//
//         /** The current mute status. */
//         private _isMuted = false;
//
//         /** The current chat status. */
//         private _isChatShown = false;
//
//         /** Processes all input for the player options menu. */
//         HandleInput(input: Inputs): boolean {
//             return false;
//         }
//
//         /** Gets the player options JQuery. */
//         private GetOptionsElement(): JQuery {
//             return $('#selector #options');
//         }
//
//         /** Creates the menu buttons. */
//         private CreateMenu(buttons: Array<OptionButtonData>): void {
//
//             var opts = this.GetOptionsElement();
//         }
//
//         /** Updates the menu. */
//         private UpdateMenu(direction: Direction): void { }
//
//         /** Gets the image for the button. */
//         private GetImage(buttonId: string): string {
//
//             switch (buttonId) {
//                 case 'cancel':
//                     return 'cancel.png';
//                 case 'position':
//                     if (this._pipMode === PipMode.Default)
//                         return DefaultPipModePosition[this._defaultPipModePosition] + '.png';
//                     else if (this._pipMode === PipMode.Equal)
//                         return EqualPipModePosition[this._equalPipModePosition] + '.png';
//                 case 'mute':
//                     return (this._isMuted) ? 'mute.png' : 'unmute.png';
//                 case 'quality':
//                     return Quality[this._quality].toLowerCase() + '.png';
//                 case 'viewMode':
//                     return ViewMode[this._viewMode].toLowerCase() + '.png';
//             }
//
//             return '';
//         }
//
//         /** Shows the main options menu. */
//         private ShowMenu(): void {
//
//             var buttons: Array<OptionButtonData> = [
//                 { id: 'position', text: 'Position' },
//                 { id: 'mute', text: 'Toggle Mute' },
//                 { id: 'quality', text: 'Change Quality' },
//                 { id: 'viewMode', text: 'Change View Mode' },
//                 { id: 'cancel', text: 'Cancel' },
//             ];
//
//             this.CreateMenu(buttons);
//         }
//
//         /** Shows the position options menu. */
//         private ShowPositionMenu(): void {
//
//             var buttons: Array<OptionButtonData>;
//
//             if (this._pipMode === PipMode.Default) {
//                 buttons = [
//                     { id: 'top', text: 'Top' },
//                     { id: 'left', text: 'Left' },
//                     { id: 'right', text: 'Right' },
//                     { id: 'bottom', text: 'Bottom' },
//                     { id: 'middle', text: 'Middle' },
//                     { id: 'topLeft', text: 'Top Left' },
//                     { id: 'topRight', text: 'Top Right' },
//                     { id: 'bottomLeft', text: 'Bottom Left' },
//                     { id: 'bottomRight', text: 'Bottom Right' },
//                 ];
//             }
//             else if (this._pipMode === PipMode.Equal) {
//                 buttons = [
//                     { id: 'topLeft', text: 'Top Left' },
//                     { id: 'topRight', text: 'Top Right' },
//                     { id: 'bottomLeft', text: 'Bottom Left' },
//                     { id: 'bottomRight', text: 'Bottom Right' },
//                 ];
//             }
//
//             this.CreateMenu(buttons);
//         }
//
//         /** Shows the mute options menu. */
//         private ShowMuteOptions(): void { }
//
//         /** Shows the quality options menu. */
//         private ShowQualityOptions(): void { }
//
//         /** Shoes the view mode options menu. */
//         private ShowViewModeOptions(): void { }
//
//     }
// }
