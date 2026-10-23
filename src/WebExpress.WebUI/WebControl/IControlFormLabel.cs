using System;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Contract for a form label, the caption that describes a form field.
    /// </summary>
    public interface IControlFormLabel
    {
        /// <summary>
        /// Gets or sets the label.
        /// </summary>
        Func<IRenderControlContext, string> Label { get; }
    }
}
