using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a vertical column group of form items.
    /// </summary>
    public class ControlFormItemGroupColumnVertical : ControlFormItemGroupColumn
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        ///<param name="items">The form controls.</param> 
        public ControlFormItemGroupColumnVertical(string id = null, params ControlFormItem[] items)
            : base(id, items)
        {
        }

        /// <summary>
        /// Initializes the form element.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
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
                Class = Css.Concatenate("wx-form-group-column", GetClasses()),
                Style = GetStyles(),
            };

            var max = 100;
            var offset = 0;

            foreach (var item in Items)
            {
                var div = new HtmlElementTextContentDiv() { Style = "" };
                var width = -1;

                if (Distribution.Count() > offset)
                {
                    width = Distribution.Skip(offset).Take(1).FirstOrDefault();
                    div.Style = $"width: {width}%";
                    max = max - width;

                    offset++;
                }
                else if (Items.Count > offset)
                {
                    width = max / (Items.Count - offset);
                    div.Style = $"width: {width}%";
                }

                if (item is IControlFormItemInput input)
                {
                    var icon = new ControlIcon() { Icon = input?.Icon };
                    var label = default(IHtmlNode);
                    var help = new ControlFormItemHelpText(!string.IsNullOrEmpty(item.Id) ? item.Id + "_help" : string.Empty);
                    var fieldset = new HtmlElementFormFieldset() { Class = "wx-form-group" };

                    if (!string.IsNullOrWhiteSpace(input.Label) && !input.Required)
                    {
                        var text = I18N.Translate(renderGroupContext, input.Label);

                        var l = new ControlFormItemLabel(!string.IsNullOrEmpty(item.Id) ? item.Id + "_label" : string.Empty)
                        {
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
                            TextColor = new PropertyColorText(TypeColorText.Danger)
                        };

                        l.Initialize(renderGroupContext);
                        l.FormItem = item;

                        label = new HtmlElementTextSemanticsSpan()
                        {
                            Class = "wx-form-label"
                        }
                            .Add(l.Render(renderGroupContext, visualTree).RemoveClass("wx-form-label"))
                            .Add(required.Render(renderGroupContext, visualTree))
                            .Add(new HtmlText(":"));
                    }

                    help.Initialize(renderGroupContext);
                    help.Text = I18N.Translate(renderGroupContext.Request?.Culture, input?.Help);

                    if (icon.Icon != null && label == null)
                    {
                        icon.Classes = ["me-2", "pt-1"];
                        fieldset.Add(new HtmlElementTextSemanticsSpan(icon.Render(renderGroupContext, visualTree)));
                    }
                    else if (icon.Icon != null)
                    {
                        icon.Classes = ["me-2", "pt-1"];
                        fieldset.Add(new HtmlElementTextSemanticsSpan(icon.Render(renderGroupContext, visualTree), label)
                        {
                            Style = "display: flex;"
                        });
                    }
                    else if (label != null)
                    {
                        fieldset.Add(label);
                    }

                    fieldset.Add(item.Render(renderGroupContext, visualTree));

                    if (!string.IsNullOrWhiteSpace(input?.Help))
                    {
                        fieldset.Add(help.Render(renderGroupContext, visualTree));
                    }

                    div.Add(fieldset);
                }
                else
                {
                    div.Add(item.Render(renderGroupContext, visualTree));
                }

                html.Add(div);
            }

            return html;
        }
    }
}
