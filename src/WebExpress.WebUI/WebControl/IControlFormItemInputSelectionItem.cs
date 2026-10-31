using System;
using System.Collections.Generic;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebPage;
using WebExpress.WebCore.WebUri;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Contract for a single selectable option in a selection form input.
    /// </summary>
    public interface IControlFormItemInputSelectionItem : IWebUIElement<IRenderControlContext, IVisualTreeControl>
    {
        /// <summary>
        /// Gets the text of the selection item.
        /// </summary>
        Func<IRenderControlContext, string> Text { get; }

        /// <summary>
        /// Gets the icon associated with the selection item.
        /// </summary>
        Func<IRenderControlContext, IIcon> Icon { get; }

        /// <summary>
        /// Gets or sets the image uri.
        /// </summary>
        Func<IRenderControlContext, IUri> Image { get; set; }

        /// <summary>
        /// Gets the color of the label.
        /// </summary>
        Func<IRenderControlContext, TypeColorSelection> Color { get; }

        /// <summary>
        /// Gets a value indicating whether the selection item is selected.
        /// </summary>
        Func<IRenderControlContext, bool> Selected { get; }

        /// <summary>
        /// Gets a value indicating whether the selection item is disabled.
        /// </summary>
        Func<IRenderControlContext, bool> Disabled { get; }

        /// <summary>
        /// Gets the content of the selection item.
        /// </summary>
        Func<IRenderControlContext, IControl> Content { get; }

        /// <summary>
        /// Gets the values of the field named by
        /// <see cref="IControlFormItemInputSelection.DependsOn"/> for which this option is
        /// offered. An empty or null collection means the option is offered whatever that
        /// field says, which is what an option that does not take part in the dependency
        /// declares.
        /// </summary>
        /// <remarks>
        /// This is the option's half of a dependent selection: the input names the field it
        /// follows, each option names the values of that field it belongs to, and only the
        /// options that fit what is currently chosen there are shown. Both halves are needed,
        /// because neither the field nor a single option can say alone which combinations
        /// exist. The comparison is case-insensitive, so the values need not agree in casing
        /// with what the other field submits.
        /// </remarks>
        Func<IRenderControlContext, IEnumerable<string>> Requires { get; }
    }
}
