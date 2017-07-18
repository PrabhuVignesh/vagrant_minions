<%@ page import="com.atlassian.core.logging.DatedLoggingEvent" %>
<%@ page import="com.atlassian.core.logging.ThreadLocalErrorCollection" %>
<%@ page import="com.atlassian.core.ofbiz.util.OFBizPropertyUtils" %>
<%@ page import="com.atlassian.core.util.collection.EasyList" %>
<%@ page import="com.atlassian.crowd.embedded.api.User" %>
<%@ page import="com.atlassian.jira.security.JiraAuthenticationContext" %>
<%@ page import="com.atlassian.jira.security.PermissionManager" %>
<%@ page import="com.atlassian.jira.security.Permissions" %>
<%@ page import="com.atlassian.jira.service.JiraServiceContainer" %>
<%@ page import="com.atlassian.jira.user.util.UserManager" %>
<%@ page import="com.atlassian.jira.util.ExceptionInterpreterUtil" %>
<%@ page import="com.atlassian.jira.util.I18nHelper" %>
<%@ page import="com.atlassian.jira.util.JiraContactHelper" %>
<%@ page import="com.atlassian.jira.util.system.ExtendedSystemInfoUtils" %>
<%@ page import="com.atlassian.jira.util.system.ExtendedSystemInfoUtilsImpl" %>
<%@ page import="com.atlassian.jira.util.system.SystemInfoUtils" %>
<%@ page import="com.atlassian.jira.util.velocity.DefaultVelocityRequestContextFactory" %>
<%@ page import="com.atlassian.jira.web.util.ExternalLinkUtil"%>
<%@ page import="com.atlassian.jira.web.util.ExternalLinkUtilImpl"%>
<%@ page import="com.atlassian.jira.web.util.JiraLocaleUtils"%>
<%@ page import="com.atlassian.plugin.Plugin"%>
<%@ page import="com.atlassian.plugin.PluginInformation"%>
<%@ page import="com.atlassian.plugin.webresource.WebResourceManager" %>
<%@ page import="com.atlassian.seraph.auth.DefaultAuthenticator" %>
<%@ page import="com.opensymphony.module.propertyset.PropertySet" %>
<%@ page import="com.opensymphony.util.TextUtils" %>
<%@ page import="org.apache.log4j.Logger" %>
<%@ page import="org.apache.log4j.spi.LoggingEvent" %>
<%@ page import="org.ofbiz.core.entity.GenericValue" %>
<%@ page import="javax.servlet.ServletException" %>
<%@ page import="java.io.PrintWriter" %>
<%@ page import="java.io.StringWriter" %>
<%@ page import="java.security.Principal" %>
<%@ page import="java.util.Collection" %>
<%@ page import="java.util.Date" %>
<%@ page import="java.util.Enumeration" %>
<%@ page import="java.util.Iterator" %>
<%@ page import="java.util.List" %>
<%@ page import="java.util.Locale" %>
<%@ page import="java.util.Map" %>
<%@ page import="com.atlassian.jira.component.ComponentAccessor" %>
<%@ page isErrorPage="true" %>
<%@ taglib uri="webwork" prefix="ww" %>
<%!
    //
    // IDEA gives you lots of warnings below because it cant resolve JspWriter.  I don't know why but its harmless
    //
    private static final Logger log = Logger.getLogger("500ErrorPage.jsp");
