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

                if (item is ControlFormItemInput input)
                {
                    var icon = new ControlIcon() { Icon = input?.Icon };
                    var label = new ControlFormItemLabel(!string.IsNullOrEmpty(item.Id) ? item.Id + "_label" : string.Empty);
                    var help = new ControlFormItemHelpText(!string.IsNullOrEmpty(item.Id) ? item.Id + "_help" : string.Empty);

                    label.Initialize(renderGroupContext);
                    help.Initialize(renderGroupContext);

                    label.Text = I18N.Translate(renderGroupContext.Request?.Culture, input?.Label);
                    label.FormItem = item;
                    label.Classes = ["me-2"];
                    help.Text = I18N.Translate(renderGroupContext.Request?.Culture, input?.Help);
                    help.Classes = ["ms-2"];

                    if (icon.Icon != null && !string.IsNullOrWhiteSpace(label.Text))
                    {
                        icon.Classes = ["me-2", "pt-1"];

                        row.Add(new HtmlElementTextContentDiv(icon.Render(renderGroupContext, visualTree), label.Render(renderGroupContext, visualTree)) { });
                    }
                    else if (!string.IsNullOrWhiteSpace(label.Text))
                    {
                        row.Add(new HtmlElementTextContentDiv(label.Render(renderGroupContext, visualTree)) { });
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
