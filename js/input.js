(function(potato, $, chrome, undefined) {

    var Input = function() {
        this.input = 'Global';

        this.inputs = [];
        this.registered = [];
        this.types = ['keyup', 'keydown'];
    };

    Input.prototype.initializeInputs = function() {

        this.addInput('Global', 'globalExit', 27, 'Exit', 'Exits the application.');
        this.addInput('Global', 'globalGuideToggle', 71, 'Toggle Guide', 'Toggles the guide.');
        this.addInput('Global', 'globalZoomIn', 187, 'Zoom In', 'Increases the application zoom level.');
        this.addInput('Global', 'globalZoomOut', 189, 'Zoom Out', 'Decreases the application zoom level.');
        this.addInput('Global', 'globalZoomReset', 48, 'Zoom Reset', 'Resets the application zoom level.');

        this.addInput('Guide', 'guideUp', 38, 'Scroll Up', 'Scrolls up the guide items.');
        this.addInput('Guide', 'guideDown', 40, 'Scroll Down', 'Scrolls down the guide items.');
        this.addInput('Guide', 'guideLeft', 37, 'Move Up', 'Moves up the guide list.');
        this.addInput('Guide', 'guideRight', 39, 'Move Down', 'Moves down the guide list.');
        this.addInput('Guide', 'guidePageUp', 33, 'Jump Up', 'Jumps up the guide items.');
        this.addInput('Guide', 'guidePageDown', 33, 'Jump Down', 'Jumps down the guide items.');
        this.addInput('Guide', 'guideSelect', 13, 'Select Item', 'Selects the current guide item.');
        this.addInput('Guide', 'guideRefresh', 82, 'Refresh Guide', 'Refreshes the guide.');
        this.addInput('Guide', 'guideMenu', 80, 'Guide Menu', 'Displays the guide context menu.');

        this.addInput('Player', 'playerUp', 38, 'Previous Playing', '');
        this.addInput('Player', 'playerDown', 40, 'Next Playing', '');
        this.addInput('Player', 'playerStop', 83, 'Stop Playing', '');
        this.addInput('Player', 'playerMute', 77, 'Mute Volume', '');
        this.addInput('Player', 'playerFlashback', 70, 'Previous Channel', '');
        this.addInput('Player', 'playerSelect', 13, 'Select Channel', '');
        this.addInput('Player', 'playerFullscreenToggle', 85, 'Toggle Fullscreen', '');
        this.addInput('Player', 'playerFullscreenEnter', 79, 'Enter Fullscreen', '');
        this.addInput('Player', 'playerFullscreenExit', 73, 'Exit Fullscreen', '');

        this.registerInputs(potato.guide);
    };

    Input.prototype.registerInputs = function(binder) {

        var registerInput = function(id, binder) {

            // Register the keydown event.
            this.registerInput(id, 'keydown', function() {
                this.onInput(id, 'keydown');
            }.bind(binder));

            // Register the keyup event.
            this.registerInput(id, 'keyup', function() {
                this.onInput(id, 'keyup');
            }.bind(binder));

        }.bind(this);

        // Unregister all inputs.
        this.registered = [];

        // Get the global inputs
        var inputs = this.getInputsByOwner(this.input);

        // Register all of the global inputs.
        for (var i in inputs) {
            registerInput(inputs[i].id, this);
        }

        if (this.input !== binder.input) {
            // Get the binder inputs
            inputs = this.getInputsByOwner(binder.input);

            // Register all of the binder inputs.
            for (i in inputs) {
                registerInput(inputs[i].id, binder);
            }
        }

    };

    Input.prototype.onInput = function(id, type) {

        var input = this.getRegisteredInput(id, type);

        if (input !== undefined && input.type === 'keyup') {

            switch (input.id) {
                case 'globalExit':
                    if ($('webview:visible').length === 0) {
                        window.close();
                    } else {
                        $('#login').fadeOut();
                        $('#accounts').fadeOut();
                        // Register guide inputs.
                        this.registerInputs(potato.guide);
                    }
                    break;
                case 'globalGuideToggle':
                    potato.toggleGuide();
                    break;
                case 'globalZoomIn':
                    potato.zoom('in');
                    break;
                case 'globalZoomOut':
                    potato.zoom('out');
                    break;
                case 'globalZoomReset':
                    potato.zoom('reset');
                    break;
                default:
                    break;
            }
        }

    };

    Input.prototype.getInputFromKeyCode = function(keyCode) {

        for (var i in this.inputs) {
            var input = this.inputs[i];

            if (input.keyCode === keyCode) {
                return input;
            }
        }

        return undefined;

    };

    Input.prototype.getInputFromId = function(id) {

        for (var i in this.inputs) {
            var input = this.inputs[i];

            if (input.id == id) {
                return input;
            }
        }

        return undefined;

    };

    Input.prototype.getRegisteredInput = function(id, type) {

        for (var i in this.registered) {
            var registered = this.registered[i];

            if (registered.id === id &&
                registered.type === type) {
                return registered;
            }
        }

        return undefined;

    };

    Input.prototype.getInputIds = function() {

        var inputs = [];

        for (var i in this.inputs) {
            inputs.push(this.inputs[i].id);
        }

        return inputs;

    };

    Input.prototype.getInputsByOwner = function(owner) {

        var inputs = [];

        for (var i in this.inputs) {
            var input = this.inputs[i];

            if (input.owner === owner) {
                inputs.push(input);
            }
        }

        return inputs;
    };

    Input.prototype.getInput = function(owner, id) {

        for (var i in this.inputs) {
            var input = this.inputs[i];

            if (input.owner === owner &&
                input.id === id) {
                return input;
            }
        }

        return undefined;

    };

    Input.prototype.addInput = function(owner, id, keyCode, name, desc, forceRemove) {

        var input = this.getInput(owner, id);

        if (input !== undefined) {
            if (forceRemove === true) {
                this.removeInput(name, id);
            } else {
                console.error('Input must be removed before it can be redadded [id: {0}, type: {1}].'.format(input.id, type));
                return;
            }
        }

        this.inputs.push({
            owner: owner,
            id: id,
            keyCode: keyCode,
            name: name,
            desc: desc
        });

    };

    Input.prototype.removeInput = function(owner, id) {

        var index = -1;

        for (var i in this.inputs) {
            var input = this.input[i];

            if (input.owner === owner && input.id === id) {
                index = i;
                break;
            }
        }

        if (index !== -1) {
            this.input.splice(index, 1);
        }

    };

    Input.prototype.unregisterInput = function(id, type) {

        var indexes = [];

        for (var i in this.registered) {
            var registered = this.registered[i];

            if (registered.id === id) {
                if (type !== undefined) {
                    indexes.push(i);
                    if (registered.type === type) {
                        break;
                    }
                }
            }
        }

        for (i in indexes) {
            this.registered.splice(indexes[i], 1);
        }

    };

    Input.prototype.registerInput = function(id, type, callback, forceUnregister) {

        // Get the input by id.
        var input = this.getInputFromId(id);

        // Confirm the input id is valid.
        if (input === undefined) {
            console.error('{0} is not a valid id [{1}].'.format(id, this.getInputIds().join()));
            return;
        }

        // Confirm we are given a valid input.
        if (this.types.indexOf(type) === -1) {
            console.error('{0} is not a valid type [{1}].'.format(type, this.types.join()));
            return;
        }

        // Confirm we have a valid callback.
        if (typeof(callback) !== 'function') {
            console.error('Input.registerInput requires a callback function.');
            return;
        }

        // Confirm that the input isn't already registered.
        if (this.getRegisteredInput(input.id, type) !== undefined) {
            // Force the input to be unregistered first.
            if (forceUnregister === true) {
                this.unregisterInput(id, type);
            } else {
                console.error('Input must be unregistered before it can be reregistered [id: {0}, type: {1}].'.format(input.id, type));
                return;
            }
        }

        this.registered.push({
            id: id,
            type: type,
            keyCode: input.keyCode,
            callback: callback
        });

    };

    Input.prototype.onInputEvent = function(event) {

        // Get the input associated with the keycode.
        var input = this.getInputFromKeyCode(event.keyCode);

        // Check to see if an input for this keycode exists.
        if (input !== undefined) {
            // Get the registered input.
            var registered = this.getRegisteredInput(input.id, event.type);
            // Check to see the registered input exists,
            // and is of the proper input type.
            if (registered !== undefined) {
                // Call our registered callback.
                registered.callback();
            }
        }

    };

    var input = new Input();

    $(function() {
        input.initializeInputs();

        $(document).keydown(input.onInputEvent.bind(input));
        $(document).keyup(input.onInputEvent.bind(input));
    });

    potato.input = input;
}(window.Potato, window.jQuery, window.chrome));