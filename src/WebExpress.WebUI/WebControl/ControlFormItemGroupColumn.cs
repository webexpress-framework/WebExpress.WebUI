using System.Collections.Generic;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Groups several form items into a single column so they are laid out together.
    /// </summary>
    public class ControlFormItemGroupColumn : ControlFormItemGroup
    {
        private readonly List<int> _distribution = [];

        /// <summary>
        /// Returns the percentage distribution of the columns.
        /// </summary>
        public IEnumerable<int> Distribution => _distribution;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        ///<param name="items">The form controls.</param> 
        public ControlFormItemGroupColumn(string id = null, params ControlFormItem[] items)
            : base(id, items)
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        ///<param name="items">The form controls.</param> 
        public ControlFormItemGroupColumn(params ControlFormItem[] items)
            : base(null, items)
        {
        }

        /// <summary>
        /// Initializes the form element.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        public override void Initialize(IRenderControlFormContext renderContext)
        {
            var grpupContex = new RenderControlFormGroupContext(renderContext, this);

            foreach (var item in Items)
            {
                item.Initialize(grpupContex);
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
                Class = Css.Concatenate("wx-form-group-horizontal", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
            };

            var body = new HtmlElementTextContentDiv() { };

            foreach (var item in Items)
            {
                var row = new HtmlElementTextContentDiv() { };

                if (item is IControlFormItemInput input)
                {
                    var icon = new ControlIcon() { Icon = _ => input?.Icon?.Invoke(renderContext) };
                    var label = default(IHtmlNode);
                    var help = new ControlFormItemHelpText(!string.IsNullOrEmpty(item.Id) ? item.Id + "_help" : string.Empty);
                    var inputLabel = input.Label?.Invoke(renderContext);
                    var inputRequired = input.Required?.Invoke(renderContext) ?? false;
                    var inputHelp = input.Help?.Invoke(renderContext);

                    if (!string.IsNullOrWhiteSpace(inputLabel) && !inputRequired)
                    {
                        var text = I18N.Translate(renderGroupContext, inputLabel);

                        var l = new ControlFormItemLabel(!string.IsNullOrEmpty(item.Id) ? item.Id + "_label" : string.Empty)
                        {
                            Classes = ["me-2"],
                            Text = _ => text.EndsWith(":") ? text : text + ":"
                        };

                        l.Initialize(renderGroupContext);
                        l.FormItem = item;

                        label = l.Render(renderGroupContext, visualTree);
                    }
                    else if (!string.IsNullOrWhiteSpace(inputLabel))
                    {
                        var text = I18N.Translate(renderGroupContext, inputLabel)?.Trim(':');
                        var l = new ControlFormItemLabel(!string.IsNullOrEmpty(item.Id) ? item.Id + "_label" : string.Empty)
                        {
                            Text = _ => text
                        };
                        var required = new ControlFormItemLabel(null)
                        {
                            Text = _ => "*",
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

                    help.Initialize(renderContext);
                    help.Text = _ => I18N.Translate(renderGroupContext.Request?.Culture, inputHelp);
                    help.Classes = ["ms-2"];

                    if (icon.Icon is not null)
                    {
                        icon.Classes = ["me-2", "pt-1"];

                        row.Add(new HtmlElementTextContentDiv(icon.Render(renderContext, visualTree)));
                    }

                    if (label is not null)
                    {
                        row.Add(new HtmlElementTextContentDiv(label));
                    }

                    row.Add(new HtmlElementTextContentDiv(item.Render(renderContext, visualTree)) { });

                    if (input is not null)
                    {
                        row.Add(new HtmlElementTextContentDiv(help.Render(renderContext, visualTree)));
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
