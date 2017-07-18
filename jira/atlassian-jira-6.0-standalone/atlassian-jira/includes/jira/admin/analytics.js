/**
 * Capture some events that better explain how people use JIRA administration in general.
 */
AJS.toInit(function ($) {
    var activeTab = $("meta[name='admin.active.tab']").attr("content"),
        activeSection = $("meta[name='admin.active.section']").attr("content"),
        projectKey = $("meta[name='projectKey']").attr("content"),
        contextPath = ((typeof AJS.contextPath === "function") ? AJS.contextPath() : contextPath) || "",
        inProject = activeSection === "atl.jira.proj.config";

    /**
     * Convenience to create and return an object that represents a navigation action in administration.
     *
     * @param type    a unique name to represent the specific kind of navigation action used
     * @param opts    an object containing any particular properties of relevance for this navigation type.
     */
    function adminNavEvent(type, opts) {
        return adminEvent("navigate", type, opts);
    }

    /**
     * Convenience to create and return an object that represents a workflow action in project context.
     *
     * @param type    a unique name to represent the specific kind of navigation action used
     * @param opts    an object containing any particular properties of relevance for this navigation type.
     */
    function adminProjectWorkflowEvent(type, opts) {
        return adminEvent("projectconfig.workflow", type, opts);
    }

    /**
     * Convenience to create and return an object that represents a workflow scheme action in project context.
     *
     * @param type    a unique name to represent the specific kind of navigation action used
     * @param opts    an object containing any particular properties of relevance for this navigation type.
     */
    function adminProjectWorkflowSchemeEvent(type, opts) {
        return adminEvent("projectconfig.workflowscheme", type, opts);
    }

    /**
     * Convenience to create and return an object that represents a workflow scheme action in administration.
     *
     * @param type    a unique name to represent the specific kind of navigation action used
     * @param opts    an object containing any particular properties of relevance for this navigation type.
     */
    function adminWorkflowSchemeEvent(type, opts) {
        return adminEvent("administration.workflowscheme", type, opts);
    }

    JIRA.Analytics = {
        pushAnalyticsAdminProjectWorkflowSchemeEvent: function (type, opts) {
            if (AJS.EventQueue) {
                AJS.EventQueue.push(adminProjectWorkflowSchemeEvent(type, opts));
            }
        }
    };

    /**
     * Convenience to create and return an object that represents an administrative action.
     *
     * @param namespace a namespace for the event
     * @param type      a unique name to represent the specific kind of action used
     * @param opts      an object containing any particular properties of relevance for this navigation type.
     */
    function adminEvent(namespace, type, opts) {
        opts = (typeof opts !== "object") ? {} : opts;
        type = type || "unknown";
        var props = jQuery.extend({
            type: type,
            tab: activeTab,
            section: activeSection
        }, opts);
        return { name: "administration." + namespace + "." + type, properties: props };
    }

    /**
     * Remove, anonymize and normalize any sensitive information in a URL for the purposes of
     * collection for statistical analysis.
     */
    function filterUri(href) {
        if (typeof href !== "string") {
            return null;
        }

        var uri = parseUri(href),
            filtered;

        // Remove the protocol, domain and context path from the URL.
        filtered = uri.path.slice(contextPath.length);

        // Remove project keys
        filtered = filtered.replace(/project-config\/(.*?)(\/|$)/, "project-config/PROJECTKEY$2");
        if (projectKey && projectKey.length) {
            filtered = filtered.split(projectKey).join("PROJECTKEY");
        }

        return filtered;
    }

    function isDraftScheme() {
        return !!$(".status-draft").length;
    }

    if (AJS.EventQueue) {
        // Capture clicks on project summary "more" links
        $(document).on("click", ".project-config-more-link", function () {
            var el = $(this);
            AJS.EventQueue.push(adminNavEvent("morelink", {
                href: filterUri(el.attr("href")),
                title: el.attr("title")
            }));
        });

        // Capture clicks on the navigation sidebar tabs
        JIRA.Page.relatedContentElement().on("click", "a", function() {
            var el = $(this);
            AJS.EventQueue.push(adminNavEvent("tabs", {
                href: filterUri(el.attr("href")),
                title: el.text()
            }));
        });

        // Capture clicks on a project header (even if it wouldnt"t do anything)
        // we wonder if people think it"ll take them back to hte summary page
        $(document).on("click", "#project-config-header-name", function () {
            AJS.EventQueue.push(adminNavEvent("projectheader"));
        });

        // Capture clicks on a project avatar (even if it wouldn"t do anything)
        $(document).on("click", "#project-config-header-avatar", function () {
            AJS.EventQueue.push(adminNavEvent("projectavatar"));
        });

        // Capture clicks on the "back to project: X" back-links on some configuration pages.
        $(document).on("click", ".back-to-proj-config", function () {
            AJS.EventQueue.push(adminNavEvent("backtoproject", {
                href: filterUri($(this).attr("href"))
            }));
        });

        // Capture clicks on selected scheme links
        $(".project-config-summary-scheme a").click(function () {
            AJS.EventQueue.push(adminNavEvent("selectedscheme", {
                href: filterUri($(this).attr("href"))
            }));
        });

        $(document).on("click", ".project-config-workflow-text-link", function () {
            AJS.EventQueue.push(adminProjectWorkflowEvent("viewastext"));
        });

        $(document).on("click", ".project-config-screen", function () {
            AJS.EventQueue.push(adminProjectWorkflowEvent("gotoscreen"));
        });

        if (activeTab === "view_project_workflows") {
            AJS.EventQueue.push(adminProjectWorkflowEvent("loadworkflowstab", {
                referrer: filterUri(document.referrer)
            }));
        }

        $(document).on("click", ".project-config-workflow-edit", function () {
            if ($(this).closest(".project-config-workflow-default").length) {
                AJS.EventQueue.push(adminProjectWorkflowEvent("copyworkflow"));
            } else {
                AJS.EventQueue.push(adminProjectWorkflowEvent("editworkflow"));
            }
        });

        $(document).on("click", ".project-config-workflow-diagram-container", function () {
            AJS.EventQueue.push(adminProjectWorkflowEvent("enlargeworkflow"));
        });

        $(document).on("click", "#project-config-workflows-view-original", function () {
            AJS.EventQueue.push(adminProjectWorkflowSchemeEvent("vieworiginalofdraft"));
        });

        $(document).on("click", "#project-config-workflows-view-draft", function () {
            AJS.EventQueue.push(adminProjectWorkflowSchemeEvent("viewdraft"));
        });

        $(document).on("click", "#project-config-workflows-scheme-change", function () {
            AJS.EventQueue.push(adminProjectWorkflowSchemeEvent("switchscheme"));
        });

        $(document).on("click", "#project_import_link_lnk", function () {
            AJS.EventQueue.push(adminNavEvent("topnav.jim"));
        });

        JIRA.bind("addworkflow", function () {
            if (isDraftScheme()) {
                AJS.EventQueue.push(adminWorkflowSchemeEvent("addworkflowtodraft"));
            }
        });

        JIRA.bind("assignissuetypes", function () {
            if (isDraftScheme()) {
                AJS.EventQueue.push(adminWorkflowSchemeEvent("assignissuetypestodraft"));
            }
        });

        $(document).on("click", ".remove-all-issue-types", function () {
            if (isDraftScheme()) {
                AJS.EventQueue.push(adminWorkflowSchemeEvent("deleteworkflowfromdraft"));
            }
        });

        $(document).on("click", "#discard-draft-dialog input[type=submit]", function () {
            if (inProject) {
                AJS.EventQueue.push(adminProjectWorkflowSchemeEvent("discarddraft"));
            } else {
                AJS.EventQueue.push(adminWorkflowSchemeEvent("discarddraft"));
            }
        });

        $(document).on("click", "#view-original", function () {
            AJS.EventQueue.push(adminWorkflowSchemeEvent("vieworiginalofdraft"));
        });

        $(document).on("click", "#view-draft", function () {
            AJS.EventQueue.push(adminWorkflowSchemeEvent("viewdraft"));
        });

        $(document).on("click", "#publish-draft", function () {
            AJS.EventQueue.push(adminWorkflowSchemeEvent("publishclicked"));
        });

        if (!inProject && parseUri(location).anchor === "draftMigrationSuccess") {
            AJS.EventQueue.push(adminWorkflowSchemeEvent("migrationcompleted"));
        }

        JIRA.bind("draftcreated", function () {
            if (inProject) {
                AJS.EventQueue.push(adminProjectWorkflowSchemeEvent("draftcreated"));
            } else {
                AJS.EventQueue.push(adminWorkflowSchemeEvent("draftcreated"));
            }
        });

    } // if (AJS.EventQueue)
});
