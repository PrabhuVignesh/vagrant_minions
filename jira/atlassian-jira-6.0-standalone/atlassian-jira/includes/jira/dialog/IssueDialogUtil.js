/**
 * @namespace JIRA.Dialogs
 */
JIRA.Dialogs = {};


JIRA.Dialogs.getDefaultAjaxOptions = function () {

    var $focusRow = JIRA.IssueNavigator.get$focusedRow();
    var linkIssueURI = this.options.url || this.getRequestUrlFromTrigger();


    if (/id=\{0\}/.test(linkIssueURI)) {
        if (!$focusRow.length) {
            return false;
        } else {
            linkIssueURI = linkIssueURI.replace(/(id=\{0\})/, "id=" + $focusRow.attr("rel"));
        }
    }

    if (JIRA.IssueNavigator.isNavigator()) {
        var result = /[?&]id=([0-9]+)/.exec(linkIssueURI);
        this.issueId = result && result.length == 2 ? result[1] : null;
        if(this.issueId !== $focusRow.attr("rel")) {
            //if the issue id doesn't match the focused row's issue id then reassign focus and get the
            //issuekey from the newly focused row! This can happen when clicking the pencil for the
            //labels picker.
            JIRA.IssueNavigator.Shortcuts.focusRow(this.issueId);
            $focusRow = JIRA.IssueNavigator.get$focusedRow();
        }
        this.issueKey = JIRA.IssueNavigator.getSelectedIssueKey();
    }

    return {
        data: {decorator: "dialog", inline: "true"},
        url: linkIssueURI
    };
};

/**
 * Used to defer the showing of issue dialogs until all promises are resolved. We use this in kickass to:
 * - Ensure the dialog we are opening is related to the correct issue. If we are j/k ing quickly and open a dialog, we want it to be about the issue we are loading.
 * - Ensuring the dialog we are opening has the correct data. If we are inline editing the summary then open the edit dialog, we want to be sure that the summary has been
 * updated on the server first, otherwise we will be showing stale data in the edit dialog.
 *
 */
JIRA.Dialogs.BeforeShowIssueDialogHandler = function () {
    var deferreds = [];
    return {
        add: function (deferred) {
            deferreds.push(deferred);
            return this;
        },
        execute: function () {
            var invokedDeferreds = [];
            if (deferreds.length === 0) {
                return jQuery.Deferred().resolve();
            } else {
                _.each(deferreds, function (deferred) {
                    invokedDeferreds.push(deferred());
                });
                return jQuery.when.apply(jQuery, invokedDeferreds);
            }
        }
    }
}();

/**
* Stores the current issue id into session storage if the dialogs submits successfully
*/
JIRA.Dialogs.storeCurrentIssueIdOnSucessfulSubmit = function () {
    if (JIRA.IssueNavigator.isNavigator()) {
        JIRA.IssueNavigator.setIssueUpdatedMsg({
            issueMsg: this.options.issueMsg,
            issueId: this.issueId,
            issueKey: this.issueKey
        });
    }
};
