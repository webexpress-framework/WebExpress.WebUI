using System;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Interface for form label controls.
    /// </summary>
    public interface IControlFormLabel
    {
        /// <summary>
        /// Gets or sets the label.
        /// </summary>
        Func<IRenderControlContext, string> Label { get; }
    }
}
