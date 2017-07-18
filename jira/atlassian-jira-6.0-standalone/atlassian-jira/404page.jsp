<%@ taglib uri="webwork" prefix="ui" %>
<%@ page import="com.atlassian.jira.config.properties.APKeys" %>
<%@ page import="com.atlassian.jira.config.properties.ApplicationProperties" %>
<%@ page import="com.atlassian.jira.security.JiraAuthenticationContext" %>
<%@ page import="com.atlassian.jira.util.I18nHelper" %>
<%@ page import="com.atlassian.jira.web.filters.steps.senderror.CaptureSendErrorMessageResponseWrapper" %>
<%@ page import="com.atlassian.jira.component.ComponentAccessor" %>
<%@ page import="com.atlassian.jira.web.util.ProductVersionDataBeanProvider" %>
<%@ page import="com.atlassian.plugin.webresource.WebResourceManager" %>
<%@ page import="com.opensymphony.util.TextUtils" %>
<html>
<%
    final I18nHelper i18nBean = ComponentAccessor.getComponent(JiraAuthenticationContext.class).getI18nHelper();
    WebResourceManager webResourceManager = ComponentAccessor.getComponent(WebResourceManager.class);
    webResourceManager.requireResourcesForContext("atl.general");
    webResourceManager.requireResourcesForContext("jira.general");
    String msg = (String) request.getAttribute(CaptureSendErrorMessageResponseWrapper.CAPTURED_MESSAGE_REQUEST_ATTR);
    msg = TextUtils.htmlEncode(msg);

    ApplicationProperties applicationProperties = ComponentAccessor.getComponent(ApplicationProperties.class);
    final String jiraTitle = applicationProperties.getDefaultBackedString(APKeys.JIRA_TITLE);
    final String jiraLogoUrl = applicationProperties.getDefaultBackedString(APKeys.JIRA_LF_LOGO_URL);
%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=Edge;chrome=1" />
    <title><%=TextUtils.htmlEncode(i18nBean.getText("404.title"))%> (404)</title>
    <%@ include file="/includes/decorators/aui-layout/head-resources.jsp" %>
    <%= ComponentAccessor.getComponent(ProductVersionDataBeanProvider.class).get().getMetaTags() %>
</head>
<body id="jira" class="aui-layout aui-theme-default page-type-message" <%= ComponentAccessor.getComponent(ProductVersionDataBeanProvider.class).get().getBodyHtmlAttributes() %> >
<div id="page">
    <header id="header" role="banner">
        <nav class="aui-header aui-dropdown2-trigger-group" role="navigation">
            <div class="aui-header-inner">
                <div class="aui-header-primary">
                    <h1 id="logo" class="aui-header-logo">
                        <a href="<%=request.getContextPath()%>/secure/MyJiraHome.jspa"><img src="<%=request.getContextPath() + TextUtils.htmlEncode(jiraLogoUrl)%>" alt="<%=TextUtils.htmlEncode(jiraTitle)%>" /></a>
                    </h1>
                </div>
            </div><!-- .aui-header-inner-->
        </nav><!-- .aui-header -->
    </header>
    <section id="content" role="main">
        <ui:soy moduleKey="'com.atlassian.auiplugin:aui-experimental-soy-templates'" template="'aui.page.pagePanel'">
            <ui:param name="'content'">
                <ui:soy moduleKey="'com.atlassian.auiplugin:aui-experimental-soy-templates'" template="'aui.page.pagePanelContent'">
                    <ui:param name="'content'">
                        <ui:soy moduleKey="'com.atlassian.auiplugin:aui-experimental-soy-templates'" template="'aui.page.pageHeader'">
                            <ui:param name="'content'">
                                <ui:soy moduleKey="'com.atlassian.auiplugin:aui-experimental-soy-templates'" template="'aui.page.pageHeaderMain'">
                                    <ui:param name="'content'">
                                        <h1><%=TextUtils.htmlEncode(i18nBean.getText("404.title"))%> (404)</h1>
                                    </ui:param>
                                </ui:soy>
                            </ui:param>
                        </ui:soy>
                        <ui:soy moduleKey="'com.atlassian.auiplugin:aui-experimental-soy-templates'" template="'aui.message.warning'">
                            <ui:param name="'titleContent'"><%=msg%></ui:param>
                            <ui:param name="'content'">
                                <p><%=TextUtils.htmlEncode(i18nBean.getText("404.message"))%></p>
                                <p><a href="<%=request.getContextPath()%>/secure/MyJiraHome.jspa"><%=TextUtils.htmlEncode(i18nBean.getText("admin.keyboard.shortcut.goto.homr.desc"))%></a></p>
                            </ui:param>
                        </ui:soy>
                    </ui:param>
                </ui:soy>
            </ui:param>
        </ui:soy>
    </section>
</div>
</body>
</html>