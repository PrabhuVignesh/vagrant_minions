<%@ taglib uri="webwork" prefix="ww" %>
<%@ taglib uri="webwork" prefix="ui" %>
<%@ taglib uri="webwork" prefix="aui" %>
<%@ taglib uri="sitemesh-page" prefix="page" %>
<ww:bean name="'com.atlassian.jira.util.JiraDateUtils'" id="dateUtils" />
<html>
<head>
	<title><ww:text name="'admin.indexing.jira.indexing'"/></title>
    <meta name="admin.active.section" content="admin_system_menu/advanced_menu_section/advanced_section"/>
    <meta name="admin.active.tab" content="indexing"/>
</head>
<body>

    <page:applyDecorator id="indexing" name="auiform">
        <page:param name="action">IndexReIndex.jspa</page:param>
        <page:param name="submitButtonText"><ww:text name="'admin.indexing.reindex'"/></page:param>
        <page:param name="submitButtonName">reindex</page:param>

        <aui:component template="formHeading.jsp" theme="'aui'">
            <aui:param name="'text'"><ww:text name="'admin.indexing.reindexing'"/></aui:param>
            <aui:param name="'helpURL'">searchindex</aui:param>
        </aui:component>

        <%-- Message shown when the reindex completes --%>
        <ww:if test="reindexTime > 0">
            <aui:component template="auimessage.jsp" theme="'aui'">
                <aui:param name="'messageType'">success</aui:param>
                <aui:param name="'messageHtml'">
                    <p>
                        <ww:text name="'admin.indexing.reindexing.was.successful'">
                            <ww:param name="'value0'"><strong></ww:param>
                            <ww:param name="'value1'"></strong></ww:param>
                            <ww:param name="'value2'"><strong><ww:property value="@dateUtils/formatTime(reindexTime)" /></strong></ww:param>
                        </ww:text>
                    </p>
                </aui:param>
            </aui:component>
        </ww:if>

        <ww:if test="/hasSystemAdminPermission == true && /showCustom == 'true'">
            <aui:component template="auimessage.jsp" theme="'aui'">
                <aui:param name="'messageType'">warning</aui:param>
                <aui:param name="'messageHtml'">
                    <p>
                        <ww:text name="'admin.import.index.warning'" />
                    </p>
                </aui:param>
            </aui:component>
            <aui:component template="auimessage.jsp" theme="'aui'">
                <aui:param name="'messageType'">info</aui:param>
                <aui:param name="'helpKey'">JRA21004</aui:param>
                <aui:param name="'messageHtml'">
                    <p><ww:text name="'admin.indexing.custompath.migration.msg'"/></p>
                </aui:param>
            </aui:component>
        </ww:if>

        <ww:if test="/indexConsistent == false">
            <aui:component template="auimessage.jsp" theme="'aui'">
                <aui:param name="'messageType'">error</aui:param>
                <aui:param name="'messageHtml'">
                    <p><ww:text name="'admin.indexing.strategy.background.unsafe'"/></p>
                </aui:param>
            </aui:component>
        </ww:if>

        <page:applyDecorator name="auifieldset">
            <page:param name="type">group</page:param>
            <page:param name="legend"><ww:text name="'admin.indexing.strategy.options.label'"/></page:param>

            <page:applyDecorator name="auifieldgroup">
                <page:param name="type">radio</page:param>
                <input id="reindex-background" type="radio" class="radio" name="indexingStrategy" value="background" <ww:if test="/indexConsistent == true">checked</ww:if><ww:else>disabled</ww:else> />
                <label for="reindex-background"><ww:text name="'admin.indexing.strategy.background.label'"/></label>
                <page:param name="description"><ww:text name="'admin.indexing.strategy.background.description'"/></page:param>
            </page:applyDecorator>
            <page:applyDecorator name="auifieldgroup">
                <page:param name="type">radio</page:param>
                <input id="reindex-foreground" type="radio" class="radio" name="indexingStrategy" value="stoptheworld" <ww:if test="/indexConsistent == false">checked</ww:if> />
                <label for="reindex-foreground"><ww:text name="'admin.indexing.strategy.foreground.label'"/></label>
                <page:param name="description"><ww:text name="'admin.indexing.strategy.foreground.description'"/></page:param>
            </page:applyDecorator>
        </page:applyDecorator>

        <ww:if test="/hasSystemAdminPermission == true">
            <ww:if test="/showCustom == 'true'">
                <fieldset class="hidden parameters">
                    <input type="hidden" id="admin.indexing.custompath.migration.confirmation" value="<ww:text name="'admin.indexing.custompath.migration.confirmation'"/>">
                </fieldset>
                <script type="text/javascript">
                    jQuery(function()
                    {
                        jQuery('#indexPathOption_DEFAULT').bind('click', function(e)
                        {
                            var msg = AJS.params['admin.indexing.custompath.migration.confirmation'];
                            if (! confirm(msg))
                            {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                            else
                            {
                                jQuery('#indexPathOption_DEFAULT').unbind('click', arguments.callee);
                            }
                        });
                    });
                </script>

                <fieldset class="group">
                    <legend><span><ww:text name="'setup.indexpath.label'" /></span></legend>

                    <div class="radio">
                        <input class="radio" type="radio" id="indexPathOption_CUSTOM" name="indexPathOption" value="CUSTOM" checked disabled />
                        <label for="indexPathOption_CUSTOM"><ww:text name="'admin.indexing.usecustompath'"/></label>
                        <div class="description">
                            <ww:property value="/indexPath"/>
                        </div>
                    </div>

                    <div class="radio">
                        <input class="radio" type="radio" id="indexPathOption_DEFAULT" name="indexPathOption" value="DEFAULT"
                               <ww:if test="/indexPathOption == 'DEFAULT'">checked</ww:if> />
                        <label for="indexPathOption_DEFAULT"><ww:text name="'admin.indexing.usedefaultpath'"/></label>
                        <div class="description">
                            <ww:property value="/defaultIndexPath"/>
                        </div>
                    </div>
                </fieldset>
            </ww:if>
            <ww:else>
                <div class="field-group">
                    <label><ww:text name="'setup.indexpath.label'" /></label>
                    <div class="field-value"><span id="default-index-path"><ww:property value="/defaultIndexPath"/></span></div>
                </div>
            </ww:else>
        </ww:if>
        <ww:else>
            <div class="field-group">
                <label><ww:text name="'admin.indexing.search.index.path'" /></label>
                <div class="field-value"><ww:property value="indexPath"/></div>
            </div>
        </ww:else>
    </page:applyDecorator>
</body>
</html>
