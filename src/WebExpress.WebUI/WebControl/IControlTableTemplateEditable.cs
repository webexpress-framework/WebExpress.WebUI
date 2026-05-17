using System;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a template control.
    /// </summary>
    public interface IControlTableTemplateEditable : IControlTableTemplate
    {
        /// <summary>
        /// Gets a value indicating whether the current template is editable or read-only.
        /// </summary>
        Func<IRenderControlContext, bool> Editable { get; }
    }
}
