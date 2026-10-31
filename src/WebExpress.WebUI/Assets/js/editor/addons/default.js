/**
 * Registers semantic containers whose presentation stays separate from editable content.
 */
[
    ["note", "warning", "note-sticky"],
    ["info", "info", "circle-info"],
    ["warning", "warning", "triangle-exclamation"],
    ["error", "danger", "circle-xmark"],
    ["success", "success", "circle-check"]
].forEach(([name, color, icon]) => {
    const key = "webexpress.webui:editor.addon." + name;
    webexpress.webui.EditorAddOns.register(name + "-box", {
        label: webexpress.webui.I18N.translate(key + ".label"),
        icon,
        type: "block",
        category: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.category.widgets"),
        isContainer: true,
        bodyClass: "alert alert-" + color,
        content: "<p>" + webexpress.webui.I18N.translate(key + ".content") + "</p>",
        description: webexpress.webui.I18N.translate(key + ".description")
    });
});

webexpress.webui.EditorAddOns.register("hr-styled", {
    label: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.hrstyled.label"),
    icon: "minus",
    type: "block",
    category: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.category.layout"),
    content: '<hr style="border: 0; height: 1px; background-image: linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0)); margin:0;">',
    description: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.hrstyled.description")
});

(function () {
    const defaultText = webexpress.webui.I18N.translate("webexpress.webui:editor.addon.badge.default");
    webexpress.webui.EditorAddOns.register("badge-primary", {
        label: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.badge.label"),
        icon: "label",
        type: "inline",
        category: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.category.inline"),
        properties: [{ name: "text", label: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.badge.text"), default: defaultText }],
        renderer: (data) => `<span class="badge bg-primary">${data.text || defaultText}</span>`,
        description: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.badge.description")
    });
})();