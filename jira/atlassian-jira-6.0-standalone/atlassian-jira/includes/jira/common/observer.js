/**
 * A common place to aggregate events
 */

(function ($) {

    // If the events namespace is not defined, define it.
    JIRA.Events = JIRA.Events || {};

    JIRA.CONTENT_ADDED_REASON = {
        pageLoad: "pageLoad",
        inlineEditStarted: "inlineEditStarted",
        panelRefreshed: "panelRefreshed",
        criteriaPanelRefreshed: "criteriaPanelRefreshed",
        issueTableRefreshed: "issueTableRefreshed",

        //Fired when on List View, when we update the issue row with new information
        issueTableRowRefreshed: "issueTableRowRefreshed",

        //Fired when the Filters panel is opened
        filterPanelOpened: "filterPanelOpened",

        //Fired when the LayoutSwitcher has been rendered
        layoutSwitcherReady: "layoutSwitcherReady",

        //Fired when the user goes back to the search (JRADEV-18619)
        returnToSearch: "returnToSearch",

        //Fired when the Share dialog is opened
        shareDialogOpened: "shareDialogOpened",

        //Fired when the Search Filters results table has been refreshed
        filtersSearchRefreshed: "filtersSearchRefreshed",

        //Fired when a Tab is updated (eg: Project tabs, Manage Dashboard tabs...)
        tabUpdated: "tabUpdated",

        //Fired when a Dialog is ready to be displayed
        dialogReady: "dialogReady",

        //Fired when the Components table is ready
        componentsTableReady: "componentsTableReady",

        //Fired when a Workflow has been loaded on Project configuration
        workflowReady: "workflowReady",

        //Fired when a Workflow Header has been loaded on Project configuration
        workflowHeaderReady: "workflowHeaderReady"
    };


    /**
     * Binds to many events to publish a single "newContentAdded" event. We use this to bind javascript to dynamically
     * inserted content
     */
    (function () {

        // Export the event name so listeners don't have to
        JIRA.Events.NEW_CONTENT_ADDED = "newContentAdded";
        JIRA.Events.NEW_PAGE_ADDED = "newPageAdded";


         // On dom ready
        $(function() {
            JIRA.trigger(JIRA.Events.NEW_CONTENT_ADDED, [$(document), JIRA.CONTENT_ADDED_REASON.pageLoad]);
            JIRA.trigger(JIRA.Events.NEW_PAGE_ADDED, [$(document)]);
        });

        // When dialog content refreshed
        $(document).bind("dialogContentReady", function(e, dialog) {
            JIRA.trigger(JIRA.Events.NEW_CONTENT_ADDED, [dialog.get$popupContent(), JIRA.CONTENT_ADDED_REASON.dialogReady]);
            JIRA.trigger(JIRA.Events.NEW_PAGE_ADDED, [dialog.get$popupContent()]);
        });

        // When arbitary fragment has been refreshed
        JIRA.bind("contentRefreshed", function(e, context) {
            // This event does not include a reason because it is too generic.
            JIRA.trigger(JIRA.Events.NEW_CONTENT_ADDED, [$(context)]);
        });

    })();


})(AJS.$);