using WebExpress.WebCore.WebFragment;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebFragment
{
    /// <summary>
    /// A control that is also a fragment: a reusable UI element a plugin contributes so the
    /// framework can insert it into a designated section of a page (without the page having to know
    /// about it in advance). It is both an <see cref="IControl"/> and a fragment WebUI element.
    /// </summary>
    public interface IFragmentControl : IFragmentWebUIElement<IRenderControlContext, IVisualTreeControl>, IControl
    {
    }

    /// <summary>
    /// Represents a fragment interface with a generic type parameter.
    /// </summary>
    /// <typeparam name="TControl">The type of control that implements the IControl interface.</typeparam>
    public interface IFragmentControl<TControl> : IFragmentControl
        where TControl : class, IControl
    {
        /// <summary>
        /// Gets the context of the fragment.
        /// </summary>
        IFragmentContext FragmentContext { get; }
    }
}
