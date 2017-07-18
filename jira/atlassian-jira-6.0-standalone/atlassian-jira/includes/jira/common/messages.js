/**
 * A place for all generic messages to live */
jQuery.namespace("JIRA.Messages");

/**
 * An enum specifying the different AUI message types and their renderers. @see messages.soy
 */
JIRA.Messages.Types = {
    WARNING: JIRA.Templates.warningMsg,
    ERROR: JIRA.Templates.errorMsg,
    SUCCESS: JIRA.Templates.successMsg
};

// Default number of seconds before a message is automatically dismissed.
JIRA.Messages.DefaultTimeout = 10;

/**
 * Builds an AUI message of specified type
 *
 * @param {String} msg - HTML of message
 * @param {JIRA.Messages.Types} type - AUI message type (error, warning, success)
 * @param {Boolean} closeable - Whether the message is dismissable by a close button
 * @param {Number} timeout - Number of seconds before the message automatically fades out. Default timeout is 10s, to
 * have no timeout, use -1.
 *
 * @return jQuery
 */
JIRA.Messages.buildMsg = function (msg, options) {

    options = options || {};

    // type is a soy template (JIRA.Messages.Types)
    var html = options.type({
        msg: msg,
        closeable: options.closeable
    });
    var $container = jQuery('<div>').html(html);
    var timeout = options.timeout != null ? options.timeout : JIRA.Messages.DefaultTimeout;
    var timer;

    if (options.closeable) {
        $container.find(".icon-close").click(function (e) {
            e.preventDefault();
            if (timer != null) window.clearTimeout(timer);
            $container.remove();
        });
    }

    if (timeout > 0) {
        timer = window.setTimeout(function () {
            $container.fadeOut(function () {
                $container.remove();
            });
        }, timeout * 1000);
    }

    return $container;
};

/**
 * Shows a global message, centered underneath the header.
 *
 * Note: only one global message can be shown at a time. You will need to remove the previous to replace it.
 *
 * @param {String} msg - HTML of message
 * @param {JIRA.Messages.Types} type - AUI message type (error, warning, success)
 * @param {Object} options - config
 *
 * @return jQuery
 */
JIRA.Messages.showMsg = function (msg, options) {

    options = options || {};

    var $container,
        top;

    jQuery(".global-msg").remove();

    if (!options.type) {
        console.warn("JIRA.Messages.showMsg: Message not shown, invalid type.");
        return jQuery();
    }

    $container = JIRA.Messages.buildMsg(msg, options);
    top = 20;

    $container
        .addClass("global-msg")
        .appendTo("body")
        .css({
            marginLeft: - $container.outerWidth() / 2,
            top: top
        });

    if (options.id) {
        $container.attr("id", options.id);
    }

    return $container;
};


/**
 * Shows a message at specified target
 *
 * @param {String} msg - HTML of message
 * @param {Object} options - config
 *
 * @return jQuery
 */
JIRA.Messages.showMessageAtTarget = function (msg, options) {
    options = options || {};
    var $msg = JIRA.Messages.buildMsg(msg, options);
    return $msg.prependTo(options.target);
};

/**
 * Shows a message after the page has been reloaded or redirected
 *
 * @param {String} msg - HTML of message
 * @param {Object} options - config
 * If not target specified will be a global message.
 */
JIRA.Messages.showMsgOnReload = function () {

    // Keys we use to store in HTML5 Session Storage
    var SESSION_MSG_KEY = "jira.messages.reloadMessageMsg",
        SESSION_MSG_TYPE_KEY = "jira.messages.reloadMessageType",
        SESSION_MSG_CLOSEABLE_KEY = "jira.messages.reloadMessageCloseable",
        SESSION_MSG_TARGET_KEY = "jira.messages.reloadMessageTarget";


    // Show message if there is any on reload
    jQuery(function () {

        var msg = JIRA.SessionStorage.getItem(SESSION_MSG_KEY),
            type,
            closeable,
            target;

        // if we have a message stored in session storage
        if (msg) {

            // Get all the other message attributes out
            type = JIRA.SessionStorage.getItem(SESSION_MSG_TYPE_KEY);
            closeable = (JIRA.SessionStorage.getItem(SESSION_MSG_CLOSEABLE_KEY) === "true");
            target = JIRA.SessionStorage.getItem(SESSION_MSG_TARGET_KEY);

            // And delete every thing from session storaget so we don't keep showing the message for every page pop
            JIRA.SessionStorage.removeItem(SESSION_MSG_KEY);
            JIRA.SessionStorage.removeItem(SESSION_MSG_TYPE_KEY);
            JIRA.SessionStorage.removeItem(SESSION_MSG_CLOSEABLE_KEY);
            JIRA.SessionStorage.removeItem(SESSION_MSG_TARGET_KEY);

            if (!target || jQuery(target).is(document.body)) {
                // Show a global message.
                JIRA.Messages.showMsg(msg, {
                    type: JIRA.Messages.Types[type],
                    closeable: closeable
                });
            } else {
                JIRA.Messages.showMessageAtTarget(msg, {
                    type: JIRA.Messages.Types[type],
                    closeable: closeable,
                    target: jQuery(target)
                });
            }
        }
    });

    return function (msg, options) {

        // Store message data so we can access it on reload
        JIRA.SessionStorage.setItem(SESSION_MSG_KEY, msg);
        JIRA.SessionStorage.setItem(SESSION_MSG_TYPE_KEY, options.type);
        if (options.closeable) {
            JIRA.SessionStorage.setItem(SESSION_MSG_CLOSEABLE_KEY, options.closeable);
        }
        if (options.target) {
            JIRA.SessionStorage.setItem(SESSION_MSG_TARGET_KEY, options.target);
        }
    };

}();

