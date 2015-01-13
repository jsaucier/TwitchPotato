chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create('index.html', {
        id: 'main',
        frame: 'none',
        state: 'fullscreen'
    }, function(win) {
        win.fullscreen();
        win.contentWindow.document.addEventListener('keyup', function(e) {
            if (e.keyCode === 27) {
                e.preventDefault();
            }
        });
        win.contentWindow.document.addEventListener('keydown', function(e) {
            if (e.keyCode === 27) {
                e.preventDefault();
            }
        });
    });
});