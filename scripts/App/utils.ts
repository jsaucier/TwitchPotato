interface String {
    /** Formats the string using the supplied arguments. */
    format(...args: any[]): string;

}

String.prototype.format = function(...args: any[]): string {
    return this.replace(/\{\{|\}\}|\{(\d+)\}/g, (m, n) => {
        if (m == '{{') return '{';
        if (m === "}}") return '}';
        return args[n];
    });
};

interface Number {
    /** Deliminates a number with commas or the supplied character. */
    deliminate(char?: string): string;
    /** Formats seconds to a time string. */
    formatSeconds(): string;
}

Number.prototype.deliminate = function(char = ','): string {
    var str = this + '';
    var x = str.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + char + '$2');
    }

    return x1 + x2;
};

Number.prototype.formatSeconds = function(): string {
    var hours = Math.floor(this / (60 * 60));

    var minDiv = this % (60 * 60);
    var mins = Math.floor(minDiv / 60);

    var secDiv = minDiv % 60;
    var secs = Math.ceil(secDiv);

    return ((hours > 0) ? hours + ':' : '') +
        ((mins < 10) ? '0' + mins : mins) + ':' +
        ((secs < 10) ? '0' + secs : secs)
}

module TwitchPotato {
    export function ConsoleMessage(e: any): void {
        var message = 'webview:{0}:{1}: {2}'.format($(e.target).attr('type'), e.line, e.message);

        if (e.level === 0) console.log(message);
        else if (e.level === 1) console.warn(message);
        else if (e.level === 2) console.info(message);
        else if (e.level === 3) console.debug(message);
        else if (e.level === 4) console.error(message);
        else console.log(message);
    }
}

$.fn.scrollTo = function(target, options, callback) {
    if (typeof options == 'function' && arguments.length == 2) {
        callback = options;
        options = target;
    }
    var settings: any = $.extend({
        scrollTarget: target,
        offsetTop: 50,
        duration: 500,
        easing: 'swing'
    }, options);
    return this.each(function() {
        var scrollPane = $(this);
        var scrollTarget = (typeof settings.scrollTarget == "number") ? settings.scrollTarget : $(settings.scrollTarget);
        var scrollY = (typeof scrollTarget == "number") ? scrollTarget : scrollTarget.offset().top + scrollPane.scrollTop() - parseInt(settings.offsetTop);
        scrollPane.animate({
            scrollTop: scrollY
        }, parseInt(settings.duration), settings.easing, function() {
                if (typeof callback == 'function') {
                    callback.call(this);
                }
            });
    });
};
