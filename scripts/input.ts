module TwitchPotato {
    "use strict";

    export enum InputType {
        'Global',
        'Guide',
        'Player'
    }

    export class Input {
        private registered: Dictionary<InputData[]> = {};
        private inputs: Dictionary<InputData> = {};

        constructor() {
            this.AddInput(InputType.Global, 'globalExit', 27, 'Exit');
            this.AddInput(InputType.Global, 'globalGuideToggle', 71, 'Toggle Guide');
            this.AddInput(InputType.Global, 'globalZoomIn', 187, 'Zoom In');
            this.AddInput(InputType.Global, 'globalZoomOut', 189, 'Zoom Out');
            this.AddInput(InputType.Global, 'globalZoomReset', 48, 'Zoom Reset');
            this.AddInput(InputType.Global, 'globalSaveSetting', 13, 'Save Setting');

            this.AddInput(InputType.Guide, 'guideUp', 38, 'Scroll Up');
            this.AddInput(InputType.Guide, 'guideDown', 40, 'Scroll Down');
            this.AddInput(InputType.Guide, 'guideLeft', 37, 'Move Up');
            this.AddInput(InputType.Guide, 'guideRight', 39, 'Move Down');
            this.AddInput(InputType.Guide, 'guidePageUp', 33, 'Jump Up');
            this.AddInput(InputType.Guide, 'guidePageDown', 33, 'Jump Down');
            this.AddInput(InputType.Guide, 'guideSelect', 13, 'Select Item');
            this.AddInput(InputType.Guide, 'guideRefresh', 82, 'Refresh Guide');
            this.AddInput(InputType.Guide, 'guideMenu', 80, 'Guide Menu');

            this.AddInput(InputType.Player, 'playerUp', 38, 'Previous Playing');
            this.AddInput(InputType.Player, 'playerDown', 40, 'Next Playing');
            this.AddInput(InputType.Player, 'playerStop', 83, 'Stop Player');
            this.AddInput(InputType.Player, 'playerPause', 32, 'Pause Player');
            this.AddInput(InputType.Player, 'playerMute', 77, 'Mute Volume');
            this.AddInput(InputType.Player, 'playerFlashback', 70, 'Previous Channel');
            this.AddInput(InputType.Player, 'playerSelect', 13, 'Select Channel');
            this.AddInput(InputType.Player, 'playerLayout', 72, 'Change Layout');
            this.AddInput(InputType.Player, 'playerFullscreenToggle', 85, 'Toggle Fullscreen');
            this.AddInput(InputType.Player, 'playerFullscreenEnter', 79, 'Enter Fullscreen');
            this.AddInput(InputType.Player, 'playerFullscreenExit', 73, 'Exit Fullscreen');

            $(document).keydown((event) => { this.OnInputEvent(event); });
        }

        private AddInput(type: InputType, id: string, code: number, name: string, desc = ''): void {
            this.inputs[id] = {
                id: id,
                type: type,
                code: code,
                name: name,
                desc: desc
            };
        }

        private GetInputsByType(type: InputType): Dictionary<InputData> {
            var inputs: Dictionary<InputData> = {};

            $.each(this.inputs, (id: string, input: InputData) => {
                if (input.type === type) {
                    inputs[id] = input;
                }
            });

            return inputs;
        }

        public RegisterInput(id: string) {
            // Get the input.
            var input = this.inputs[id];

            // Default the array if needed.
            if (this.registered[input.code] === undefined)
                this.registered[input.code] = [];

            // Add the input to the registered list.
            this.registered[input.code].push(input);
        }

        public RegisterInputs(type: InputType): void {
            // Unregister all inputs.
            this.registered = {};

            // Register all of the global inputs.
            for (var id in this.GetInputsByType(InputType.Global))
                this.RegisterInput(id);

            // Register the inputs specified.
            if (type !== InputType.Global)
                for (var id in this.GetInputsByType(type))
                    this.RegisterInput(id);
        }

        private OnInputEvent(event) {
            if (this.registered[event.keyCode] !== undefined) {
                // Iterate all inputs registered to the keycode.
                $.each(this.registered[event.keyCode], (index: number, input: InputData) => {
                    // Get the context based on InputType.
                    var context = (input.type === InputType.Global) ? Application : Application[InputType[input.type]];

                    // Call the registered callback.
                    context['OnInput'].call(context, input);
                });
            }

        }
    }
}
