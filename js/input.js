window.Potato = window.Potato || {};

(function(potato, $, chrome, undefined) {

    var Input = function() {

        this.inputs = [];
        this.registered = [];
        this.types = ['keyup', 'keydown'];

    };

    Input.prototype.initializeInputs = function() {

        this.addInput('Global', 'globalExit', 27, 'Exit', 'Exits the application.');
        this.addInput('Global', 'globalZoomIn', 187, 'Zoom In', 'Increases the application zoom level.');
        this.addInput('Global', 'globalZoomOut', 189, 'Zoom Out', 'Decreases the application zoom level.');
        this.addInput('Global', 'globalZoomReset', 48, 'Zoom Reset', 'Resets the application zoom level.');

        this.registerInputs();

    };

    Input.prototype.registerInputs = function() {

        var registerInput = function(id) {

            // Register the keydown event.
            this.registerInput(id, 'keydown', function() {
                this.onInput(id, 'keydown');
            }.bind(this));

            // Register the keyup event.
            this.registerInput(id, 'keyup', function() {
                this.onInput(id, 'keyup');
            }.bind(this));

        }.bind(this);

        // Unregister all inputs.
        this.unregisterAllInput();

        // Get the inputs associated with the guide.
        var inputs = this.getInputsBySection('Global');

        // Register all of the guide inputs.
        for (var i in inputs) {
            registerInput(inputs[i].id);
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

    Input.prototype.getInputsBySection = function(section) {

        var inputs = [];

        for (var i in this.inputs) {
            var input = this.inputs[i];

            if (input.section === section) {
                inputs.push(input);
            }
        }

        return inputs;
    };

    Input.prototype.getInput = function(section, id) {

        for (var i in this.inputs) {
            var input = this.inputs[i];

            if (input.section === section &&
                input.id === id) {
                return input;
            }
        }

        return undefined;

    };

    Input.prototype.addInput = function(section, id, keyCode, name, desc, forceRemove) {

        var input = this.getInput(section, id);

        if (input !== undefined) {
            if (forceRemove === true) {
                this.removeInput(section, id);
            } else {
                console.error('Input must be removed before it can be redadded [id: {0}, type: {1}].'.format(input.id, type));
                return;
            }
        }

        this.inputs.push({
            section: section,
            id: id,
            keyCode: keyCode,
            name: name,
            desc: desc
        });

    };

    Input.prototype.removeInput = function(section, id) {

        var index = -1;

        for (var i in this.inputs) {
            var input = this.input[i];

            if (input.section === section &&
                input.id === id) {
                index = i;
                break;
            }
        }

        if (index !== -1) {
            this.input.splice(index, 1);
        }

    };

    Input.prototype.unregisterInput = function(id, type) {

        var index = -1;

        for (var i in this.registered) {
            var registered = this.registered[i];

            if (registered.id === id &&
                registered.type === type) {
                index = i;
                break;
            }
        }

        if (index !== -1) {
            this.registered.splice(index, 1);
        }

    };

    Input.prototype.unregisterAllInput = function() {

        this.registered = [];

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

    Input.prototype.onInput = function(event) {
        console.log(event.keyCode);
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
        console.log('Input Loaded');

        input.initializeInputs();

        $(document).keydown(input.onInput.bind(input));
        $(document).keyup(input.onInput.bind(input));
    });

    potato.input = input;
}(window.Potato, window.jQuery, window.chrome));

/*$(document).keyup(function(event) {
    var key = event.keyCode;

    if (key === me.keys.up ||
        key === me.keys.down ||
        key === me.keys.left ||
        key === me.keys.right) {
        if (me.timers.info !== null) {
            // Clear the timeout
            clearTimeout(me.timers.info);
            // Update immediately
            me.updateInfo();
        }
    }
});*/

/*

keys: {
    up: 38,
    down: 40,
    left: 37,
    right: 39,
    select: 13, // enter
    popup: 80, // p
    reload: 82, // r
    refresh: 84, // t
    stop: 81, // q
    flashback: 70, // f
    toggleLists: 66, // b
    exit: 88, // x
    resolution: 72, // h
    zoomIn: 187, // +
    zoomOut: 189, // -
    zoomReset: 48, // 0
    enterFullscreen: 79, // o
    exitFullscreen: 73, // i
    escape: 27 // esc
},

        handleKeyPress: function(event) {
            // Handle webview
            if ($('#login').is(':visible')) {
                switch (event.keyCode) {
                    case me.keys.escape:
                        $('#login webview').attr('src', 'about:blank');
                        $('#login').fadeOut();
                        event.stopPropagation();
                        return event.preventDefault();
                    default:
                        return;
                }
            }

            // Check to see if an input box is focused.
            var input = $('input:focus');

            if (input.length !== 0) {
                return me.handleInputKeyPress(event.keyCode, input);
            }

            // Handle global keypresses here.
            switch (event.keyCode) {
                case me.keys.escape:
                    return window.close();
                case me.keys.exit:
                    return window.close();
                case me.keys.reload:
                    return window.location.reload(false);
                case me.keys.stop:
                    return me.stopChannel();
                case me.keys.zoomIn:
                    return me.zoom('in');
                case me.keys.zoomOut:
                    return me.zoom('out');
                case me.keys.zoomReset:
                    return me.zoom('normal');
                default:
                    console.log('KeyCode: ' + event.keyCode);
                    break;
            }

            var popupClosed = false;

            if ($('.popup').is(':visible')) {
                popupClosed = me.handlePopupKeyPress(event.keyCode);
            }

            if (popupClosed === false) {
                if ($('#content').is(':visible')) {
                    me.handleListKeyPress(event.keyCode);
                } else if ($('#player').is(':visible')) {
                    me.handlePlayerKeyPress(event.keyCode);
                }
            }
        },

        handleListKeyPress: function(key) {
            switch (key) {
                case me.keys.select:
                    me.openMenuItem();
                    break;
                case me.keys.left:
                    me.updateMenu('left', 200);
                    break;
                case me.keys.up:
                    me.updateMenu('up', 200);
                    break;
                case me.keys.right:
                    me.updateMenu('right', 200);
                    break;
                case me.keys.down:
                    me.updateMenu('down', 200);
                    break;
                case me.keys.toggleLists:
                    if ($('#player').is(':visible')) {
                        $('#content').fadeOut();
                    }
                    break;
                case me.keys.refresh:
                    me.updateAll();
                    break;
                case me.keys.popup:
                    me.showPopup();
                    break;
                default:
                    break;
            }
        },

        handlePlayerKeyPress: function(key) {
            switch (key) {
                case me.keys.select:
                    me.fullscreen('toggle');
                    break;
                case me.keys.enterFullscreen:
                    me.fullscreen('enter');
                    break;
                case me.keys.exitFullscreen:
                    me.fullscreen('exit');
                    break;
                case me.keys.flashback:
                    if (me.flashback !== null) {
                        me.playChannel(me.flashback);
                    }
                    break;
                case me.keys.left:
                    me.updateChat('left');
                    break;
                case me.keys.right:
                    me.updateChat('right');
                    break;
                case me.keys.toggleLists:
                    $('#content').fadeTo('fast', 0.99);

                    me.updateMenu();

                    break;
                case me.keys.resolution:
                    //$.ajax({url: 'http://localhost:80/test.html?openResolution'.format(x, y)});
                    break;
                default:
                    break;
            }
        },

        handlePopupKeyPress: function(key) {
            switch (key) {
                case me.keys.up:
                    me.updatePopupButton('up');
                    break;
                case me.keys.down:
                    me.updatePopupButton('down');
                    break;
                case me.keys.select:
                    me.openPopupButton();
                    break;
                case me.keys.popup:
                    $('.popup').remove();
                    break;
                default:
                    $('.popup').remove();
                    return true;
            }
        },

        handleInputKeyPress: function(key, input) {
            switch (key) {
                case me.keys.select:
                    if (input.length !== 0) {
                        // Remove the whitespace from the input
                        var value = $.trim(input.val());

                        // Remove the focus if there is no input.
                        if (value === '') {
                            input.blur();

                            return;
                        }

                        switch (input.attr('id')) {
                            case 'import':
                                me.importChannels(value);
                                break;
                            case 'follow-channel':
                                me.follow('channel', value);
                                break;
                            case 'follow-game':
                                me.follow('game', value);
                                break;
                            default:
                                break;
                        }
                    }

                    // Clear the input.
                    input.val('');

                    // Clear the input focus.
                    input.blur();

                    break;
                default:
                    break;
            }
        }

        */