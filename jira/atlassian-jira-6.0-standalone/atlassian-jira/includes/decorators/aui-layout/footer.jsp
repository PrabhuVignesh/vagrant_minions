<%@ page import="com.atlassian.jira.plugin.navigation.HeaderFooterRendering" %>
<%@ page import="static com.atlassian.jira.component.ComponentAccessor.*" %>
<%
    //
    // IDEA gives you a warning below because it cant resolve JspWriter.  I don't know why but its harmless
    //
    getComponent(HeaderFooterRendering.class).includeFooters(out, request);
%>
<jsp:include page="/includes/decorators/global-translations.jsp" />