<%@ page import="com.atlassian.jira.ComponentManager"%>
<%@ page import="com.atlassian.plugin.webresource.WebResourceManager"%>
<%@ taglib uri="sitemesh-page" prefix="page" %>
<%@ taglib uri="webwork" prefix="ww" %>
<page:param name="title" />
<ww:if test="/navigatorTypeAdvanced == true">
   <page:param name="helpURL">advanced_search</page:param>
</ww:if>
<page:param name="description" />
<page:param name="width">100%</page:param>

<%-- Only show the views if there are issues that match the search criteria--%>

<div id="navigator-options">
    <ul class="operations">

        <%-- Pluggable buttons --%>
        <ww:property value="./pluggableItems" id="pluggableItems" />
        <ww:if test="@pluggableItems/empty == false">
            <ww:iterator value="@pluggableItems">
                <li class="pluggable-ops">
                    <a id="<ww:property value="./id"/>" class="lnk <ww:property value="./styleClass"/>" title="<ww:property value="./title"/>" rel="nofollow" href="<ww:property value="./url"/>">
                        <ww:if test="./iconUrl != null">
                            <span class="icon" style="background-image:url('<ww:property value="./iconUrl"/>')"></span>
                        </ww:if>
                        <ww:property value="./label"/></a>
                </li>
            </ww:iterator>
        </ww:if>

    <ww:if test="/searchResults/total > 0">
        <%-- View Options dropdown --%>
        <li class="aui-dd-parent">
            <a href="#" id="viewOptions" class="lnk aui-dd-link standard jira-icon-view"><span><ww:text name="'common.concepts.views'"/></span></a>
            <div class="aui-list hidden">
                <ww:property value="./viewOptions" id="viewOptions" />
                <ww:property value="@viewOptions/size - 1" id="lastIndex"/>
                <ww:iterator value="@viewOptions">
                    <ww:if test="./label != null">
                        <h5><ww:property value="./label"/></h5>
                    </ww:if>
                    <ul
                        <ww:if test="./id != null">
                            id="<ww:property value="./id"/>"
                        </ww:if>
                        <ww:if test="@viewOptions/indexOf(.) == 0">
                            class="aui-list-section aui-first"
                        </ww:if>
                        <ww:if test="/maxIndex(@viewOptions) == @viewOptions/indexOf(.)">
                            class="aui-list-section aui-last"
                        </ww:if>
                        <ww:if test="@viewOptions/indexOf(.) != 0 && /maxIndex(@viewOptions) != @viewOptions/indexOf(.)">
                            class="aui-list-section"
                        </ww:if>
                    >
                        <ww:iterator value="./items" >
                            <li class="aui-list-item">
                                <a class="aui-list-item-link"
                                   <ww:if test="./id != null">id="<ww:property value="./id"/>"</ww:if>
                                   <ww:if test="./rel != null">rel="<ww:property value="./rel"/>"</ww:if>
                                   href="<ww:if test="./relativeLink == false"><%= request.getContextPath()%></ww:if><ww:property value="./link"/>"
                                   title="<ww:property value="./title"/>"><ww:property value="./label"/></a>
                            </li>
                        </ww:iterator>
                    </ul>
                </ww:iterator>

                <!-- We don't want to show this link if you are not logged in since the charting plugin portlets do not show to non-->
                <ww:if test="/chart != null && /loggedInUser != null" >
                    <div class="hidden">
                        <%
                            // The links for search request views are pulled from an XML file, so the charting plugin does not have access
                            // to call this method.  We should fix this...
                            WebResourceManager webResourceManager = ComponentManager.getInstance().getWebResourceManager();
                            webResourceManager.requireResource("com.atlassian.jira.gadgets:searchrequestview-charts");
                        %>
                        <fieldset class="hidden parameters">
                            <ww:if test="/searchRequest/name != null && /searchRequest/modified == false" >
                                <input type="hidden" id="filterId" value="<ww:property value="/searchRequest/id"/>">
                            </ww:if>
                            <ww:else>
                                <input type="hidden" id="jql" value="<ww:property value="/searchRequestJqlString"/>">
                            </ww:else>
                        </fieldset>
                    </div>
                </ww:if>
            </div>
        </li>

        <%-- Tool Options dropdown --%>
        <ww:property value="./toolOptions" id="toolOptions" />
        <ww:if test="@toolOptions/empty == false">
            <li class="aui-dd-parent">
                <a href="#" id="toolOptions" class="lnk aui-dd-link standard icon-tools"><span><ww:text name="'common.concepts.tools'"/></span></a>
                <div id="toolOptions-dropdown" class="aui-list hidden">
                    <ww:property value="@toolOptions/size - 1" id="lastIndex"/>
                    <ww:iterator value="@toolOptions">
                        <ww:if test="./label != null">
                            <h5><ww:property value="./label"/></h5>
                        </ww:if>
                        <ul
                            <ww:if test="./id != null">
                                id="<ww:property value="./id"/>"
                            </ww:if>
                            <ww:if test="@toolOptions/indexOf(.) == 0">
                                class="aui-list-section aui-first"
                            </ww:if>
                            <ww:if test="/maxIndex(@toolOptions) == @toolOptions/indexOf(.)">
                                class="aui-list-section aui-last"
                            </ww:if>
                        >
                            <ww:iterator value="./items" >
                                <li class="aui-list-item">
                                    <a class="aui-list-item-link"
                                       <ww:if test="./id != null">id="<ww:property value="./id"/>"</ww:if>
                                       <ww:if test="./rel != null">rel="<ww:property value="./rel"/>"</ww:if>
                                       href="<ww:if test="./relativeLink == false"><%= request.getContextPath()%></ww:if><ww:property value="./link"/>"
                                       title="<ww:property value="./title"/>"><ww:property value="./label"/></a>
                                </li>
                            </ww:iterator>
                        </ul>
                    </ww:iterator>
                </div>
            </li>
        </ww:if>
    </ul>

    </ww:if>
