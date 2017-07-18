AJS.test.require("jira.webresources:jqlautocomplete");

(function () {
    test("List should use title from AJS.ItemDescriptor", function () {

        var $fixture = AJS.$("#qunit-fixture");
        var list = new AJS.List({containerSelector: $fixture});
        var data = [];
        data[0] = new AJS.ItemDescriptor({highlighted: true,
            label: "Item with title",
            title: "some tile"
        });
        data[1] = new AJS.ItemDescriptor({highlighted: true,
            label: "Item without title "
        });
        data[2] = new AJS.ItemDescriptor({highlighted: true,
            label: "Item with empty tile",
            title: ""
        });

        list.generateListFromJSON(data, "Item");

        var links = AJS.$(".aui-list-item-link", $fixture);

        equal(links.length, 3, "There should be three liknks rendered");

        var link0 = AJS.$(links[0]);
        equal(link0.prop('title'), data[0].title(), "Link have valid title");
        equal(link0.text(), data[0].label(), "Link have valid text");

        var link1 = AJS.$(links[1]);
        equal(link1.prop('title'), data[1].label(), "Link without title should have title deffined as text");
        equal(link1.text(), data[1].label(), "Link have valid text");

        var link2 = AJS.$(links[2]);
        equal(link2.prop('title'), data[2].label(), "Link with empty title should have title deffined as text");
        equal(link2.text(), data[2].label(), "Link have valid text");
    });
})();