(function(potato, $, chrome, undefined) {

    var Input = function() {
        this.inputs = [];
        this.registered = [];
        this.types = ['keyup', 'keydown'];

        // Repeat timer.
        this.timer = undefined;
        // Repeat event
        this.lastEvent = undefined;
    };

    Input.prototype.initializeInputs = function() {

        this.addInput('Potato', 'potatoExit', 27, 'Exit', 'Exits the application.');
        this.addInput('Potato', 'potatoGuideToggle', 71, 'Toggle Guide', 'Toggles the guide.');
        this.addInput('Potato', 'potatoZoomIn', 187, 'Zoom In', 'Increases the application zoom level.');
        this.addInput('Potato', 'potatoZoomOut', 189, 'Zoom Out', 'Decreases the application zoom level.');
        this.addInput('Potato', 'potatoZoomReset', 48, 'Zoom Reset', 'Resets the application zoom level.');

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
        this.addInput('Player', 'playerStop', 83, 'Stop Player', '');
        this.addInput('Player', 'playerPause', 32, 'Pause Player', '');
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

        // Get the potato inputs
        var inputs = this.getInputsByOwner('Potato');

        // Register all of the potato inputs.
        for (var i in inputs) {
            registerInput(inputs[i].id, potato);
        }

        if (potato !== binder) {
            // Get the binder inputs
            inputs = this.getInputsByOwner(binder.input);

            // Register all of the binder inputs.
            for (i in inputs) {
                registerInput(inputs[i].id, binder);
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
                console.log(input.id, event.type);
                // Call our registered callback.
                registered.callback();
            }
        }

    };

    var input = new Input();

    $(function() {
        input.initializeInputs();

        $(document).keydown(function(event) {
            // Call the input event.
            input.onInputEvent(event);

            // Store the event.
            input.lastEvent = event;

            // Clear the repeat timer.
            clearInterval(input.timer);

            // Reset the repeat timer.
            input.timer = setInterval(function() {
                console.log('repeat:');
                // Repeat the input event.
                input.onInputEvent(input.lastEvent);
            }, 100);
        });

        $(document).keyup(function(event) {
            // Call the input event.
            input.onInputEvent(event);

            // Clear the repeat timer.
            clearInterval(input.timer);
        });
    });

    potato.input = input;

}(window.Potato, window.jQuery, window.chrome));