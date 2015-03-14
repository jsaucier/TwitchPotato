(function(potato, $, chrome, undefined) {

    var Guide = function() {};

    Guide.prototype.initializeInputs = function() {

        potato.input.addInput('Guide', 'guideUp', 38, 'Scroll Up', 'Scrolls up the guide items.');
        potato.input.addInput('Guide', 'guideDown', 40, 'Scroll Down', 'Scrolls down the guide items.');
        potato.input.addInput('Guide', 'guideLeft', 37, 'Move Up', 'Moves up the guide list.');
        potato.input.addInput('Guide', 'guideRight', 39, 'Move Down', 'Moves down the guide list.');
        potato.input.addInput('Guide', 'guidePageUp', 33, 'Jump Up', 'Jumps up the guide items.');
        potato.input.addInput('Guide', 'guidePageDown', 33, 'Jump Down', 'Jumps down the guide items.');
        potato.input.addInput('Guide', 'guideSelect', 13, 'Select Item', 'Selects the current guide item.');
        potato.input.addInput('Guide', 'guideRefresh', 82, 'Refresh Guide', 'Refreshes the guide.');
        potato.input.addInput('Guide', 'guideToggle', 71, 'Toggle Guide', 'Toggles the guide.');
        potato.input.addInput('Guide', 'guideMenu', 80, 'Guide Menu', 'Displays the guide context menu.');

        this.registerInputs();

    };

    Guide.prototype.registerInputs = function() {

        var registerInput = function(id) {

            // Register the keydown event.
            potato.input.registerInput(id, 'keydown', function() {
                this.onInput(id, 'keydown');
            }.bind(this));

            // Register the keyup event.
            potato.input.registerInput(id, 'keyup', function() {
                this.onInput(id, 'keyup');
            }.bind(this));

        }.bind(this);

        // Unregister all inputs.
        potato.input.unregisterAllInput();

        // Reregister the global inputs.
        potato.input.registerInputs();

        // Get the inputs associated with the guide.
        var inputs = potato.input.getInputsBySection('Guide');

        // Register all of the guide inputs.
        for (var i in inputs) {
            registerInput(inputs[i].id);
        }

    };

    Guide.prototype.onInput = function(id, type) {

        var input = potato.input.getRegisteredInput(id, type);

        if (input !== undefined) {
            console.log(input);
        }

    };

    Guide.prototype.show = function() {
        this.registerInput();

        $('#guide').fadeIn();
    };


    var guide = new Guide(potato);

    $(function() {
        guide.initializeInputs();

        console.log('Guide Loaded');
    });

    potato.guide = guide;

}(window.Potato, window.jQuery, window.chrome));