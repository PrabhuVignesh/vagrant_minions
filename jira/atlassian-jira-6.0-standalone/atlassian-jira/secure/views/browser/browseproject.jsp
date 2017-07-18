<%@ taglib uri="webwork" prefix="ww" %>
<%@ taglib uri="webwork" prefix="ui" %>
<%@ taglib prefix="jira" uri="jiratags" %>
<%@ page import="com.atlassian.jira.ComponentManager" %>
<%@ page import="com.atlassian.plugin.webresource.WebResourceManager" %>

<ww:bean id="projectDescriptionRenderer" name="'com.atlassian.jira.web.bean.ProjectDescriptionRendererBean'"/>

<html>
<head>
    <title><ww:property value="/project/name" /></title>
    <content tag="section">browse_link</content>
    <%
        // Plugins 2.5 allows us to perform context-based resource inclusion. This defines the context "browse.project"
        WebResourceManager webResourceManager = ComponentManager.getInstance().getWebResourceManager();
        webResourceManager.requireResourcesForContext("jira.browse");
        webResourceManager.requireResourcesForContext("jira.browse.project");
        webResourceManager.requireResource("com.atlassian.plugins.helptips.jira-help-tips:common");
    %>
    <script type="text/javascript">window.dhtmlHistory.create();</script>
</head>
<body>
    <ui:soy moduleKey="'com.atlassian.auiplugin:aui-experimental-soy-templates'" template="'aui.page.pageHeader'">
        <ui:param name="'content'">
            <ww:if test="/project/avatar != null">
                <ui:soy moduleKey="'com.atlassian.auiplugin:aui-experimental-soy-templates'" template="'aui.page.pageHeaderImage'">
                    <ui:param name="'content'">
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
                </ui:soy>
            </ww:if>
            <ui:soy moduleKey="'com.atlassian.auiplugin:aui-experimental-soy-templates'" template="'aui.page.pageHeaderMain'">
                <ui:param name="'extraClasses'">project-details</ui:param>
                <ui:param name="'content'">
                    <h1><ww:property value="/project/name" /></h1>
                    <ul class="operations-list">
                        <li><span class="list-label"><ww:text name="'common.concepts.key'"/>:</span> <span id="pd-key"><ww:property value="/project/key"/></span></li>
                        <li><span class="list-label"><ww:text name="'common.concepts.lead'"/>:</span> <jira:formatuser userKey="/project/leadUserKey" type="'profileLinkWithAvatar'" id="'project_summary'"/></li>
                        <ww:if test="/project/projectCategoryObject != null"><li><span class="list-label"><ww:text name="'common.concepts.category'"/>:</span> <a href="<ww:url value="'/secure/BrowseProjects.jspa'" atltoken="false"/>#<ww:property value="/project/projectCategoryObject/id"/>"><ww:property value="/project/projectCategoryObject/name"/></a></li></ww:if>
                        <ww:if test="/project/url != null && /project/url/empty == false"><li><span class="list-label"><ww:text name="'common.concepts.url'"/>:</span> <a id="pd-url" href="<ww:property value="/project/url"/>" target="_blank"><ww:property value="/project/url"/></a></li></ww:if>
                    </ul>
                </ui:param>
            </ui:soy>
            <ui:soy moduleKey="'com.atlassian.auiplugin:aui-experimental-soy-templates'" template="'aui.page.pageHeaderActions'">
                <ui:param name="'content'">
                    <ww:property value="/operationLinks" >
                        <ww:if test="./empty == false">
                            <div class="aui-buttons">
                                <ww:iterator value=".">
                                    <ui:soy moduleKey="'com.atlassian.auiplugin:aui-experimental-soy-templates'" template="'aui.buttons.button'">
                                        <ui:param name="'tagName'" value="'a'"/>
                                        <ui:param name="'id'"><ww:property value="./id"/></ui:param>
                                        <ui:param name="'text'"><ww:property value="./label" /></ui:param>
                                        <ui:param name="'extraAttributes'">href="<ww:property value="./url"/>" title="<ww:property value="./title"/>"</ui:param>
                                        <ww:property value="./params/('iconClass')">
                                            <ww:if test=".">
                                                <ui:param name="'iconType'" value="'custom'"/>
                                                <ui:param name="'iconClass'">icon <ww:property value="." /></ui:param>
                                            </ww:if>
                                        </ww:property>
                                    </ui:soy>
                                </ww:iterator>
                            </div>
                        </ww:if>
                    </ww:property>
                </ui:param>
            </ui:soy>
        </ui:param>
    </ui:soy>

    <ww:if test="/adminNavHeaderEnabled == true">
        <ui:soy moduleKey="'com.atlassian.jira.jira-admin-summary-plugin:admin-header-new-nav-soy'" template="'JIRA.Templates.header.admin.adminnavheading'">
            <ui:param name="'adminNavigationPrimary'" value="/adminNavLinks"/>
            <ui:param name="'adminNavigationSecondary'" value="/adminNavLinksSecondary"/>
        </ui:soy>
    </ww:if>
    <ui:soy moduleKey="'com.atlassian.auiplugin:aui-experimental-soy-templates'" template="'aui.page.pagePanel'">
        <ui:param name="'content'">
            <ui:soy moduleKey="'com.atlassian.auiplugin:aui-experimental-soy-templates'" template="'aui.page.pagePanelNav'">
                <ui:param name="'content'">
                    <ul class="vertical tabs">
                        <ww:iterator value="/projectTabPanels" status="'status'">
                            <li class="<ww:if test="/selected == completeKey">active</ww:if> <ww:if test="@status/first == true"> first</ww:if>">
                                <a class="browse-tab" id="<ww:if test="./completeKey/startsWith('com.atlassian.jira.plugin.system.')"><ww:property value="./key"/></ww:if><ww:else><ww:property value="./completeKey"/></ww:else>-panel" href="<ww:url value="'/browse/' + /project/key" atltoken="false"><ww:param name="'selectedTab'" value="completeKey"/></ww:url>" hidefocus><strong><ww:property value="label" /></strong></a>
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
</body>
</html>
