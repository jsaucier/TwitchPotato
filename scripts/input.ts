module TwitchPotato {

    export enum Inputs {
        Close,
        FontSizeIncrease,
        FontSizeDecrease,
        FontSizeReset,
        SaveSetting,
        ToggleGuide,
        Up,
        Down,
        Left,
        Right,
        PageUp,
        PageDown,
        Select,
        Refresh,
        ContextMenu,
        Stop,
        PlayPause,
        Mute,
        Layout,
        FullscreenEnter,
        FullscreenExit,
        FullscreenToggle,
        Flashback,
        QualityMobile,
        QualityLow,
        QualityMedium,
        QualityHigh,
        QualitySource,
        ToggleChat,
        Reload
    }

    export class InputHandler {
        /** Keycode map array. */
        private _keyLookup = ['', '', '', 'CANCEL', '', '', 'HELP', '', 'BACK_SPACE', 'TAB', '', '', 'CLEAR', 'ENTER', 'RETURN', '', 'SHIFT', 'CONTROL', 'ALT', 'PAUSE', 'CAPS_LOCK', 'KANA', 'EISU', 'JUNJA', 'FINAL', 'HANJA', '', 'ESCAPE', 'CONVERT', 'NONCONVERT', 'ACCEPT', 'MODECHANGE', 'SPACE', 'PAGE_UP', 'PAGE_DOWN', 'END', 'HOME', 'LEFT', 'UP', 'RIGHT', 'DOWN', 'SELECT', 'PRINT', 'EXECUTE', 'PRINTSCREEN', 'INSERT', 'DELETE', '', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'COLON', 'SEMICOLON', 'LESS_THAN', 'EQUALS', 'GREATER_THAN', 'QUESTION_MARK', 'AT', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'WIN', '', 'CONTEXT_MENU', '', 'SLEEP', 'NUMPAD0', 'NUMPAD1', 'NUMPAD2', 'NUMPAD3', 'NUMPAD4', 'NUMPAD5', 'NUMPAD6', 'NUMPAD7', 'NUMPAD8', 'NUMPAD9', 'MULTIPLY', 'ADD', 'SEPARATOR', 'SUBTRACT', 'DECIMAL', 'DIVIDE', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'F13', 'F14', 'F15', 'F16', 'F17', 'F18', 'F19', 'F20', 'F21', 'F22', 'F23', 'F24', '', '', '', '', '', '', '', '', 'NUM_LOCK', 'SCROLL_LOCK', 'WIN_OEM_FJ_JISHO', 'WIN_OEM_FJ_MASSHOU', 'WIN_OEM_FJ_TOUROKU', 'WIN_OEM_FJ_LOYA', 'WIN_OEM_FJ_ROYA', '', '', '', '', '', '', '', '', '', 'CIRCUMFLEX', 'EXCLAMATION', 'DOUBLE_QUOTE', 'HASH', 'DOLLAR', 'PERCENT', 'AMPERSAND', 'UNDERSCORE', 'OPEN_PAREN', 'CLOSE_PAREN', 'ASTERISK', 'PLUS', 'PIPE', 'HYPHEN_MINUS', 'OPEN_CURLY_BRACKET', 'CLOSE_CURLY_BRACKET', 'TILDE', '', '', '', '', 'VOLUME_MUTE', 'VOLUME_DOWN', 'VOLUME_UP', '', '', 'SEMICOLON', 'EQUALS-PLUS', 'COMMA', 'MINUS', 'PERIOD', 'SLASH', 'BACK_QUOTE', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'OPEN_BRACKET', 'BACK_SLASH', 'CLOSE_BRACKET', 'QUOTE', '', 'META', 'ALTGR', '', 'WIN_ICO_HELP', 'WIN_ICO_00', '', 'WIN_ICO_CLEAR', '', '', 'WIN_OEM_RESET', 'WIN_OEM_JUMP', 'WIN_OEM_PA1', 'WIN_OEM_PA2', 'WIN_OEM_PA3', 'WIN_OEM_WSCTRL', 'WIN_OEM_CUSEL', 'WIN_OEM_ATTN', 'WIN_OEM_FINISH', 'WIN_OEM_COPY', 'WIN_OEM_AUTO', 'WIN_OEM_ENLW', 'WIN_OEM_BACKTAB', 'ATTN', 'CRSEL', 'EXSEL', 'EREOF', 'PLAY', 'ZOOM', '', 'PA1', 'WIN_OEM_CLEAR', ''];

        /** Input keycode lookup table. */
        private _inputLookup: { [keyCode: number]: Array<number> } = {};

        /** Input has focus. */
        private _inputFocued = false;

        /** Input settings array. */
        private _inputs: Array<Input> = [
            { name: 'Close', desc: 'Closes the application or current webview.', type: Inputs.Close, key: 'ESCAPE' },
            { name: 'Toggle Guide', desc: 'Toggles the guide.', type: Inputs.ToggleGuide, key: 'G' },
            { name: 'Font Size Increase', desc: 'Increases the application font size.', type: Inputs.FontSizeIncrease, key: 'EQUALS-PLUS' },
            { name: 'Font Size Decrease', desc: 'Decreases the application font size.', type: Inputs.FontSizeDecrease, key: 'MINUS' },
            { name: 'Font Size Reset', desc: 'Toggles the guide.', type: Inputs.FontSizeReset, key: '0' },
            { name: 'Save Setting', desc: 'Saves the new setting value.', type: Inputs.SaveSetting, key: 'ENTER', hidden: true },

            { name: 'Up', desc: 'Guide - Scrolls up the items.<br/>Player - Selects the previous player.', type: Inputs.Up, key: 'UP' },
            { name: 'Down', desc: 'Guide - Scrolls down the items.<br/>Player - Selects the next player.', type: Inputs.Down, key: 'DOWN' },
            { name: 'Left', desc: 'Guide - Scrolls up the menu.<br/>Player - Selects the previous chat layout.', type: Inputs.Left, key: 'LEFT' },
            { name: 'Right', desc: 'Guide - Scrolls down the menu.<br/>Player - Selects the next chat layout', type: Inputs.Right, key: 'RIGHT' },

            { name: 'Jump Up', desc: '', type: Inputs.PageUp, key: 'PAGE_UP' },
            { name: 'Jump Down', desc: '', type: Inputs.PageDown, key: 'PAGE_DOWN' },
            { name: 'Select Item', desc: '', type: Inputs.Select, key: 'ENTER' },
            { name: 'Refresh Guide', desc: '', type: Inputs.Refresh, key: 'R' },
            { name: 'Context Menu', desc: '', type: Inputs.ContextMenu, key: 'P' },

            { name: 'Toggle Chat', desc: '', type: Inputs.ToggleChat, key: 'G' },
            { name: 'Stop Player', desc: '', type: Inputs.Stop, key: 'S' },
            { name: 'Pause Player', desc: '', type: Inputs.PlayPause, key: 'SPACE' },
            { name: 'Mute Volume', desc: '', type: Inputs.Mute, key: 'M' },
            { name: 'Previous Channel', desc: '', type: Inputs.Flashback, key: 'F' },
            { name: 'Select Channel', desc: '', type: Inputs.Select, key: 'ENTER' },
            { name: 'Change Layout', desc: '', type: Inputs.Layout, key: 'H' },
            { name: 'Toggle Fullscreen', desc: '', type: Inputs.FullscreenToggle, key: 'U' },
            { name: 'Enter Fullscreen', desc: '', type: Inputs.FullscreenEnter, key: 'I' },
            { name: 'Exit Fullscreen', desc: '', type: Inputs.FullscreenExit, key: 'O' },
            { name: 'Mobile Resolution', desc: '', type: Inputs.QualityMobile, key: '1' },
            { name: 'Low Resolution', desc: '', type: Inputs.QualityLow, key: '2' },
            { name: 'Medium Resolution', desc: '', type: Inputs.QualityMedium, key: '3' },
            { name: 'High Resolution', desc: '', type: Inputs.QualityHigh, key: '4' },
            { name: 'Source Resolution', desc: '', type: Inputs.QualitySource, key: '5' },
            { name: 'Reload Player', desc: 'Reloads the player completely.', type: Inputs.Reload, key: 'T' }
        ];

        /** Creates a new input handler class. */
        constructor() {

            /** Create the keycode lookup table. */
            for (var i = 0; i < this._inputs.length; i++) {
                /** The current input. */
                var input = this._inputs[i];

                /** The input keycode. */
                var keycode = this._keyLookup.indexOf(input.key);

                /** Initialize the keycode array. */
                if (this._inputLookup[keycode] === undefined)
                    this._inputLookup[keycode] = [];

                /** Add the input to the lookup table. */
                this._inputLookup[keycode].push(i);
            }

            /** Bind to the keydown event. */
            $(document).keydown((event) => this.HandleInput(event));

            $(document).on('focus', 'input', () => this._inputFocued = true);
            $(document).on('blur', 'input', () => this._inputFocued = false);
        }

        /** Handles and routes the input for the application. */
        HandleInput(event): void {

            /** The inputs for the keycode. */
            var inputs = this.GetInputsFromKeyCode(event.keyCode);

            for (var i in inputs) {
                /** The input type. */
                var input = inputs[i].type;

                /** Inputs are disabled when the loading window is shown. */
                if (App.IsLoading())
                    if (input !== Inputs.Close)
                        return;

                /** Only allow the save setting input when an input is focued. */
                if (this._inputFocued)
                    if (input !== Inputs.SaveSetting &&
                        input !== Inputs.Close)
                        return;

                /** Route the input to the modules. */
                if (App.HandleInput(input)) { }
                else if (App.Guide.HandleInput(input)) { }
                else if (App.Player.HandleInput(input)) { }
            }
        }

        /** Gets the inputs for the keycode. */
        private GetInputsFromKeyCode(keyCode: number): Array<Input> {

            /** Array containing the inputs for the keycode. */
            var inputs: Array<Input> = [];

            for (var i in this._inputLookup[keyCode])
                inputs.push(this._inputs[this._inputLookup[keyCode][i]]);

            return inputs;
        }
    }
}
