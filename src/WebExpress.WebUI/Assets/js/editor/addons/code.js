/**
 * Keeps authored source in the editor model while CodeCtrl owns reading presentation.
 * The preformatted container preserves whitespace and never executes the entered code.
 */
webexpress.webui.EditorAddOns.register("code", {
    label: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.code.label"),
    icon: "code",
    type: "block",
    category: "Content",
    isContainer: true,
    contentClass: "wx-webui-code",
    description: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.code.description"),
    properties: [
        {
            name: "language",
            label: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.code.language"),
            type: "select",
            default: "",
            options: [
                { value: "", label: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.code.plain") },
                ...["bash", "basic", "cmd", "cobol", "cpp", "csharp", "groovy", "java", "javascript", "json", "markdown", "php", "powershell", "property", "python", "visualbasic", "xml"]
                    .map(language => ({ value: language, label: language }))
            ]
        },
        {
            name: "lineNumbers",
            label: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.code.lines"),
            type: "select",
            default: "true",
            options: [
                { value: "true", label: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.code.lines.show") },
                { value: "false", label: webexpress.webui.I18N.translate("webexpress.webui:editor.addon.code.lines.hide") }
            ]
        }
    ],
    content: "<pre></pre>"
});
