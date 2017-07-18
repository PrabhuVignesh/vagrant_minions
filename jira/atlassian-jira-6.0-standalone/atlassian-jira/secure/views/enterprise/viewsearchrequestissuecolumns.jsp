<%@ taglib uri="webwork" prefix="ww" %>
<%@ taglib uri="webwork" prefix="ui" %>
<%@ taglib uri="webwork" prefix="aui" %>
<%@ taglib uri="sitemesh-page" prefix="page" %>
<html>
<head>
	<title><ww:text name="'issue.columns.user.title'"/></title>
    <content tag="section">find_link</content>
</head>
<body class="page-type-issuenav">
    <ui:soy moduleKey="'com.atlassian.auiplugin:aui-experimental-soy-templates'" template="'aui.page.pageHeader'">
        <ui:param name="'content'">
            <ui:soy moduleKey="'com.atlassian.auiplugin:aui-experimental-soy-templates'" template="'aui.page.pageHeaderMain'">
                <ui:param name="'content'">
                    <h1><ww:property value="searchRequest/name"/></h1>
                </ui:param>
            </ui:soy>
        </ui:param>
    </ui:soy>

    <ui:soy moduleKey="'com.atlassian.auiplugin:aui-experimental-soy-templates'" template="'aui.page.pagePanel'">
        <ui:param name="'id'" value="'issuenav'"/>
        <ui:param name="'extraClasses'">
            <ww:if test="/conglomerateCookieValue('jira.toggleblocks.cong.cookie','lhc-state')/contains('#issuenav') == true">lhc-collapsed</ww:if>
        </ui:param>
        <ui:param name="'content'">
            <ui:soy moduleKey="'com.atlassian.auiplugin:aui-experimental-soy-templates'" template="'aui.page.pagePanelContent'">
                <ui:param name="'content'">

                    <div class="command-bar">
                        <div class="ops-cont">
                            <ul class="ops">
                                <li id="back-lnk-section" class="last">
                                    <a id="back-lnk" class="button first last" href="<%= request.getContextPath() %>/secure/IssueNavigator.jspa"><span class="icon icon-back"><span><ww:text name="'navigator.title'"/></span></span><ww:text name="'navigator.title'"/></a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <h2><ww:text name="'issue.columns.user.title'"/></h2>
                    <p>
                        <ww:if test="/usingDefaultColumns == true">
                            <ww:text name="'issue.columns.searchrequest.description.first.line.nocolumns'">
                                <ww:param name="'value0'"><ww:property value="/searchRequest/name"/></ww:param>
                                <ww:param name="'value1'"><a href="<%= request.getContextPath() %>/secure/IssueNavigator.jspa?mode=hide&requestId=<ww:property value='/filterId'/>"></ww:param>
                                <ww:param name="'value2'"></a></ww:param>
                            </ww:text>
                        </ww:if>
                        <ww:else>
                            <ww:text name="'issue.columns.searchrequest.description.first.line.columns'">
                                <ww:param name="'value0'"><a href="<%= request.getContextPath() %>/secure/IssueNavigator.jspa?mode=hide&requestId=<ww:property value='/filterId'/>"></ww:param>
                                <ww:param name="'value1'"></a></ww:param>
                                <ww:param name="'value2'"><ww:property value="/searchRequest/name"/></ww:param>
                            </ww:text>
                        </ww:else>
                        <ww:text name="'issue.columns.description.second.line'"/>
                    </p>
                    <ww:property value="/filterId" id="filterId" />
                    <ww:property value="'ViewSearchRequestIssueColumns.jspa'" id="actionUrl" />
                    <%@ include file="/includes/panels/issuecolumns.jsp" %>
                </ui:param>
            </ui:soy>
        </ui:param>
    </ui:soy>
</body>
</html>
