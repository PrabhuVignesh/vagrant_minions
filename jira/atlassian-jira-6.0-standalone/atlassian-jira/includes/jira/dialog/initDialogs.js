
AJS.$(function () {

    JIRA.Dialogs.keyboardShortcuts = new JIRA.FormDialog({
        id: "keyboard-shortcuts-dialog",
        trigger: "#keyshortscuthelp",
        widthClass: "large",
        onContentRefresh: function () {
            var context = this.get$popupContent();
            AJS.$("a.submit-link", context).click(function(e){
                e.preventDefault();
                AJS.$("form", context).submit();
            });
        },
        onSuccessfulSubmit: function() {
            AJS.keyboardShortcutsDisabled = !AJS.keyboardShortcutsDisabled;
        }
    });

    JIRA.Dialogs.deleteIssueLink = new JIRA.FormDialog({
        type: "ajax",
        id: "delete-issue-link-dialog",
        trigger: "#linkingmodule a.icon-delete",
        ajaxOptions: JIRA.Dialogs.getDefaultAjaxOptions,
        isIssueDialog: true
    });

    if (document.getElementById("dashboard")) {

        JIRA.Dialogs.deleteDashboard = new JIRA.FormDialog({
            type: "ajax"
        });

        AJS.$(document).delegate("#delete_dashboard", "click", function(e) {
            e.stopPropagation();
            e.preventDefault();

            JIRA.Dialogs.deleteDashboard.$activeTrigger = AJS.$("#delete_dashboard");
            JIRA.Dialogs.deleteDashboard.init({
                type: "ajax",
                id: "delete-dshboard",
                ajaxOptions: {
                    url: JIRA.Dialogs.deleteDashboard.$activeTrigger.attr("href")
                },
                targetUrl: "input[name=targetUrl]"
            });
            JIRA.Dialogs.deleteDashboard.show();
        });

    } else {

        // Issue-related dialogs should not be active on the dashboard.

        JIRA.Dialogs.linkIssue = JIRA.Dialogs.createLinkIssueDialog("a.issueaction-link-issue");

        JIRA.Dialogs.deleteIssue = new JIRA.FormDialog({
            id: "delete-issue-dialog",
            trigger: "a.issueaction-delete-issue",
            targetUrl: "#delete-issue-return-url",
            ajaxOptions: JIRA.Dialogs.getDefaultAjaxOptions,
            onSuccessfulSubmit : JIRA.Dialogs.storeCurrentIssueIdOnSucessfulSubmit,
            issueMsg : 'thanks_issue_deleted',
            delayShowUntil: JIRA.Dialogs.BeforeShowIssueDialogHandler.execute,
            isIssueDialog: true
        });

        JIRA.Dialogs.cloneIssue = new JIRA.FormDialog({
            id: "clone-issue-dialog",
            trigger: "a.issueaction-clone-issue",
            handleRedirect:true,
            ajaxOptions: JIRA.Dialogs.getDefaultAjaxOptions,
            onSuccessfulSubmit : JIRA.Dialogs.storeCurrentIssueIdOnSucessfulSubmit,
            issueMsg : 'thanks_issue_cloned',
            delayShowUntil: JIRA.Dialogs.BeforeShowIssueDialogHandler.execute,
            isIssueDialog: true
        });

        JIRA.Dialogs.assignIssue = new JIRA.FormDialog({
            id: "assign-dialog",
            trigger: "a.issueaction-assign-issue",
            ajaxOptions: JIRA.Dialogs.getDefaultAjaxOptions,
            onSuccessfulSubmit : JIRA.Dialogs.storeCurrentIssueIdOnSucessfulSubmit,
            issueMsg : 'thanks_issue_assigned',
            delayShowUntil: JIRA.Dialogs.BeforeShowIssueDialogHandler.execute,
            isIssueDialog: true,
            widthClass: "large"
        });

        JIRA.Dialogs.assignIssueToMe = new JIRA.FormDialog({
            id: "assign-dialog",
            trigger: "a.issueaction-assign-to-me",
            ajaxOptions: JIRA.Dialogs.getDefaultAjaxOptions,
            onSuccessfulSubmit : JIRA.Dialogs.storeCurrentIssueIdOnSucessfulSubmit,
            issueMsg : 'thanks_issue_assigned',
            delayShowUntil: JIRA.Dialogs.BeforeShowIssueDialogHandler.execute,
            isIssueDialog: true
        });

        JIRA.Dialogs.logWork = new JIRA.FormDialog({
            id: "log-work-dialog",
            trigger: "a.issueaction-log-work",
            handleRedirect:true,
            ajaxOptions: JIRA.Dialogs.getDefaultAjaxOptions,
            onSuccessfulSubmit : JIRA.Dialogs.storeCurrentIssueIdOnSucessfulSubmit,
            issueMsg : 'thanks_issue_worklogged',
            delayShowUntil: JIRA.Dialogs.BeforeShowIssueDialogHandler.execute,
            isIssueDialog: true,
            widthClass: "large"
        });

        JIRA.Dialogs.attachFile = new JIRA.FormDialog({
            id: "attach-file-dialog",
            trigger: "a.issueaction-attach-file",
            handleRedirect: true,
            ajaxOptions: JIRA.Dialogs.getDefaultAjaxOptions,
            onSuccessfulSubmit : JIRA.Dialogs.storeCurrentIssueIdOnSucessfulSubmit,
            issueMsg : 'thanks_issue_attached',
            isIssueDialog: true,
            widthClass: "large"
        });

        JIRA.Dialogs.attachScreenshot = new JIRA.ScreenshotDialog({
            id: "attach-screenshot-window",
            trigger: "a.issueaction-attach-screenshot"
        });

        JIRA.Dialogs.manageAttachment = new JIRA.FormDialog({
            id: 'manage-attachment-dialog',
            trigger: '#manage-attachment-link',
            stacked: true,
            reloadOnPop: true,
            isIssueDialog: true,
            widthClass: "large"
        });

        JIRA.Dialogs.comment = new JIRA.FormDialog({
            id: "comment-add-dialog",
            trigger: "a.issueaction-comment-issue:not(.inline-comment)",
            handleRedirect: true,
            ajaxOptions: JIRA.Dialogs.getDefaultAjaxOptions,
            onSuccessfulSubmit : JIRA.Dialogs.storeCurrentIssueIdOnSucessfulSubmit,
            issueMsg : 'thanks_issue_commented',
            isIssueDialog: true,
            widthClass: "large"
        });

        JIRA.Dialogs.editLabels = new JIRA.LabelsDialog({
            id: "edit-labels-dialog",
            trigger: "a.issueaction-edit-labels,a.edit-labels",
            autoClose: true,
            ajaxOptions: JIRA.Dialogs.getDefaultAjaxOptions,
            onSuccessfulSubmit : JIRA.Dialogs.storeCurrentIssueIdOnSucessfulSubmit,
            issueMsg : 'thanks_issue_labelled',
            delayShowUntil: JIRA.Dialogs.BeforeShowIssueDialogHandler.execute,
            labelsProvider: labelsProvider,
            isIssueDialog: true
        });

        JIRA.Dialogs.editComment = new JIRA.FormDialog({
            type: "ajax",
            id: "edit-comment",
            trigger: ".action-links .edit-comment",
            delayShowUntil: JIRA.Dialogs.BeforeShowIssueDialogHandler.execute,
            isIssueDialog: true,
            widthClass: "large"
        }).dirtyFormWarning();

        JIRA.Dialogs.deleteComment = new JIRA.FormDialog({
            type: "ajax",
            id: "delete-comment-dialog",
            trigger: ".action-links [id^='delete_comment']",
            delayShowUntil: JIRA.Dialogs.BeforeShowIssueDialogHandler.execute,
            isIssueDialog: true,
            widthClass: "large"
        }).dirtyFormWarning();

        JIRA.Dialogs.watchIssue = new JIRA.FormDialog({
            ajaxOptions: JIRA.Dialogs.getDefaultAjaxOptions,
            onSuccessfulSubmit : JIRA.Dialogs.storeCurrentIssueIdOnSucessfulSubmit,
            delayShowUntil: JIRA.Dialogs.BeforeShowIssueDialogHandler.execute,
            trigger: ".issueaction-watch-issue",
            isIssueDialog: true
        });

        JIRA.Dialogs.stopWatchingIssue = new JIRA.FormDialog({
            ajaxOptions: JIRA.Dialogs.getDefaultAjaxOptions,
            onSuccessfulSubmit : JIRA.Dialogs.storeCurrentIssueIdOnSucessfulSubmit,
            delayShowUntil: JIRA.Dialogs.BeforeShowIssueDialogHandler.execute,
            trigger: ".issueaction-unwatch-issue",
            isIssueDialog: true
        });

        new JIRA.FormDialog({
            type: "ajax",
            id: "delete-attachment-dialog",
            trigger: "#attachmentmodule .attachment-delete a, #issue-attachments-table a.delete",
            isIssueDialog: true
        });

        // Workflow transition dialogs
        var workflowLinkSelector = "a.issueaction-workflow-transition";
        AJS.$(document).delegate(workflowLinkSelector, "click", function(event) {
            event.preventDefault();
            var link = AJS.$(event.target).closest(workflowLinkSelector);
            var action = parseUri(link.attr('href')).queryKey.action;
            if (action) {
                var id = "workflow-transition-" + action + "-dialog";
                var $trigger = AJS.$(this);
                if (!JIRA.Dialogs[id]) {
                    // we don't pass "url" below as it would break JIRA.Dialogs.getDefaultAjaxOptions which has to
                    // get URL dynamically from triggering DOM element (<a>)
                    JIRA.Dialogs[id] = new JIRA.FormDialog({
                        id: id,
                        // Action might be in the middle or in the end of 'href' attribute.
                        // In practice only one of these should be invoked.
                        trigger: [
                            'a[href*="action=' + action + '&"].issueaction-workflow-transition',
                            'a[href$="action=' + action + '"].issueaction-workflow-transition'
                        ],
                        widthClass: "large",
                        handleRedirect: true,
                        ajaxOptions: JIRA.Dialogs.getDefaultAjaxOptions,
                        onSuccessfulSubmit : JIRA.Dialogs.storeCurrentIssueIdOnSucessfulSubmit,
                        delayShowUntil: JIRA.Dialogs.BeforeShowIssueDialogHandler.execute,
                        issueMsg : 'thanks_issue_transitioned',
                        onContentRefresh: function () {
                            // initialise AJS tabs for the workflow dialogs
                            AJS.tabs.setup();
                        },
                        isIssueDialog: true
                    });
                    JIRA.Dialogs[id].$activeTrigger = $trigger; // that's necessary for the first run only
                    // as later on AJS will set it when triggered automatically
                    JIRA.Dialogs[id].show();
                }
            }
        });

        // Dialogs should only show up if there's an issue to work on!
        AJS.$.each(JIRA.Dialogs, function (name, dialog) {
            if (dialog instanceof JIRA.Dialog) {
                AJS.$(dialog).bind("beforeShow", function () {
                    // For all issue-related dialogs, check if we have a valid issue to work on!
                    if (name !== "keyboardShortcuts") {
                        return JIRA.IssueNavigator.isRowSelected() || JIRA.Issue.getIssueId() !== undefined;
                    }
                });
            }
        });
    }

    new JIRA.FormDialog({
        id: "credits-dialog",
        trigger: "#view_credits",
        widthClass: "creditsContainer",
        onContentRefresh: function () {
            if (!jQuery("html").hasClass("safari")){
                function center () {
                    jQuery.each(arguments, function () {
                        this.show()
                                .css({
                                    marginLeft: -this.outerWidth() / 2,
                                    marginTop: -this.outerHeight() / 2
                                })
                                .hide();
                    });
                }
            }
        }
    });

    new JIRA.FormDialog({
        id: "about-dialog",
        trigger: "#view_about",
        ajaxOptions: {
            url: this.href,
            data: {
                decorator: "dialog",
                inline: "true"
            }
        },
        widthClass: "large"
    });

    jQuery("a.trigger-dialog").each(function () {
        new JIRA.FormDialog({
            trigger: this,
            id: this.id + "-dialog",
            ajaxOptions: {
                url: this.href,
                data: {
                    decorator: "dialog",
                    inline: "true"
                }
            }
        });
    });

    function labelsProvider(labelsPopup) {
        var $trigger = labelsPopup.$activeTrigger,
            $labelsContainer = $trigger.closest(".labels-wrap"),
            isSubtaskForm = $trigger.parents("#view-subtasks").length !== 0;

        if(isSubtaskForm) {
            //if we clicked the subtask form, only look within the current row for a labels wrap!
            $labelsContainer = $trigger.parents("tr").find(".labels-wrap");
        } else if ($trigger.hasClass("issueaction-edit-labels")) {
            // we clicked the issueaction which should only update the system field labels!
            if (JIRA.IssueNavigator.isNavigator()) {
                $labelsContainer = jQuery("#issuetable tr.issuerow.focused td.labels .labels-wrap");
            } else {
                $labelsContainer = jQuery("#wrap-labels .labels-wrap");
            }
        }

        if($labelsContainer.length > 0) {
            return $labelsContainer;
        }
        return false;
    }
});
