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
        category: "Widgets",
        isContainer: true,
        bodyClass: "alert alert-" + color,
        content: "<p>" + webexpress.webui.I18N.translate(key + ".content") + "</p>",
        description: webexpress.webui.I18N.translate(key + ".description")
    });
});

webexpress.webui.EditorAddOns.register("hr-styled", {
    label: "Styled Line",
    icon: "minus",
    type: "block",
    category: "Layout",
    content: '<hr style="border: 0; height: 1px; background-image: linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0)); margin:0;">',
    description: "Inserts a gradient horizontal rule."
});

webexpress.webui.EditorAddOns.register("badge-primary", {
    label: "Badge (Blue)",
    icon: "label",
    type: "inline",
    category: "Inline",
    properties: [{ name: "text", label: "Text", default: "New" }],
    renderer: (data) => `<span class="badge bg-primary">${data.text || 'New'}</span>`,
    description: "Inline badge."
});