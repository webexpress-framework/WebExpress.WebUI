using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a radio button input form item control.
    /// </summary>
    /// <remarks>
    /// This class provides the functionality for a radio button input within a form.
    /// </remarks>
    public class ControlFormItemInputRadio : ControlFormItemInput
    {
        /// <summary>
        /// Returns or sets the value of the optiopn.
        /// </summary>
        public string Option { get; set; }

        /// <summary>
        /// Liefert oder setzt ob die Checkbox in einer neuen Zeile angezeigt werden soll
        /// </summary>
        public bool Inline { get; set; }

        /// <summary>
        /// Returns or sets the description.
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Returns or sets a search pattern that checks the content.
        /// </summary>
        public string Pattern { get; set; }

        /// <summary>
        /// Returns or sets whether the radio button is selected
        /// </summary>
        public bool Checked { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputRadio(string id = null)
            : base(id)
        {

        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var value = renderContext?.GetValue(this);

            if (!string.IsNullOrWhiteSpace(value))
            {
                Checked = value == Option;
            }

            var c = new List<string>
            {
                "radio"
            };

            if (Inline)
            {
                c.Add("form-check-inline");
            }

            if (Disabled)
            {
                c.Add("disabled");
            }

            var html = new HtmlElementTextContentDiv
            (
                new HtmlElementFieldLabel
                (
                    new HtmlElementFieldInput()
                    {
                        Id = Id,
                        Name = Name,
                        Pattern = Pattern,
                        Type = "radio",
                        Disabled = Disabled,
                        Checked = Checked,
                        Class = string.Join(" ", Classes.Where(x => !string.IsNullOrWhiteSpace(x))),
                        Style = string.Join("; ", Styles.Where(x => !string.IsNullOrWhiteSpace(x))),
                        Role = Role,
                        Value = Option
                    },
                    new HtmlText(string.IsNullOrWhiteSpace(Description) ? string.Empty : "&nbsp;" + Description)
                )
                {
                }
            )
            {
                Class = string.Join(" ", c.Where(x => !string.IsNullOrWhiteSpace(x)))
            };

            return html;
        }
    }
}
