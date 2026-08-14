using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebIcon;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a master-detail view: an enumeration control on the left and a
    /// detail region on the right, separated by a splitter and kept in sync by
    /// the client-side controller.
    /// </summary>
    /// <remarks>
    /// The control is a composite: it owns the layout and the selection state but
    /// none of the content. The master side takes any enumeration control
    /// (<see cref="ControlList"/>, <see cref="ControlTile"/>, <see cref="ControlTable"/>,
    /// a backlog, …) and the detail side is a <see cref="ControlFrame"/> that
    /// fetches its content on demand, so neither half needs to know the other.
    /// The two halves are injected rather than constructed here, which keeps the
    /// composite reusable for content it was never written against.
    ///
    /// The splitter is not reimplemented; the composite renders a
    /// <see cref="ControlPanelSplit"/> and inherits its dragging, persistence and
    /// content-visibility behaviour. Hiding the detail side therefore also hides
    /// the splitter and restores the previous position when it comes back.
    /// </remarks>
    public class ControlMasterDetail : Control, IControlMasterDetail
    {
        private readonly List<IControl> _master = [];

        /// <summary>
        /// Returns the controls that make up the master side.
        /// </summary>
        public IEnumerable<IControl> Master => _master;

        /// <summary>
        /// Gets or sets the frame that loads the detail content on demand.
        /// </summary>
        public ControlFrame Detail { get; set; }

        /// <summary>
        /// Gets or sets the placeholder shown while no item is selected.
        /// </summary>
        public ControlEmptyState EmptyState { get; set; }

        /// <summary>
        /// Gets or sets the uri template used when a master item carries an id but
        /// no uri of its own. The placeholder <c>{id}</c> is replaced by the id of
        /// the selected item.
        /// </summary>
        public Func<IRenderControlContext, string> DetailUriTemplate { get; set; }

        /// <summary>
        /// Gets or sets the css selector that identifies a selectable item within
        /// the master side. Leave unset to use the selectors of the built-in
        /// enumeration controls.
        /// </summary>
        public Func<IRenderControlContext, string> ItemSelector { get; set; }

        /// <summary>
        /// Gets or sets the width in pixels below which the control switches to
        /// the sequential single-column mode.
        /// </summary>
        public Func<IRenderControlContext, int> Breakpoint { get; set; } = _ => 768;

        /// <summary>
        /// Gets or sets whether the detail side is visible initially.
        /// </summary>
        public Func<IRenderControlContext, bool> DetailVisible { get; set; } = _ => true;

        /// <summary>
        /// Gets or sets whether the detail side carries a close button. Turn it
        /// off for a view whose detail side must always stay open; hiding it
        /// through the toggle action remains possible either way.
        /// </summary>
        public Func<IRenderControlContext, bool> Closable { get; set; } = _ => true;

        /// <summary>
        /// Gets or sets the initial size of the master side. The value is
        /// interpreted in the configured <see cref="Unit"/>, which defaults to
        /// percent, so the master takes roughly a third of the available width.
        /// </summary>
        public Func<IRenderControlContext, int> MasterInitialSize { get; set; } = _ => 30;

        /// <summary>
        /// Gets or sets the smallest size in pixels a drag may shrink the master
        /// side to. The master carries the only navigation of the view, so it is
        /// never draggable out of sight; the default keeps a usable list width.
        /// </summary>
        public Func<IRenderControlContext, int> MasterMinSize { get; set; } = _ => 180;

        /// <summary>
        /// Gets or sets the largest size in pixels a drag may grow the master side
        /// to. Values below zero leave the constraint unset.
        /// </summary>
        public Func<IRenderControlContext, int> MasterMaxSize { get; set; } = _ => -1;

        /// <summary>
        /// Gets or sets the unit in which the master sizes are expressed.
        /// </summary>
        public Func<IRenderControlContext, TypeSizeUnit> Unit { get; set; } = _ => TypeSizeUnit.Percent;

        /// <summary>
        /// Gets or sets the color of the splitter.
        /// </summary>
        public Func<IRenderControlContext, PropertyColorBackground> SplitterColor { get; set; } = _ => new PropertyColorBackground(TypeColorBackground.Default);

        /// <summary>
        /// Gets or sets the width of the splitter in pixels.
        /// </summary>
        public Func<IRenderControlContext, int> SplitterSize { get; set; } = _ => -1;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        /// <param name="master">The controls that make up the master side.</param>
        public ControlMasterDetail(string id = null, params IControl[] master)
            : base(id)
        {
            _master.AddRange(master.Where(x => x is not null));

            Detail = new ControlFrame($"{Id}-frame");
            EmptyState = new ControlEmptyState()
            {
                Icon = _ => new IconRectangleList(),
                Title = renderContext => I18N.Translate(renderContext, "webexpress.webui:masterdetail.empty.title"),
                Message = renderContext => I18N.Translate(renderContext, "webexpress.webui:masterdetail.empty.message")
            };
        }

        /// <summary>
        /// Adds one or more controls to the master side.
        /// </summary>
        /// <param name="controls">The controls to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlMasterDetail AddMaster(params IControl[] controls)
        {
            _master.AddRange(controls.Where(x => x is not null));

            return this;
        }

        /// <summary>
        /// Removes a control from the master side.
        /// </summary>
        /// <param name="control">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public IControlMasterDetail RemoveMaster(IControl control)
        {
            _master.Remove(control);

            return this;
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree)
        {
            var breakpoint = Breakpoint?.Invoke(renderContext) ?? 768;
            var detailVisible = DetailVisible?.Invoke(renderContext) ?? true;
            var closable = Closable?.Invoke(renderContext) ?? true;
            var itemSelector = ItemSelector?.Invoke(renderContext);
            var detailUriTemplate = DetailUriTemplate?.Invoke(renderContext);

            var masterPanel = new ControlPanel($"{Id}-master", [.. _master])
            {
                Classes = ["wx-master"]
            };

            // the placeholder and the frame are siblings so the client can swap
            // them without another round trip; the frame stays empty until the
            // first selection resolves a uri for it
            var detailPanel = new ControlPanel
            (
                $"{Id}-detail",
                new ControlPanel(null, EmptyState, Detail) { Classes = ["wx-detail-body"] }
            )
            {
                Classes = ["wx-detail"]
            };

            var split = new ControlPanelSplit($"{Id}-split", [masterPanel], [detailPanel])
            {
                Orientation = _ => TypeOrientationSplit.Horizontal,
                Order = _ => TypeSplitOrder.SideMain,
                SidePanelInitialSize = MasterInitialSize,
                SidePanelMinSize = MasterMinSize,
                SidePanelMaxSize = MasterMaxSize,
                // the master is the navigation of this view: dragging it away
                // would leave nothing to select from and no way back, so the
                // splitter stops at the minimum instead of collapsing it
                Collapsible = _ => false,
                Unit = Unit,
                SplitterColor = SplitterColor,
                SplitterSize = SplitterSize
            };

            return new HtmlElementTextContentDiv(split.Render(renderContext, visualTree))
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-master-detail", GetClasses(renderContext)),
                Style = GetStyles(renderContext),
                Role = Role?.Invoke(renderContext)
            }
                .AddUserAttribute("data-breakpoint", breakpoint > 0 ? breakpoint.ToString() : null)
                .AddUserAttribute("data-item", itemSelector)
                .AddUserAttribute("data-detail-uri", detailUriTemplate)
                .AddUserAttribute("data-detail-visible", detailVisible ? null : "false")
                .AddUserAttribute("data-closable", closable ? null : "false");
        }
    }
}
