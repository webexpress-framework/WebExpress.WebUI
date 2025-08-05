using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a mix of form item group columns.
    /// </summary>
    public class ControlFormItemGroupColumnMix : ControlFormItemGroupColumn
    {
        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        ///<param name="items">The form controls.</param> 
        public ControlFormItemGroupColumnMix(string id = null, params ControlFormItem[] items)
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
                Class = Css.Concatenate("wx-form-group-column-mix", GetClasses()),
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
                    max -= width;

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
                    var label = new ControlFormItemLabel(!string.IsNullOrEmpty(item.Id) ? item.Id + "_label" : string.Empty);
                    var help = new ControlFormItemHelpText(!string.IsNullOrEmpty(item.Id) ? item.Id + "_help" : string.Empty);
                    //var fieldset = new HtmlElementFormFieldset() { Class = "form-group" };
                    var row = new HtmlElementTextContentDiv() { Class = "" };
                    var body = new HtmlElementTextContentDiv(row) { Class = "wx-form-group" };
                    var table = new HtmlElementTextContentDiv(body) { Class = "wx-form-group-horizontal" };

                    label.Initialize(renderGroupContext);
                    help.Initialize(renderGroupContext);

                    label.Text = I18N.Translate(renderGroupContext.Request?.Culture, input?.Label);
                    label.FormItem = item;
                    help.Text = I18N.Translate(renderGroupContext.Request?.Culture, input?.Help);

                    if (icon.Icon != null && string.IsNullOrWhiteSpace(label.Text))
                    {
                        icon.Classes = ["me-2", "pt-1"];
                        row.Add(new HtmlElementTextContentDiv(icon.Render(renderGroupContext, visualTree)));
                    }
                    else if (icon.Icon != null)
                    {
                        icon.Classes = ["me-2", "pt-1"];
                        row.Add(new HtmlElementTextContentDiv(icon.Render(renderGroupContext, visualTree), label.Render(renderGroupContext, visualTree))
                        {
                            Style = "display: flex;"
                        });
                    }
                    else if (!string.IsNullOrWhiteSpace(label.Text))
                    {
                        row.Add(new HtmlElementTextContentDiv(label.Render(renderGroupContext, visualTree)));
                    }

                    if (!string.IsNullOrWhiteSpace(input?.Help))
                    {
                        row.Add(new HtmlElementTextContentDiv(item.Render(renderGroupContext, visualTree), help.Render(renderGroupContext, visualTree)));
                    }
                    else
                    {
                        row.Add(new HtmlElementTextContentDiv(item.Render(renderGroupContext, visualTree)));
                    }

                    div.Add(table);
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
