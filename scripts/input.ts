module TwitchPotato {
    export class InputHandler {
        private registered: Dictionary<Input[]> = {};
        private inputs: Dictionary<Input> = {};

        constructor() {
            this.AddInput(InputType.Global, Inputs.Global_Exit, 27, 'Exit');
            this.AddInput(InputType.Global, Inputs.Global_ToggleGuide, 71, 'Toggle Guide');
            this.AddInput(InputType.Global, Inputs.Global_ZoomIn, 187, 'Zoom In');
            this.AddInput(InputType.Global, Inputs.Global_ZoomOut, 189, 'Zoom Out');
            this.AddInput(InputType.Global, Inputs.Global_ZoomReset, 48, 'Zoom Reset');
            this.AddInput(InputType.Global, Inputs.Global_SaveSetting, 13, 'Save Setting');

            this.AddInput(InputType.Guide, Inputs.Guide_Up, 38, 'Scroll Up');
            this.AddInput(InputType.Guide, Inputs.Guide_Down, 40, 'Scroll Down');
            this.AddInput(InputType.Guide, Inputs.Guide_Left, 37, 'Move Up');
            this.AddInput(InputType.Guide, Inputs.Guide_Right, 39, 'Move Down');
            this.AddInput(InputType.Guide, Inputs.Guide_PageUp, 33, 'Jump Up');
            this.AddInput(InputType.Guide, Inputs.Guide_PageDown, 34, 'Jump Down');
            this.AddInput(InputType.Guide, Inputs.Guide_Select, 13, 'Select Item');
            this.AddInput(InputType.Guide, Inputs.Guide_Refresh, 82, 'Refresh Guide');
            this.AddInput(InputType.Guide, Inputs.Guide_ContextMenu, 80, 'Context Menu');

            this.AddInput(InputType.Player, Inputs.Player_SelectPrevious, 38, 'Previous Player');
            this.AddInput(InputType.Player, Inputs.Player_SelectNext, 40, 'Next Player');
            this.AddInput(InputType.Player, Inputs.Player_ToggleChat, 67, 'Toggle Chat');
            this.AddInput(InputType.Player, Inputs.Player_ChatLayoutPrevious, 37, 'Previous Chat Layout');
            this.AddInput(InputType.Player, Inputs.Player_ChatLayoutNext, 39, 'Next Chat Layout');
            this.AddInput(InputType.Player, Inputs.Player_Stop, 83, 'Stop Player');
            this.AddInput(InputType.Player, Inputs.Player_PlayPause, 32, 'Pause Player');
            this.AddInput(InputType.Player, Inputs.Player_Mute, 77, 'Mute Volume');
            this.AddInput(InputType.Player, Inputs.Player_Flashback, 70, 'Previous Channel');
            this.AddInput(InputType.Player, Inputs.Player_Select, 13, 'Select Channel');
            this.AddInput(InputType.Player, Inputs.Player_Layout, 72, 'Change Layout');
            this.AddInput(InputType.Player, Inputs.Player_FullscreenToggle, 85, 'Toggle Fullscreen');
            this.AddInput(InputType.Player, Inputs.Player_FullscreenEnter, 79, 'Enter Fullscreen');
            this.AddInput(InputType.Player, Inputs.Player_FullscreenExit, 73, 'Exit Fullscreen');
            this.AddInput(InputType.Player, Inputs.Player_QualityMobile, 49, 'Mobile Resolution');
            this.AddInput(InputType.Player, Inputs.Player_QualityLow, 50, 'Low Resolution');
            this.AddInput(InputType.Player, Inputs.Player_QualityMedium, 51, 'Medium Resolution');
            this.AddInput(InputType.Player, Inputs.Player_QualityHigh, 52, 'High Resolution');
            this.AddInput(InputType.Player, Inputs.Player_QualitySource, 53, 'Source Resolution');

            $(document).keydown((event) => { this.OnInputEvent(event); });
        }

        /** Registers an input for action. */
        RegisterInput(id: string) {
            /** Get the input. */
            var input = this.inputs[id];

            /** Default the array if needed. */
            if (this.registered[input.code] === undefined)
                this.registered[input.code] = [];

            /** Add the input to the registered list. */
            this.registered[input.code].push(input);
        }

        /** Registers all inputs for action for the input type. */
        RegisterInputs(type: InputType): void {
            /** Unregister all inputs. */
            this.registered = {};

            /** Register all of the global inputs. */
            for (var id in this.GetInputsByType(InputType.Global))
                this.RegisterInput(id);

            /** Register the inputs specified. */
            if (type !== InputType.Global)
                for (var id in this.GetInputsByType(type))
                    this.RegisterInput(id);
        }

        /** Creates a new input. */
        private AddInput(type: InputType, input: Inputs, code: number, name: string, desc = ''): void {
            this.inputs[input] = {
                input: input,
                type: type,
                code: code,
                name: name,
                desc: desc
            };
        }

        /** Gets the inputs based on input type. */
        private GetInputsByType(type: InputType): Dictionary<Input> {
            var inputs: Dictionary<Input> = {};

            $.each(this.inputs, (id: string, input: Input) => {
                if (input.type === type) {
                    inputs[id] = input;
                }
            });

            return inputs;
        }

        /** Handles the input events and routes the actions. */
        private OnInputEvent(event) {
            /** Inputs are disabled when the loading window is shown. */
            if (Application.IsLoading()) return;

            if (this.registered[event.keyCode] !== undefined) {
                /** Iterate all inputs registered to the keycode. */
                $.each(this.registered[event.keyCode], (index: number, input: Input) => {
                    /** Get the context based on InputType. */
                    var context = (input.type === InputType.Global) ? Application : Application[InputType[input.type]];

                    /** Call the registered callback. */
                    context['OnInput'].call(context, input);
                });
            }

        }
    }
}
