using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a control panel that uses a flexbox layout to arrange its child controls.
    /// </summary>
    public class ControlPanelFlexbox : ControlPanel
    {
        /// <summary>
        /// Returns or sets whether the items should be displayed inline.
        /// </summary>
        public virtual TypeLayoutFlexbox Layout
        {
            get => (TypeLayoutFlexbox)GetProperty(TypeLayoutFlexbox.Default);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Returns or sets the horizontal alignment of the items.
        /// </summary>
        public virtual TypeJustifiedFlexbox Justify
        {
            get => (TypeJustifiedFlexbox)GetProperty(TypeJustifiedFlexbox.Start);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Returns or sets the vertical orientation of the items.
        /// </summary>
        public virtual TypeAlignFlexbox Align
        {
            get => (TypeAlignFlexbox)GetProperty(TypeAlignFlexbox.Start);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Returns or sets the overflow behavior of the items.
        /// </summary>
        public virtual TypeWrap Wrap
        {
            get => (TypeWrap)GetProperty(TypeWrap.Nowrap);
            set => SetProperty(value, () => value.ToClass());
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="content">The flexbox items.</param>
        public ControlPanelFlexbox(string id = null, params IControl[] content)
            : base(id, content)
        {
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            return new HtmlElementTextContentDiv([.. Content.Select(x => x.Render(renderContext, visualTree))])
            {
                Id = Id,
                Class = Css.Concatenate("", GetClasses()),
                Style = GetStyles(),
                Role = Role,
                DataTheme = Theme.ToValue()
            };
        }
    }
}