%>
<%
    // Try to log stuff before going any further so if all the below logic
    // causes problem we at least have a log statement.
    // The first line of the Exception. It is HTML escaped.
    String line = "";

    // The full stack trace of the Exception. It is HTML escaped.
    String ex = null;

    if (exception != null)
    {
        Throwable cause = exception;
        if (exception instanceof ServletException)
        {
            Throwable rootCause = ((ServletException) exception).getRootCause();
            if (rootCause != null)
                cause = rootCause;
        }
        //log exception to the log files, so that it gets captured somewhere.
        log.error("Exception caught in 500 page " + cause.getMessage(), cause);
        line = TextUtils.htmlEncode(cause.toString());
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        cause.printStackTrace(pw);
        ex = TextUtils.htmlEncode(sw.toString());
    }

    // Need to ensure request gets cached if it hasn't had the chance yet.
    DefaultVelocityRequestContextFactory.cacheVelocityRequestContext(request);
    WebResourceManager webResourceManager = null;
    try {
        webResourceManager = ComponentAccessor.getWebResourceManager();
        // Plugins 2.5 allows us to perform context-based resource inclusion. This defines the context "atl.error"
        webResourceManager.requireResourcesForContext("atl.error");
        webResourceManager.requireResourcesForContext("jira.error");
        webResourceManager.requireResourcesForContext("atl.global");
        webResourceManager.requireResourcesForContext("jira.global");
    }
    catch (Exception e)
    {
        // maybe plugins is not available?
        log.error("Can't get WebResourceManager resources: ", e);
    }
%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=Edge;chrome=1" />
	<title>Oops - an error has occurred</title>
    <script language="JavaScript" type="text/javascript" src="<%=request.getContextPath()%>/includes/js/cookieUtil.js"></script>
    <%
        if (webResourceManager != null) {
            webResourceManager.includeResources(out);
        }
    %>
    <style>
        table.aui tbody th {
            width: 20em;
            word-break: break-word;
        }
    </style>
</head>

<%
    final ExternalLinkUtil externalLinkUtil = new ExternalLinkUtilImpl();
    final I18nHelper i18nBean = ComponentAccessor.getComponent(JiraAuthenticationContext.class).getI18nHelper();
    final PermissionManager permissionManager = ComponentAccessor.getComponent(PermissionManager.class);
    final UserManager userManager = ComponentAccessor.getComponent(UserManager.class);
    final ExtendedSystemInfoUtils extendedSystemInfoUtils = new ExtendedSystemInfoUtilsImpl(i18nBean);
    final SystemInfoUtils systemInfoUtils = extendedSystemInfoUtils.getSystemInfoUtils();
    // Get the contact administrators message
    JiraContactHelper jiraContactHelper = ComponentAccessor.getComponentOfType(JiraContactHelper.class);
    final String contactAdministratorLink = jiraContactHelper.getAdministratorContactLinkHtml(request.getContextPath(), i18nBean);

    String interpretedMsg = ExceptionInterpreterUtil.execute(extendedSystemInfoUtils, ex);

    // Check that the user has the global admin permission to see the services/listeners params (JRA-12081)
    //
    // The 500 page is run in Tomcat outside the original FilterChain and hence the auth context thread local
    // has been torn down at this stage.  So we have to go to the session to get the user information
    //
    HttpSession httpSession = request.getSession(false); //dont create the session if there isnt one
    Principal principal = httpSession != null ? (Principal) httpSession.getAttribute(DefaultAuthenticator.LOGGED_IN_KEY) : null;
    User remoteUser = principal != null ? userManager.getUser(principal.getName()) : null;
    boolean isGlobalAdmin = false;
    boolean isSystemAdmin = false;
    try {
        isGlobalAdmin = remoteUser != null && permissionManager.hasPermission(Permissions.ADMINISTER, remoteUser);
        isSystemAdmin = remoteUser != null && permissionManager.hasPermission(Permissions.SYSTEM_ADMIN, remoteUser);
    } catch (Exception dontCare) {
       log.error(dontCare);
    }
    List sysadminOnlyProperties = EasyList.build(i18nBean.getText("admin.systeminfo.system.cwd"),
                                                 i18nBean.getText("admin.systeminfo.jvm.input.arguments"),
                                                 i18nBean.getText("admin.server.id"));
