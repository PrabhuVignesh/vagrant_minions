(function($) {

    /**
     * Shows a WebSudo dialog that can be used to websudo authenticate a user from JS.
     *
     * @param {Object} options to control the behaviour of the dialog.
     * @param {Object} [options.context] the context for all callbacks.
     * @param {Function} [options.success] a function to be called when the websudo dialog is succesfully submitted.
     *  The first argument passed to the callback is a function that must be called to close the websudo dialog.
     * @param {Function} [options.cancel] a function called when the websudo request has been cancelled.
     */
    JIRA.SmartAjax.showWebSudoDialog = function(options) {
        var context = options.context || this;
        var dialog = new JIRA.FormDialog({
            id: "smart-websudo",
            type: "ajax",
            ajaxOptions: {
                url: contextPath + "/secure/admin/WebSudoAuthenticate!default.jspa?close=true"
            },
            submitHandler: function(e, closeCallback) {
                e.preventDefault();
                var form = $(e.target);
                JIRA.SmartAjax.makeRequest({
                    url: form.attr("action"),
                    data: form.serialize(),
                    type: "POST",
                    complete: function(xhr) {
                        if (xhr.getResponseHeader("X-Atlassian-WebSudo") === "Has-Authentication") {
                            if ($.isFunction(options.success)) {
                                options.success.call(context, function() {
                                    closeCallback();
                                    dialog.hide();
                                });
                            } else {
                                closeCallback();
                                dialog.hide();
                            }
                        } else {
                            dialog._setContent(xhr.responseText, true);
                        }
                    }
                });
            }
        });

        if ($.isFunction(options.cancel)) {
            $(dialog).one("Dialog.hide", function(e, el, reason) {
                //Fire the last websudo failure as the complete reason.
                if (reason == JIRA.Dialog.HIDE_REASON.cancel || reason == JIRA.Dialog.HIDE_REASON.escape) {
                    e = $.Event();
                    (options.cancel.call(context, e) === false || !e.isDefaultPrevented()) && AJS.reloadViaWindowLocation(el.find('.cancel').attr('href'));
                }
            });
        }

        dialog.show();
    };

    JIRA.SmartAjax.handleWebSudoError = function (ajaxOptions, dialogOptions, xhr, statusText, smartAjaxResult) {

        var newOptions = {
            success: function(closeFunction) {
                if (dialogOptions && $.isFunction(dialogOptions.success)) {
                    dialogOptions.success.apply(this, arguments);
                } else {
                    closeFunction();
                }
                //Make the request again. Hopefully working this time.
                JIRA.SmartAjax.makeRequest(ajaxOptions);
            },
            cancel: function() {
                $.isFunction(ajaxOptions.complete) && ajaxOptions.complete.call(this, xhr, statusText, smartAjaxResult);
                dialogOptions && $.isFunction(dialogOptions.cancel) && dialogOptions.cancel.apply(this, arguments);
            },
            context: this
        };

        JIRA.SmartAjax.showWebSudoDialog(newOptions);
    };

    /**
     * This wrapper for JIRA.SmartAjax.makeRequest() to ensure that WebSudo authentication is active for the current user.
     *
     * It will pop up a dialog if necessary to perform the WebSudo login request by posting the WebSudo form to authenticate the user.
     *
     * When the WebSudo authentication is successful, the header X-Atlassian-WebSudo is set to Has-Authentication.
     *
     * WebSudo the WebSudo authentication fails, the responseText is then taken and
     * inserted into the dialog showing the error message.
     *
     * @method makeWebSudoRequest
     * @param {Object} ajaxOptions - the options to control the ajax call
     * @param {Object} dialogOptions - the options to control the WebSudoDialog.
     * @returns {$.Promise} For the result of the ajax operation. NOTE: This is not a jqXHR object because we
     * probably issue multiple requests in the processes of handling this request.
     */
    JIRA.SmartAjax.makeWebSudoRequest = function(ajaxOptions, dialogOptions) {
        var ourAjaxOptions = $.extend({}, ajaxOptions);
        var suppressComplete = false;
        var deferred = $.Deferred();

        var errorHandler = function(xhr, statusText, errorThrown, smartAjaxResult) {
            if (xhr.status === 401 && xhr.responseText.match(/websudo/i)) {
                suppressComplete = true;
                JIRA.SmartAjax.handleWebSudoError(ourAjaxOptions, dialogOptions, xhr, statusText, smartAjaxResult);
            } else {
                deferred.rejectWith(this, arguments);
                $.isFunction(ajaxOptions.error) && ajaxOptions.error.apply(this, arguments);
            }
        };

        var completeHandler = function() {
            !suppressComplete && $.isFunction(ajaxOptions.complete) && ajaxOptions.complete.apply(this, arguments);
            suppressComplete = false;
        };

        var successHandler = function() {
            deferred.resolveWith(this, arguments);
            $.isFunction(ajaxOptions.success) && ajaxOptions.success.apply(this, arguments);
        };

        // use our own handlers that delegate back to the original handlers
        ourAjaxOptions.error = errorHandler;
        ourAjaxOptions.complete = completeHandler;
        ourAjaxOptions.success = successHandler;

        JIRA.SmartAjax.makeRequest(ourAjaxOptions);

        return deferred.promise();
    };
})(AJS.$);