</div>

<%--These messages are there for issue operation dialogs so they can thank the user for their business--%>
<fieldset class="hidden parameters">
    <input type="hidden" id="thanks_issue_updated" value="<ww:text name="'navigator.results.thanks.updated'"/>">
    <input type="hidden" id="thanks_issue_transitioned" value="<ww:text name="'navigator.results.thanks.transitioned'"/>">
    <input type="hidden" id="thanks_issue_assigned" value="<ww:text name="'navigator.results.thanks.assigned'"/>">
    <input type="hidden" id="thanks_issue_commented" value="<ww:text name="'navigator.results.thanks.commented'"/>">
    <input type="hidden" id="thanks_issue_worklogged" value="<ww:text name="'navigator.results.thanks.worklogged'"/>">
    <input type="hidden" id="thanks_issue_voted" value="<ww:text name="'navigator.results.thanks.voted'"/>">
    <input type="hidden" id="thanks_issue_watched" value="<ww:text name="'navigator.results.thanks.watched'"/>">
    <input type="hidden" id="thanks_issue_moved" value="<ww:text name="'navigator.results.thanks.moved'"/>">
    <input type="hidden" id="thanks_issue_linked" value="<ww:text name="'navigator.results.thanks.linked'"/>">
    <input type="hidden" id="thanks_issue_cloned" value="<ww:text name="'navigator.results.thanks.cloned'"/>">
    <input type="hidden" id="thanks_issue_labelled" value="<ww:text name="'navigator.results.thanks.labelled'"/>">
    <input type="hidden" id="thanks_issue_deleted" value="<ww:text name="'navigator.results.thanks.deleted'"/>">
    <input type="hidden" id="thanks_issue_attached" value="<ww:text name="'navigator.results.thanks.attached'"/>">
</fieldset>


<div class="perm-link">
   <a id="permlink" class="icon-permalink" href="<%= request.getContextPath() %>/secure/IssueNavigator.jspa?reset=true<ww:property value="jqlQueryString" />" title="<ww:text name="'viewissue.permlink.title.navigator'"/>"><ww:text name="'viewissue.permlink'"/></a>
</div>

<div id="throbber-space">&nbsp;</div>

<h1>
    <ww:property value="text('navigator.title')"/><ww:if test="searchRequest/name"> &mdash; <span id="filter-name"><ww:property value="searchRequest/name"/></span></ww:if>
</h1>