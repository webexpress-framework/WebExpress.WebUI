using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebCore.WebIcon;
using WebExpress.WebCore.WebScope;
using WebExpress.WebCore.WebSection;
using WebExpress.WebCore.WebTheme;
using WebExpress.WebUI.WebFragment;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;
using WebExpress.WebUI.WebSection;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// An enclosing frame around content that belongs together, used to set that content apart
    /// from the page, to organize it, or to draw the eye to it.
    /// </summary>
    /// <remarks>
    /// A <see cref="ControlPanelCard"/> is a surface with a filled header bar and a footer; a
    /// <see cref="ControlPanelCallout"/> is a colored note; a <see cref="ControlSection"/> draws
    /// no frame at all. The box sits between them: it draws exactly one frame, chosen through
    /// <see cref="Layout"/>, around content it otherwise leaves alone. Which frame is the whole
    /// statement - a hairline groups, a dashed line marks something provisional, a raised surface
    /// lifts content out of the flow - so the frame is the one property the control is built
    /// around.
    /// <para>
    /// The content is composed from three sources, in this order: fragments registered for
    /// <see cref="SectionBoxPreferences"/> and <see cref="SectionBoxPrimary"/>, the controls
    /// added directly, and fragments registered for <see cref="SectionBoxSecondary"/>. The
    /// sections resolve against the runtime type of the box, so a plugin that contributes to a
    /// box declares <c>[Scope&lt;TheBoxType&gt;]</c> and reaches exactly that box - which is
    /// why the control is an <see cref="IScope"/>.
    /// </para>
    /// <para>
    /// Like <see cref="ControlPanelCard"/>, the C# side emits only a host element carrying the
    /// <c>wx-webui-box</c> class and the relevant <c>data-*</c> attributes; the header and the
    /// body are built at runtime by <c>webexpress.webui.BoxCtrl</c>. The same controller adopts
    /// the reading view of the editor's box add-on, so a box authored in rich text and a box
    /// declared in C# are one and the same thing on the page.
    /// </para>
    /// </remarks>
    public class ControlBox : ControlPanel, IScope
    {
        /// <summary>
        /// Gets or sets the label shown at the top of the box. Accepts a resource key, which is
        /// resolved against the culture of the request like every other caption.
        /// </summary>
        public Func<IRenderControlContext, string> Header { get; set; }

        /// <summary>
        /// Gets or sets the icon shown before the label. The icon can be image-based
        /// (<see cref="ImageIcon"/>) or CSS-based (any <see cref="Icon"/>).
        /// </summary>
        public Func<IRenderControlContext, IIcon> HeaderIcon { get; set; }

        /// <summary>
        /// Gets or sets the accent color of the box: the frame and the label take it, while the
        /// body keeps the body color so the content stays readable.
        /// </summary>
        /// <remarks>
        /// The accent colors the frame the layout draws, whatever that frame is - the hairline,
        /// the bar of <see cref="TypeLayoutBox.Accent"/>, the tint of
        /// <see cref="TypeLayoutBox.Inset"/> - so a box keeps one color property across every
        /// layout instead of one per kind of line.
        /// </remarks>
        public Func<IRenderControlContext, PropertyColorText> Color { get; set; }

        /// <summary>
        /// Gets or sets the frame of the box.
        /// </summary>
        public Func<IRenderControlContext, TypeLayoutBox> Layout { get; set; } = _ => TypeLayoutBox.Solid;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="controls">The child controls that make up the box body.</param>
        public ControlBox(string id = null, params IControl[] controls)
            : base(id, controls)
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
            var theme = Theme?.Invoke(renderContext) ?? TypeTheme.None;
            var header = Header?.Invoke(renderContext);
            var headerIcon = HeaderIcon?.Invoke(renderContext);
            var color = Color?.Invoke(renderContext);
            var layout = Layout?.Invoke(renderContext) ?? TypeLayoutBox.Solid;

            // the layout travels as a data attribute rather than as a class because the editor's
            // box add-on persists it the same way, and one attribute lets the controller serve
            // both the control and the reading view of the add-on
            return new HtmlElementTextContentDiv([.. RenderBody(renderContext, visualTree)])
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-box", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext)
            }
                .AddUserAttribute("data-wx-theme", theme.ToValue())
                .AddUserAttribute("data-layout", layout.ToValue())
                .AddUserAttribute("data-header", I18N.Translate(renderContext, header))
                .AddUserAttribute("data-header-icon-css", (headerIcon as Icon)?.Class)
                .AddUserAttribute("data-header-icon-image", (headerIcon as ImageIcon)?.Uri?.ToString())
                .AddUserAttribute("data-color-class", color?.ToClass())
                .AddUserAttribute("data-color-style", color?.ToStyle());
        }

        /// <summary>
        /// Renders the body: the fragments of the preferences and primary sections, the controls
        /// added directly, and the fragments of the secondary section, in that order.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>The rendered body nodes.</returns>
        protected virtual IEnumerable<IHtmlNode> RenderBody(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var fragmentManager = WebEx.ComponentHub?.FragmentManager;
            var applicationContext = renderContext?.PageContext?.ApplicationContext;

            // the runtime type is the scope, so a subclass of the box - not every box - is what
            // a contributing fragment addresses
            IEnumerable<IFragmentControl> Fragments<TSection>() where TSection : ISection
                => fragmentManager?.GetFragments<IFragmentControl, TSection>(applicationContext, [GetType()]) ?? [];

            var nodes = Fragments<SectionBoxPreferences>()
                .Concat(Fragments<SectionBoxPrimary>())
                .Select(x => x.Render(renderContext, visualTree))
                .Concat(Content.Select(x => x?.Render(renderContext, visualTree)))
                .Concat(Fragments<SectionBoxSecondary>().Select(x => x.Render(renderContext, visualTree)));

            return nodes.Where(x => x is not null);
        }
    }
}
