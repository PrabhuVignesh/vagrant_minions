AJS.test.require("com.atlassian.jira.dev.func-test-plugin:sinon");
AJS.test.require("jira.webresources:select-pickers");

module("AJS.CheckboxMultiSelectSuggestHandler");

test("Does not show duplicate selected values for empty query", function () {
    var $el = jQuery("<select multiple='true'>" +
            "<optgroup label='stuff'><option value='xxx' selected='true'></option></optgroup>" +
            "<optgroup label='more'><option value='xxx' selected='true'></option></optgroup>" +
            "</select>");
    var model = new AJS.SelectModel({
        element: $el
    });
    var suggestHandler = new AJS.CheckboxMultiSelectSuggestHandler({}, model);

    var descriptors = suggestHandler.formatSuggestions([], "");

    equal(descriptors.length, 1);
    var optGroup = descriptors[0];
    equal(optGroup.items().length, 1);
});

test("Footer text only shows for empty query", function () {
    expect(2);
    var $el = jQuery("<select multiple='true'>" +
            "<optgroup label='stuff'><option value='xxx' selected='true'></option></optgroup>" +
            "</select>");
    var model = new AJS.SelectModel({
        element: $el
    });
    var suggestHandler = new JIRA.AssigneeSuggestHandler({ajaxOptions: {url: "", query: true}}, model);
    suggestHandler.execute("").done(function (descriptors) {
        equal("Start Typing for Users", descriptors[0].footerText());
    });
    suggestHandler.execute("a").done(function (descriptors) {
        ok(!descriptors[0].footerText());
    });
});

test("Clear link shows when there are 2 or more suggestions", function () {
    expect(2);
    var $el = jQuery("<select multiple='true'>" +
            "<optgroup label='stuff'><option value='zzz' selected='true'></option><option value='xxx' selected='true'></option></optgroup>" +
            "</select>");
    var model = new AJS.SelectModel({
        element: $el
    });
    var suggestHandler = new AJS.CheckboxMultiSelectSuggestHandler({}, model);

    suggestHandler.execute("").done(function (descriptors) {
        equals(jQuery(descriptors[0].actionBarHtml()).find(".clear-all").length, 1, "expected clear all to be added because there are 2 selected");
    });

    $el = jQuery("<select multiple='true'>" +
            "<optgroup label='stuff'><option value='xxx' selected='true'></option><option value='xxx2'></optgroup>" +
            "</select>");
    model = new AJS.SelectModel({
        element: $el
    });
    suggestHandler = new AJS.CheckboxMultiSelectSuggestHandler({}, model);
    suggestHandler.execute("").done(function (descriptors) {
        equals(jQuery(descriptors[0].actionBarHtml()).find(".clear-all").length, 0, "expected clear all not to be added because there is only 1 selected");
    });
});

test("Queued requests are fired after keyInput period", function () {
    var ajaxDescriptorFetcher = new AJS.AjaxDescriptorFetcher({
        query: true,
        formatResponse: function (data) {
            return new AJS.ItemDescriptor({value: data.correctData, label: data.correctData});
        }});
    var firstRequestSpy = sinon.spy();
    var secondRequestSpy = sinon.spy();
    var clock = sinon.useFakeTimers();
    var server = sinon.fakeServer.create();
    ajaxDescriptorFetcher.execute("a").done(firstRequestSpy);
    ajaxDescriptorFetcher.execute("ab").done(secondRequestSpy);
    clock.tick(300);
    ok(server.requests[0].aborted, "first request should be aborted");
    equals(firstRequestSpy.callCount, 0, "first request should never return.");
    server.requests[1].respond(200, { "Content-Type": "application/json" }, JSON.stringify({correctData: "correctData"}));
    equals(secondRequestSpy.args[0][0].value(), "correctData");

});