/**
 * Fades background color in on target element
 *
 * @param target
 * @param options
 */
JIRA.Messages.fadeInBackground  = function (target, options) {

    var $target = jQuery(target);

    options = options || {};

    $target.css("backgroundColor", "#fff").animate({
        backgroundColor: options.backgroundColor || "#ffd"
    });

    window.setTimeout(function () {
        $target.animate({
            backgroundColor: "#fff"
        }, "slow", function () {
            $target.css("backgroundColor", "");
        });
    }, 3000);
};

jQuery.fn.fadeInBackground = function (options) {
    JIRA.Messages.fadeInBackground(this, options)
    return this;
};

/**
 * Fades background color in on target element when page reloads
 */
JIRA.Messages.fadeInBackgroundOnReload = function () {

    var BACKGROUND_COLOR_KEY = "jira.messages.fadeInBackground.color",
        TARGET_KEY = "jira.messages.fadeInBackground.target";

    jQuery(function () {

        var backgroundColor = JIRA.SessionStorage.getItem(BACKGROUND_COLOR_KEY),
            target =  JIRA.SessionStorage.getItem(TARGET_KEY);

        JIRA.SessionStorage.removeItem(BACKGROUND_COLOR_KEY);
        JIRA.SessionStorage.removeItem(TARGET_KEY);

        JIRA.Messages.fadeInBackground(target, {
            backgroundColor: backgroundColor
        })
    });

    return function (target, options) {

        options = options || {};

        var targets = JIRA.SessionStorage.getItem(TARGET_KEY);

        if (targets) {
            targets = targets.split(",");
            targets.push(target);
            targets = targets.join(",");
        } else {
            targets = target;
        }

        JIRA.SessionStorage.setItem(TARGET_KEY, targets);
        JIRA.SessionStorage.setItem(BACKGROUND_COLOR_KEY, "#ffd");
    };
}();

/**
 * Prepends an error message to element
 *
 * jQuery("#mytarget").showErrorMsg("Error <strong>message</strong>", {closeable: true});
 *
 * @param {String} msg - HTML of message
 * @param {Object} options - config
 *
 * @return jQuery
 */
jQuery.fn.showErrorMsg = function (msg, options) {
    options = options || {};
    options.target = this;
    options.type = JIRA.Messages.Types.ERROR;
    return JIRA.Messages.showMessageAtTarget(msg, options);
};

/**
 * Prepends an warning message to element
 *
 * jQuery("#mytarget").showWarningMsg("Warning <strong>message</strong>");
 *
 * @param {String} msg - HTML of message
 * @param {Object} options - config
 *
 * @return jQuery
 */
jQuery.fn.showWarningMsg = function (msg, options) {
    options = options || {};
    options.target = this;
    options.type = JIRA.Messages.Types.WARNING;
    return JIRA.Messages.showMessageAtTarget(msg, options);
};

/**
 * Prepends an success message to element
 *
 * jQuery("#mytarget").showSuccessMsg("Success <strong>message</strong>", {closeable: true});
 *
 * @param {String} msg - HTML of message
 * @param {Object} options - config
 *
 * @return jQuery
 */
jQuery.fn.showSuccessMsg = function (msg, options) {
    options = options || {};
    options.target = this;
    options.type = JIRA.Messages.Types.SUCCESS;
    return JIRA.Messages.showMessageAtTarget(msg, options);
};


/**
 * Shows a global success message
 *
 * @param {String} msg - HTML of message
 * @param {Object} options - config
 *
 * @return jQuery
 */
JIRA.Messages.showSuccessMsg = function (msg, options) {
    options = options || {};
    options.type = JIRA.Messages.Types.SUCCESS;
    return JIRA.Messages.showMsg(msg, options);
};

/**
 * Shows a global warning message
 *
 * @param {String} msg - HTML of message
 * @param {Object} options - config
 *
 * @return jQuery
 */
JIRA.Messages.showWarningMsg = function (msg, options) {
    options = options || {};
    options.type = JIRA.Messages.Types.WARNING;
    return JIRA.Messages.showMsg(msg, options);
};

/**
 * Shows a global error message
 *
 * @param {String} msg - HTML of message
 * @param {Object} options - config
 *
 * @return jQuery
 */
JIRA.Messages.showErrorMsg = function (msg, options) {
    options = options || {};
    options.type = JIRA.Messages.Types.ERROR;
    return JIRA.Messages.showMsg(msg, options);
};

/**
 * Shows a global warning message after the page has been reloaded or redirected
 *
 * @param {String} msg - HTML of message
 * @param {Object} options - config
 *
 * @return jQuery
 */
JIRA.Messages.showReloadWarningMsg = function (msg, options) {
    options = options || {};
    options.type = "WARNING";
    return JIRA.Messages.showMsgOnReload(msg, options);
};

/**
 * Shows a global success message after the page has been reloaded or redirected
 *
 * @param {String} msg - HTML of message
 * @param {Object} options - config
 *
 * @return jQuery
 */
JIRA.Messages.showReloadSuccessMsg = function (msg, options) {
    options = options || {};
    options.type = "SUCCESS";
    return JIRA.Messages.showMsgOnReload(msg, options);
};

/**
 * Shows a global error message after the page has been reloaded or redirected
 *
 * @param {String} msg - HTML of message
 * @param {Object} options - config
 *
 * @return jQuery
 */
JIRA.Messages.showReloadErrorMsg = function (msg, options) {
    options = options || {};
    options.type = "ERROR";
    return JIRA.Messages.showMsgOnReload(msg, options);
};
