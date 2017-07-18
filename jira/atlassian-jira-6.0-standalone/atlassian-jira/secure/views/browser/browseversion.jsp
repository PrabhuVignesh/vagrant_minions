<%@ taglib uri="webwork" prefix="ww" %>
<%@ taglib uri="webwork" prefix="ui" %>
<%@ taglib prefix="jira" uri="jiratags" %>
<%@ page import="com.atlassian.jira.ComponentManager" %>
<%@ page import="com.atlassian.plugin.webresource.WebResourceManager" %>

<ww:bean id="projectDescriptionRenderer" name="'com.atlassian.jira.web.bean.ProjectDescriptionRendererBean'"/>

<html>
<head>
    <title><ww:property value="/project/name" />: <ww:property value="/version/name" /></title>
    <content tag="section">browse_link</content>
    <%
        // Plugins 2.5 allows us to perform context-based resource inclusion. This defines the context "browse.version"
        WebResourceManager webResourceManager = ComponentManager.getInstance().getWebResourceManager();
        webResourceManager.requireResourcesForContext("jira.browse");
        webResourceManager.requireResourcesForContext("jira.browse.version");
    %>
    <script type="text/javascript">window.dhtmlHistory.create();</script>
</head>
<body>
    <ui:soy moduleKey="'jira.webresources:soy-templates'" template="'JIRA.Templates.Headers.pageHeader'">
        <ww:if test="/project/avatar != null">
            <ui:param name="'imageContent'">
                <ui:soy moduleKey="'jira.webresources:soy-templates'" template="'JIRA.Templates.Headers.projectAvatar'">
                    <ui:param name="'projectName'" value="/project/name"/>
                    <ui:param name="'projectKey'" value="/project/key"/>
                    <ui:param name="'avatarAlt'"><ww:property value="./name"/></ui:param>
                    <ui:param name="'avatarUrl'"><ww:url value="'/secure/projectavatar'" atltoken="false"><ww:param name="'pid'" value="/project/id" /><ww:param name="'avatarId'" value="/project/avatar/id" /><ww:param name="'size'" value="'large'" /></ww:url></ui:param>
                    <ui:param name="'isSystemAvatar'" value="/project/avatar/systemAvatar"/>
                    <jira:feature-check featureKey="rotp.project.shortcuts">
                        <ui:param name="'hasProjectShortcut'" value="true"/>
                    </jira:feature-check>
                </ui:soy>
<%--
            <jira:feature-check featureKey="rotp.project.shortcuts">
                <div class="project-shortcut-dialog-trigger" data-key="<ww:property value="./key"/>" data-name="<ww:property value="./name"/>" data-entity-type="jira.project">
            </jira:feature-check>
                    <img id="project-avatar" alt="<ww:property value="./name"/>" class="project-avatar-48" height="48" src="<ww:url value="'/secure/projectavatar'" atltoken="false"><ww:param name="'pid'" value="./id" /><ww:param name="'avatarId'" value="./avatar/id" /><ww:param name="'size'" value="'large'" /></ww:url>" width="48" />
            <jira:feature-check featureKey="rotp.project.shortcuts">
                </div>
            </jira:feature-check>
--%>
            </ui:param>
        </ww:if>
        <ui:param name="'mainContent'">
            <ol class="aui-nav aui-nav-breadcrumbs">
                <li><a href="<ww:url value="'/browse/' + /project/key + '#selectedTab=com.atlassian.jira.plugin.system.project:summary-panel'" atltoken="false" />" title="<ww:property value="text('browsecomponent.back.to.desc', /browseProjectTabLabel, /project/name)" />"><ww:property value="/project/name" /></a></li>
            </ol>
            <h1><ww:property value="/version/name" /></h1>
        </ui:param>
        <ui:param name="'actionsContent'">
            <ul class="aui-nav aui-nav-pagination">
                <ww:property value="/nextAndPreviousVersions">
                    <ww:if test="./previous">
                        <li class="aui-nav-previous">
                            <a title="<ww:text name="'browseversion.browse.previous'"/>" href="<ww:url value="'/browse/' + /project/key + '/fixforversion/' + ./previous/id" atltoken="false" />"><span><ww:property value="./previous/name"/></span></a>
                        </li>
                    </ww:if>
                    <li class="aui-nav-current">
                        <span><ww:property value="/version/name"/></span>
                    </li>
                    <ww:if test="./next">
                        <li class="aui-nav-next" >
                            <a title="<ww:text name="'browseversion.browse.next'"/>" href="<ww:url value="'/browse/' + /project/key + '/fixforversion/' + ./next/id" atltoken="false" />"><span><ww:property value="./next/name"/></span></a>
                        </li>
                    </ww:if>
                </ww:property>
            </ul>
        </ui:param>
    </ui:soy>

    <ui:soy moduleKey="'com.atlassian.auiplugin:aui-experimental-soy-templates'" template="'aui.page.pagePanel'">
        <ui:param name="'content'">
            <ui:soy moduleKey="'com.atlassian.auiplugin:aui-experimental-soy-templates'" template="'aui.page.pagePanelNav'">
                <ui:param name="'content'">
                    <ul class="vertical tabs">
                        <ww:iterator value="/versionTabPanels" status="'status'">
                            <li class="<ww:if test="/selected == completeKey">active</ww:if> <ww:if test="@status/first == true"> first</ww:if>">
                                <a id="<ww:if test="./completeKey/startsWith('com.atlassian.jira.plugin.system.')"><ww:property value="./key"/></ww:if><ww:else><ww:property value="./completeKey"/></ww:else>-panel" class="browse-tab" href="<ww:url value="'/browse/' + /project/key + '/fixforversion/' + /version/id" atltoken="false"><ww:param name="'selectedTab'" value="completeKey"/></ww:url>"><strong><ww:property value="label" /></strong></a>
                            </li>
                        </ww:iterator>
                    </ul>
                </ui:param>
            </ui:soy>
            <ui:soy moduleKey="'com.atlassian.auiplugin:aui-experimental-soy-templates'" template="'aui.page.pagePanelContent'">
                <ui:param name="'id'">project-tab</ui:param>
                <ui:param name="'extraAttributes'">data-project-key="<ww:property value="/project/key" />"</ui:param>
                <ui:param name="'content'">
                    <ww:property value="/tabHtml" escape="false" />
                </ui:param>
            </ui:soy>
        </ui:param>
    </ui:soy>

<fieldset class="hidden parameters">
    <input type="hidden" id="project-key" value="<ww:property value="/project/key"/>"/>
    <input type="hidden" id="version-id" value="<ww:property value="/version/id"/>"/>
</fieldset>

</body>
</html>
