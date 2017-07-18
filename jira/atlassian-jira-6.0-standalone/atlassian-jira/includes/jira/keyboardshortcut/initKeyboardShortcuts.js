AJS.whenIType.fromJSON = function(json) {
    var activeShortcuts;
    if (json) {
        activeShortcuts = {};
        // Blur field when ESC key is pressed.
        jQuery(document).bind("aui:keyup", function(event) {
            var $target = jQuery(event.target);
            if (event.key === "Esc" && $target.is(":input:not(button[type='button'])")) {
                // Fire beforeBlurInput event to give inputs a chance to prevent blurring
                var beforeBlurInput = new jQuery.Event("beforeBlurInput");
                AJS.$(event.target).trigger(beforeBlurInput, [{
                    reason: "escPressed"
                }]);
                if (!beforeBlurInput.isDefaultPrevented()) {
                    $target.blur();
                }
            }
        });

        jQuery.each(json, function() {
            // Flatten this.keys array.
            var keys = Function.prototype.call.apply(Array.prototype.concat, this.keys);
            var shortcut = keys.join("");
            if (keys.length < shortcut.length) {
                throw new Error("Shortcut sequence [" + keys.join(",") + "] contains invalid keys");
            }
            var kbShorctut = activeShortcuts[shortcut] = AJS.whenIType(shortcut, this.context);
            kbShorctut[this.op](this.param);
        });
    }
    return activeShortcuts;
};

jQuery(function() {
    // AJS.keys is defined by the keyboard-shortcut plugin.
    if (AJS.keys) {
        AJS.activeShortcuts = AJS.whenIType.fromJSON(AJS.keys.shortcuts);
    }
});
