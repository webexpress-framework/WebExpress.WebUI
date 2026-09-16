/**
 * Registers the box as an editor add-on: a container the author types into, framed the way
 * webexpress.webui.BoxCtrl frames a ControlBox. The frame and the label are properties of the
 * add-on and persist on its frame element; the reading view hands the block to BoxCtrl through
 * the content class, so the reader gets the same box the C# control renders.
 *
 * This file is included after the i18n dictionaries on purpose: the labels are resolved at
 * registration time, and the property dialog and the picker read them as plain strings.
 */
webexpress.webui.EditorAddOns.register("box", {
    label: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.box.label"),
    icon: "control-box",
    type: "block",
    category: "Layout",
    isContainer: true,
    contentClass: "wx-webui-box",
    description: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.box.description"),
    properties: [
        {
            name: "layout",
            label: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.box.layout"),
            type: "select",
            default: webexpress.webui.BoxCtrl.LAYOUTS[0],
            options: webexpress.webui.BoxCtrl.LAYOUTS.map(layout => ({
                value: layout,
                label: webexpress.webui.I18N.translate("webexpress.webui:box.layout." + layout)
            }))
        },
        {
            name: "header",
            label: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.box.header"),
            type: "text",
            default: ""
        }
    ],
    content: "<p>" + webexpress.webui.I18N.translate("webexpress.webui:editor.addon.box.content") + "</p>"
});
