module TwitchPotato {

    export enum PipMode {
        Default,
        Equal
    }

    export enum DefaultPipModePosition {
        Full,
        Top,
        Left,
        Right,
        Bottom,
        Middle,
        TopLeft,
        TopRight,
        BottomLeft,
        BottomRight
    }

    export enum EqualPipModePosition {
        TopLeft,
        TopRight,
        BottomLeft,
        BottomRight
    }

    export enum ViewMode {
        Fullscreen,
        Windowed
    }

    interface OptionButtonData {
        id: string;
        text: string;
    }

    /** Instance of the PlayerOptionsHandler */
    export class PlayerOptionsHandler {

        /** The picture in picture mode. */
        private _pipMode = PipMode.Default;

        /** The default picture in picture mode position. */
        private _defaultPipModePosition = DefaultPipModePosition.Full;

        /** The equal picture in picture mode position. */
        private _equalPipModePosition = EqualPipModePosition.TopLeft;

        /** The current view mode. */
        private _viewMode = ViewMode.Fullscreen;

        /** The current quality mode. */
        private _quality: Quality;

        /** The current mute status. */
        private _isMuted = false;

        /** The current chat status. */
        private _isChatShown = false;

        /** Processes all input for the player options menu. */
        HandleInput(input: Inputs): boolean {
            return false;
        }

        /** Gets the player options JQuery. */
        private GetOptionsElement(): JQuery {
            return $('#selector #options');
        }

        /** Creates the menu buttons. */
        private CreateMenu(buttons: Array<OptionButtonData>): void {

            var opts = this.GetOptionsElement();
        }

        /** Updates the menu. */
        private UpdateMenu(direction: Direction): void { }

        /** Gets the image for the button. */
        private GetImage(buttonId: string): string {

            switch (buttonId) {
                case 'cancel':
                    return 'cancel.png';
                case 'position':
                    if (this._pipMode === PipMode.Default)
                        return DefaultPipModePosition[this._defaultPipModePosition] + '.png';
                    else if (this._pipMode === PipMode.Equal)
                        return EqualPipModePosition[this._equalPipModePosition] + '.png';
                case 'mute':
                    return (this._isMuted) ? 'mute.png' : 'unmute.png';
                case 'quality':
                    return Quality[this._quality].toLowerCase() + '.png';
                case 'viewMode':
                    return ViewMode[this._viewMode].toLowerCase() + '.png';
            }

            return '';
        }

        /** Shows the main options menu. */
        private ShowMenu(): void {

            var buttons: Array<OptionButtonData> = [
                { id: 'position', text: 'Position' },
                { id: 'mute', text: 'Toggle Mute' },
                { id: 'quality', text: 'Change Quality' },
                { id: 'viewMode', text: 'Change View Mode' },
                { id: 'cancel', text: 'Cancel' },
            ];

            this.CreateMenu(buttons);
        }

        /** Shows the position options menu. */
        private ShowPositionMenu(): void {

            var buttons: Array<OptionButtonData>;

            if (this._pipMode === PipMode.Default) {
                buttons = [
                    { id: 'top', text: 'Top' },
                    { id: 'left', text: 'Left' },
                    { id: 'right', text: 'Right' },
                    { id: 'bottom', text: 'Bottom' },
                    { id: 'middle', text: 'Middle' },
                    { id: 'topLeft', text: 'Top Left' },
                    { id: 'topRight', text: 'Top Right' },
                    { id: 'bottomLeft', text: 'Bottom Left' },
                    { id: 'bottomRight', text: 'Bottom Right' },
                ];
            }
            else if (this._pipMode === PipMode.Equal) {
                buttons = [
                    { id: 'topLeft', text: 'Top Left' },
                    { id: 'topRight', text: 'Top Right' },
                    { id: 'bottomLeft', text: 'Bottom Left' },
                    { id: 'bottomRight', text: 'Bottom Right' },
                ];
            }

            this.CreateMenu(buttons);
        }

        /** Shows the mute options menu. */
        private ShowMuteOptions(): void { }

        /** Shows the quality options menu. */
        private ShowQualityOptions(): void { }

        /** Shoes the view mode options menu. */
        private ShowViewModeOptions(): void { }

    }
}
