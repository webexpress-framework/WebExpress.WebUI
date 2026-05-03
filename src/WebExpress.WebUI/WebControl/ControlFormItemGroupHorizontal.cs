using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Grouping of controls in a horizontal layout.
    /// </summary>
    public class ControlFormItemGroupHorizontal : ControlFormItemGroup
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        ///<param name="items">The form controls.</param> 
        public ControlFormItemGroupHorizontal(string id = null, params ControlFormItem[] items)
            : base(id, items)
        {
        }

        /// <summary>
        /// Initializes the form element.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="state">The state of the form control, such as New, Update, Submit, or Reset.</param>
        public override void Initialize(IRenderControlFormContext renderContext)
        {
            var renderGroupContext = new RenderControlFormGroupContext(renderContext, this);

            foreach (var item in Items)
            {
                item.Initialize(renderGroupContext);
            }
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var renderGroupContext = new RenderControlFormGroupContext(renderContext, this);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-form-group-horizontal", GetClasses()),
                Style = GetStyles(),
            };

            var body = new HtmlElementTextContentDiv() { };

            foreach (var item in Items)
            {
                var row = new HtmlElementTextContentDiv() { };

                if (item is IControlFormItemInput input)
                {
                    var icon = new ControlIcon() { Icon = input?.Icon };
                    var label = default(IHtmlNode);
                    var help = new ControlFormItemHelpText(!string.IsNullOrEmpty(item.Id) ? item.Id + "_help" : string.Empty);

                    if (!string.IsNullOrWhiteSpace(input.Label) && !input.Required)
                    {
                        var text = I18N.Translate(renderGroupContext, input.Label);

                        var l = new ControlFormItemLabel(!string.IsNullOrEmpty(item.Id) ? item.Id + "_label" : string.Empty)
                        {
                            Classes = ["me-2"],
                            Text = text.EndsWith(":") ? text : text + ":"
                        };

                        l.Initialize(renderGroupContext);
                        l.FormItem = item;

                        label = l.Render(renderGroupContext, visualTree);
                    }
                    else if (!string.IsNullOrWhiteSpace(input.Label))
                    {
                        var text = I18N.Translate(renderGroupContext, input.Label)?.Trim(':');
                        var l = new ControlFormItemLabel(!string.IsNullOrEmpty(item.Id) ? item.Id + "_label" : string.Empty)
                        {
                            Text = text
                        };
                        var required = new ControlFormItemLabel(null)
                        {
                            Text = "*",
                            Classes = ["wx-form-required"],
                            TextColor = _ => new PropertyColorText(TypeColorText.Danger)
                        };

                        l.Initialize(renderGroupContext);
                        l.FormItem = item;

                        label = new HtmlElementTextSemanticsSpan()
                        {
                            Class = "wx-form-label me-2"
                        }
                            .Add(l.Render(renderGroupContext, visualTree).RemoveClass("wx-form-label"))
                            .Add(required.Render(renderGroupContext, visualTree))
                            .Add(new HtmlText(":"));
                    }

                    help.Initialize(renderGroupContext);
                    help.Text = I18N.Translate(renderGroupContext.Request?.Culture, input?.Help);
                    help.Classes = ["ms-2"];

                    if (icon.Icon is not null && label is null)
                    {
                        icon.Classes = ["pt-1"];

                        row.Add(new HtmlElementTextContentDiv(icon.Render(renderGroupContext, visualTree)));
                    }
                    else if (icon.Icon is not null)
                    {
                        icon.Classes = ["pt-1"];

                        row.Add(new HtmlElementTextContentDiv(icon.Render(renderGroupContext, visualTree), label));
                    }
                    else if (label is not null)
                    {
                        row.Add(new HtmlElementTextContentDiv(label));
                    }

                    row.Add(new HtmlElementTextContentDiv(item.Render(renderGroupContext, visualTree)) { });

                    if (!string.IsNullOrWhiteSpace(input?.Help))
                    {
                        row.Add(new HtmlElementTextContentDiv(help.Render(renderGroupContext, visualTree)));
                    }
                }
                else
                {
                    row.Add(new HtmlElementTextContentDiv());
                    row.Add(item.Render(renderGroupContext, visualTree));
                    row.Add(new HtmlElementTextContentDiv());
                }

                body.Add(row);
            }

            html.Add(body);

            return html;
        }
    }
}
