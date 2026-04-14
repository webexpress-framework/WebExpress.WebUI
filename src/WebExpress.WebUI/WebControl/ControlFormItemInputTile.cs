using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a tile picker input control.
    /// </summary>
    public class ControlFormItemInputTile : ControlFormItemInput<ControlFormInputValueStringList>, IControlFormItemInputTile
    {
        private readonly List<IControlTileCard> _items = [];

        /// <summary>
        /// Returns the items of the tile control.
        /// </summary>
        public IEnumerable<IControlTileCard> Items => _items;

        /// <summary>
        /// Gets or sets a value indicating whether multiple items can be selected simultaneously.
        /// </summary>
        public bool MultiSelect { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether a large icon is displayed 
        /// for the item.
        /// </summary>
        public bool LargeIcon { get; set; }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormItemInputTile()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputTile(string id)
            : base(id)
        {
            Margin = new PropertySpacingMargin(PropertySpacing.Space.None, PropertySpacing.Space.Two, PropertySpacing.Space.None, PropertySpacing.Space.None);
        }

        /// <summary>
        /// Adds one or more items to the tile control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemInputTile Add(params IControlTileCard[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds one or more items to the tile control.
        /// </summary>
        /// <param name="items">The items to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemInputTile Add(IEnumerable<IControlTileCard> items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes the specified control from the tile control.
        /// </summary>
        /// <param name="item">The control to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemInputTile Remove(IControlTileCard item)
        {
            _items.Remove(item);

            return this;
        }

        /// <summary>
        /// Initializes the form element.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        public override void Initialize(IRenderControlFormContext renderContext)
        {
            base.Initialize(renderContext);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var id = Id;
            var classes = new List<string>(Classes);
            var value = renderContext.GetValue<ControlFormInputValueStringList>(this)?.ToString
            (
                null,
                renderContext?.Request?.Culture
            );

            if (Disabled)
            {
                classes.Add("disabled");
            }

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-input-tile", classes),
                Style = string.Join("; ", Styles.Where(x => !string.IsNullOrWhiteSpace(x))),
                Role = Role
            }
                .AddUserAttribute("name", Name)
                .AddUserAttribute("data-value", value)
                .AddUserAttribute("data-multiselect", MultiSelect ? "true" : null)
                .AddUserAttribute("data-large-icon", LargeIcon ? "true" : null)
                .Add
                (
                    _items.Select
                    (
                        x =>
                        x.Render(renderContext, visualTree)
                    )
                );

            return html;
        }

        /// <summary>
        /// Validates the input elements within a form for correctness of the data.
        /// </summary>
        /// <param name="renderContext">The context in which the inputs are validated, containing form data and state.</param>
        /// <returns>A collection of <see cref="ValidationResult"/> objects representing the validation 
        /// results for each input element. Each result indicates whether the input is valid or contains errors.
        /// </returns>
        public override IEnumerable<ValidationResult> Validate(IRenderControlFormContext renderContext)
        {
            var validationResults = new List<ValidationResult>(base.Validate(renderContext));
            //var value = renderContext.GetValue<ControlFormInputValueString>(this)?.Text;

            if (Disabled)
            {
                return [];
            }

            return validationResults;
        }

        /// <summary>
        /// Creates an value from the specified string representation.
        /// </summary>
        /// <param name="value">
        /// The string representation of the value to be converted. Cannot be null.
        /// </param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>
        /// The value created from the specified string representation.
        /// </returns>
        protected override ControlFormInputValueStringList CreateValue(string value, IRenderControlFormContext renderContext)
        {
            // create a new instance using the semicolon separated string
            return new ControlFormInputValueStringList(value);
        }
    }
}