%>
<body id="jira" class="aui-layout aui-theme-default">
<div id="page">
    <section id="content" role="main">
        <header class="aui-page-header">
            <div class="aui-page-header-inner">
                <div class="aui-page-header-main">
                    <h1><ww:text name="'system.error.main.title'" /></h1>
                </div>
            </div>
        </header>
        <div class="aui-page-panel">
            <div class="aui-page-panel-inner">
                <section class="aui-page-panel-content">
                    <%
                        if(interpretedMsg != null && !"".equals(interpretedMsg.trim()))
                        {
                    %>
                        <h2><ww:text name="'system.error.known.title'"/></h2>
                        <p><ww:text name="'system.error.known.description'"/></p>
                        <p><ww:text name="'system.error.known.resembles'"/></p>
                        <p><%= interpretedMsg %></p>
                        <p><ww:text name="'system.error.known.notifyadmin'"/></p>
                    <%
                        }
                        else
                        {
                    %>
                        <h2><ww:text name="'system.error.unknown.title'"/></h2>
                        <p><ww:text name="'system.error.unknown.description1'"/></p>
                        <%
                            if (!isGlobalAdmin)
                            {
                        %>
                            <p>
                                <ww:text name="'system.error.unknown.description2'">
                                    <ww:param name="'value0'"><%=contactAdministratorLink%></ww:param>
                                </ww:text>
                            </p>
                        <%
                            }
                        %>
                    <%
                        }
                    %>
                    <%
                        if (isGlobalAdmin)
                        {
                    %>
                        <p>
                            <ww:text name="'system.error.unknown.description3'">
                                <ww:param name="'value0'"><a href="<%= request.getContextPath() %>/plugins/servlet/stp/view/#create-support-request" target="_blank"></ww:param>
                                <ww:param name="'value1'"></a></ww:param>
                            </ww:text>
                        </p>
                    <%
                        }
                    %>
                    <p>
                        <ww:text name="'system.error.unknown.description4'">
                            <ww:param name="'value0'"><b></ww:param>
                            <ww:param name="'value1'"></b></ww:param>
                            <ww:param name="'value2'">
                                <a href="<%= externalLinkUtil.getProperty("external.link.jira.support.site") %>"><%= externalLinkUtil.getProperty("external.link.jira.support.site") %></a>
                            </ww:param>
                        </ww:text>
                    </p>
                    <ol>
                        <li><ww:text name="'system.error.step1'"/>
                        <li><ww:text name="'system.error.step2'"/>
                        <%
                            if (isSystemAdmin)
                            {
                        %>
                            <li><ww:text name="'system.error.step3'"><ww:param name="'value0'"><% out.println(extendedSystemInfoUtils.getLogPath());%></ww:param></ww:text>
                        <%
                            }
                        %>
                    </ol>

                    <h2><ww:text name="'system.error.cause'"/></h2>
                    <p>
                        <ww:text name="'system.error.referer.url'"/>:
                        <b><%= request.getHeader("Referer") != null ? TextUtils.htmlEncode(request.getHeader("Referer")) : "Unknown" %></b>
                    </p>
                    <p><%= line %></p>
                    <%
                        if(ex != null)
                        {
                    %>
                        <p><a href="#" class="switch" id="stacktrace-switch" onclick="CookieUtil.toggleVisibility('stacktrace', 'Show stack trace', 'Hide stack trace', true);">Hide stack trace</a></p>
                        <blockquote id="stacktrace" style="overflow-x: auto;"><pre><%= ex %></pre></blockquote>
                    <%
                        }
                        else
                        {
                    %>
                        <p><%= TextUtils.htmlEncode((String) request.getAttribute("javax.servlet.error.message")) %></p>
                    <%
                        }
                    %>

                    <h2><ww:text name="'system.error.build.information'"/></h2>
                    <table class="aui">
                        <tbody>
                            <%
                                final Map buildstats = extendedSystemInfoUtils.getBuildStats();
                                for (Iterator i = buildstats.entrySet().iterator(); i.hasNext();)
                                {
                            %>
                            <tr>
                                <th>
                                    <% Map.Entry entry = (Map.Entry) i.next(); %>
                                    <%= entry.getKey() %>
                                </th>
                                <td>
                                    <%
                                        if (!isGlobalAdmin && i18nBean.getText("admin.server.id").equals(entry.getKey()))
                                        {
                                    %>
                                        <ww:text name="'system.error.property.not.admin'"/>
                                    <%
                                        }
                                        else
                                        {
                                    %>
                                        <%= TextUtils.htmlEncode(String.valueOf(entry.getValue())) %>
                                    <%
                                        }
                                    %>
                                </td>
                            </tr>
                            <%
                                }
                            %>
                        </tbody>
                    </table>

                    <h2><ww:text name="'system.error.server.information'"/></h2>
                    <table class="aui">
                        <tbody>
                            <tr>
                                <th><ww:text name="'system.error.application.server'"/></th>
                                <td><%= TextUtils.htmlEncode(application.getServerInfo()) %></td>
                            </tr>
                            <tr>
                                <th><ww:text name="'system.error.servlet.version'"/></th>
                                <td><%= application.getMajorVersion() %>.<%= application.getMinorVersion() %></td>
                            </tr>
                        </tbody>
                    </table>

                    <h2><ww:text name="'system.error.file.paths'"/></h2>
                    <%
                        if (isSystemAdmin)
                        {
                    %>
                    <table class="aui">
                        <tbody>
                            <tr>
                                <th><ww:text name="'system.error.location.of.entityengine'"/></th>
                                <td><%= TextUtils.htmlEncode(extendedSystemInfoUtils.getEntityEngineXmlPath()) %></td>
                            </tr>
                            <tr>
                                <th><ww:text name="'system.error.location.of.log'"/></th>
                                <td><%= TextUtils.htmlEncode(extendedSystemInfoUtils.getLogPath())%></td>
                            </tr>
                        </tbody>
                    </table>
                    <%
                        }
                        else
                        {
                    %>
                        <p><ww:text name="'system.error.file.paths.not.sysadmin'"/></p>
                    <%
                        }
                    %>

                    <h2><ww:text name="'system.error.memory.information'"/></h2>
                    <table class="aui">
                        <tbody>
                            <%
                                final Map jvmStats = extendedSystemInfoUtils.getJvmStats();
                                for (Iterator i = jvmStats.entrySet().iterator(); i.hasNext();)
                                {
                                    Map.Entry entry = (Map.Entry) i.next();
                            %>
                            <tr>
                                <th><%= TextUtils.htmlEncode(String.valueOf(entry.getKey())) %></th>
                                <td><%= TextUtils.htmlEncode(String.valueOf(entry.getValue())) %></td>
                            </tr>
                            <%
                                }
                            %>
                        </tbody>
                    </table>

                    <h2><ww:text name="'system.error.system.information'"/></h2>
                    <table class="aui">
                        <tbody>
                            <%
                                final Map sysinfo = extendedSystemInfoUtils.getProps();
                                for (Iterator i = sysinfo.entrySet().iterator(); i.hasNext();)
                                {
                                    Map.Entry entry = (Map.Entry) i.next();
                            %>
                                <tr>
                                    <th><%= TextUtils.htmlEncode(String.valueOf(entry.getKey())) %></th>
                                    <%
                                        if (!isSystemAdmin && sysadminOnlyProperties.contains(entry.getKey()))
                                        {
                                    %>
                                        <td><ww:text name="'system.error.property.not.sysadmin'"/></td>
                                    <%
                                        }
                                        else
                                        {
                                    %>
                                        <td><%= TextUtils.htmlEncode(String.valueOf(entry.getValue())) %></td>
                                    <%
                                        }
                                    %>
                                </tr>
                            <%
                                }
                            %>
                        </tbody>
                    </table>

                    <h2><ww:text name="'admin.systeminfo.language.info'"/></h2>
                    <table class="aui" id="language-info">
                        <tbody>
                            <tr>
                                <th valign="top"><ww:text name="'admin.generalconfiguration.installed.languages'"/></th>
                                <td>
                                    <%
                                        JiraLocaleUtils jiraLocaleUtils = new JiraLocaleUtils();
                                        final List installedLocales = jiraLocaleUtils.getInstalledLocales();
                                        for (Iterator localeIt = installedLocales.iterator(); localeIt.hasNext();)
                                        {
                                            Locale locale = (Locale) localeIt.next();
                                            %><%= TextUtils.htmlEncode(locale.getDisplayName(i18nBean.getLocale())) %><% if (localeIt.hasNext()) { %><br/><% }
                                        }
                                    %>
                                </td>
                            </tr>
                            <tr>
                                <th><ww:text name="'admin.generalconfiguration.default.language'"/></th>
                                <td><%= TextUtils.htmlEncode(extendedSystemInfoUtils.getDefaultLanguage()) %><% if (extendedSystemInfoUtils.isUsingSystemLocale()) { %> - <ww:text name="'admin.systeminfo.system.default.locale'"/><% } %></td>
                            </tr>
                        </tbody>
                    </table>


                    <h2><ww:text name="'system.error.request.information'"/></h2>
                    <%
                        try {
                            String encodedQueryString = request.getQueryString() == null ? " " : TextUtils.htmlEncode(request.getQueryString());
                    %>
                        <table class="aui">
                            <thead>
                                <tr>
                                    <th>Property</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th><ww:text name="'system.error.request.url'"/></th>
                                    <td><%= TextUtils.htmlEncode("" + request.getRequestURL()) %></td>
                                </tr>
                                <tr>
                                    <th><ww:text name="'system.error.scheme'"/></th>
                                    <td><%= TextUtils.htmlEncode("" + request.getScheme()) %></td>
                                </tr>
                                <tr>
                                    <th><ww:text name="'system.error.server'"/></th>
                                    <td><%= TextUtils.htmlEncode("" + request.getServerName()) %></td>
                                </tr>
                                <tr>
                                    <th><ww:text name="'system.error.port'"/></th>
                                    <td><%= TextUtils.htmlEncode("" + request.getServerPort()) %></td>
                                </tr>
                                <tr>
                                    <th><ww:text name="'system.error.uri'"/></th>
                                    <td><%= TextUtils.htmlEncode("" + request.getRequestURI()) %></td>
                                </tr>
                                <tr>
                                    <th><ww:text name="'system.error.context.path'"/></th>
                                    <td><%= TextUtils.htmlEncode("" + request.getContextPath()) %></td>
                                </tr>
                                <tr>
                                    <th><ww:text name="'system.error.servlet.path'"/></th>
                                    <td><%= TextUtils.htmlEncode("" + request.getServletPath()) %></td>
                                </tr>
                                <tr>
                                    <th><ww:text name="'system.error.path.info'"/></th>
                                    <td><%= TextUtils.htmlEncode("" + request.getPathInfo()) %></td>
                                </tr>
                                <tr>
                                    <th><ww:text name="'system.error.query.string'"/></th>
                                    <td><%= encodedQueryString %></td>
                                </tr>
                            </tbody>
                        </table>

                        <h2><ww:text name="'system.error.request.attributes'"/></h2>
                        <table class="aui">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <%
                                    Enumeration attributeNames = request.getAttributeNames();
                                    while (attributeNames.hasMoreElements())
                                    {
                                        String name = (String) attributeNames.nextElement();
                                        Object attribute = request.getAttribute(name);
                                %>
                                    <tr>
                                        <th><%= name %></th>
                                        <td><%= TextUtils.htmlEncode(attribute == null ? "null" : attribute.toString()) %></td>
                                    </tr>
                                <%
                                    }
                                %>
                            </tbody>
                        </table>

                    <%
                        }
                        catch (Throwable t)
                        {
                            out.println("Error rendering logging information - uh oh.");
                            t.printStackTrace(new PrintWriter(out));
                        }
                    %>

                    <h2><ww:text name="'system.error.request.logging'"/></h2>
                    <%
                        try
                        {
                            List list = ThreadLocalErrorCollection.getList();
                    %>
                        <p><b><%= list.size() %></b> log statements generated by this request.</p>
                        <%
                            for (Iterator iterator = list.iterator(); iterator.hasNext();)
                            {
                                DatedLoggingEvent dle = (DatedLoggingEvent) iterator.next();
                                LoggingEvent loggingEvent = dle.getEvent();
                                Date date = dle.getDate();
                        %>
                            <%-- In case of backward compatibility issues with logging functions see JRA-5405 --%>
                            <div style="font-family: monospace">
                                <span style="color: #d04437">[<%= TextUtils.htmlEncode(String.valueOf(loggingEvent.getLevel())) %>]</span>
                                <span style="color: #4a6785"><%= TextUtils.htmlEncode(date.toString()) %></span>
                                [<%= TextUtils.htmlEncode(loggingEvent.getLoggerName()) %>]
                                <%= TextUtils.htmlEncode(loggingEvent.getRenderedMessage()) %>
                            </div>
                            <%
                                if (loggingEvent.getThrowableInformation() != null)
                                {
                            %>
                                <div style="font-size: 12px; line-height: 1.33333333333333; margin: 0 0 0 20px; font-family: monospace;">
                                    <%
                                        final String[] throwableStrRep = loggingEvent.getThrowableStrRep();
                                        for (int i = 0; i < throwableStrRep.length && i < 20; i++)
                                        {
                                            String s = throwableStrRep[i];
                                            out.println(TextUtils.htmlEncode(s) + "<br>");
                                        }
                                    %>
                                </div>
                            <%
                                }
                            %>
                        <%
                            }
                        %>
                    <%
                        }
                        catch (Throwable t)
                        {
                            out.println("Error rendering logging information - uh oh.");
                            t.printStackTrace(new PrintWriter(out));
                        }
                    %>

                    <%-- LISTENERS - start --%>
                    <%
                        try
                        {
                    %>
                        <h2><ww:text name="'admin.systeminfo.listeners'"/></h2>
                        <table class="aui">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Class</th>
                                </tr>
                            </thead>
                            <tbody>
                                <%
                                    final Collection listeners = extendedSystemInfoUtils.getListeners();
                                    for (Iterator i = listeners.iterator(); i.hasNext();)
                                    {
                                        GenericValue gv = (GenericValue) i.next();
                                %>
                                    <tr>
                                        <th><%= TextUtils.htmlEncode(gv.getString("name")) %></th>
                                        <td><%= TextUtils.htmlEncode(gv.getString("clazz")) %></td>
                                    </tr>
                                    <%
                                        if (isGlobalAdmin)
                                        {
                                            final PropertySet propertySet = OFBizPropertyUtils.getPropertySet(gv);
                                            final Collection keys = propertySet.getKeys("", 5);
                                            if (keys != null && !keys.isEmpty())
                                            {
                                                for (Iterator j = keys.iterator(); j.hasNext();)
                                                {
                                                    String key = (String) j.next();
                                    %>
                                        <tr>
                                            <th><%= TextUtils.htmlEncode(key) %></th>
                                            <td><%= TextUtils.htmlEncode(propertySet.getString(key)) %></td>
                                        </tr>
                                    <%
                                                }
                                            }
                                        }
                                    %>
                                <%
                                    }
                                %>
                            </tbody>
                        </table>
                    <%
                        }
                        catch (Exception e)
                        {
                            System.out.println("Error getting listeners");
                            e.printStackTrace();
                        }
                    %>
                    <%-- LISTENERS - end --%>

                    <%-- SERVICES - start --%>
                    <%
                        try
                        {
                    %>
                        <h2><ww:text name="'admin.systeminfo.services'"/></h2>
                        <table class="aui">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Class</th>
                                    <th>Delay</th>
                                </tr>
                            </thead>
                            <tbody>
                                <%
                                    final Collection services = extendedSystemInfoUtils.getServices();
                                    for (Iterator i = services.iterator(); i.hasNext();)
                                    {
                                        JiraServiceContainer service = (JiraServiceContainer) i.next();
                                %>
                                <tr>
                                    <th><%= TextUtils.htmlEncode(service.getName()) %></th>
                                    <td><%= TextUtils.htmlEncode(service.getServiceClass()) %></td>
                                    <td><%= extendedSystemInfoUtils.getMillisecondsToMinutes(service.getDelay()) %> <ww:text name="'core.dateutils.minutes'"/></td>
                                </tr>
                                <%
                                        if (isGlobalAdmin)
                                        {
                                            final Map servicePropertyMap = extendedSystemInfoUtils.getServicePropertyMap(service);
                                            if (servicePropertyMap != null && !servicePropertyMap.isEmpty())
                                            {
                                                for (Iterator j = servicePropertyMap.entrySet().iterator(); j.hasNext();)
                                                {
                                                    Map.Entry entry = (Map.Entry) j.next();
                                %>
                                    <tr>
                                        <td colspan="3">
                                            <small>&mdash; <b><%= TextUtils.htmlEncode(String.valueOf(entry.getKey())) %>:</b> <%= TextUtils.htmlEncode(i18nBean.getText((String) entry.getValue())) %></small>
                                        </td>
                                    </tr>
                                <%
                                                }
                                            }
                                        }
                                    }
                                %>
                            </tbody>
                        </table>
                    <%
                        }
                        catch (Exception e)
                        {
                            System.out.println("Error getting services");
                            e.printStackTrace();
                        }
                    %>
                    <%-- SERVICES - end --%>

                    <%-- PLUGINS - start --%>
                    <%
                        try
                        {
                    %>
                        <h2><ww:text name="'admin.systeminfo.plugins'"/></h2>
                        <table class="aui">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Version</th>
                                    <th>Vendor</th>
                                    <th>Status</th>
                                    <th>Params</th>
                                </tr>
                            </thead>
                            <tbody>
                                <%
                                    final Collection plugins = extendedSystemInfoUtils.getPlugins();
                                    for (Iterator i = plugins.iterator(); i.hasNext();)
                                    {
                                        final Plugin plugin = (Plugin) i.next();
                                        final PluginInformation pluginInformation = plugin.getPluginInformation();
                                %>
                                    <tr>
                                        <th><%= TextUtils.htmlEncode(plugin.getName()) %></th>
                                        <td><%= TextUtils.htmlEncode(pluginInformation.getVersion()) %></td>
                                        <td><%= TextUtils.htmlEncode(pluginInformation.getVendorName()) %></td>
                                        <%
                                            if (extendedSystemInfoUtils.isPluginEnabled(plugin))
                                            {
                                        %>
                                            <td><ww:text name="'admin.systeminfo.plugin.enabled'"/></td>
                                        <%
                                            }
                                            else
                                            {
                                        %>
                                            <td><ww:text name="'admin.systeminfo.plugin.disabled'"/></td>
                                        <%
                                            }
                                        %>
                                        <td>
                                            <ul>
                                                <%
                                                    final Map parameters = pluginInformation.getParameters();
                                                    if (parameters != null && !parameters.isEmpty())
                                                    {
                                                        for (Iterator j = parameters.entrySet().iterator(); j.hasNext();)
                                                        {
                                                            Map.Entry entry = (Map.Entry) j.next();
                                                %>
                                                    <li><b><%= TextUtils.htmlEncode(String.valueOf(entry.getKey())) %>:</b> <%= TextUtils.htmlEncode(i18nBean.getText((String) entry.getValue())) %></li>
                                                <%
                                                            }
                                                        }
                                                %>
                                            </ul>
                                        </td>
                                    </tr>
                                <%
                                    }
                                %>
                            </tbody>
                        </table>
                    <%
                        }
                        catch (Exception e)
                        {
                            System.out.println("Error getting plugins");
                            e.printStackTrace();
                        }
                    %>
                    <%-- PLUGINS - end --%>
                </section>
            </div>
        </div>
    </section>
</div>
</body>
</html>

