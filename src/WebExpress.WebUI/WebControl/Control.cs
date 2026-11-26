using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Abstract base class for all controls.
    /// </summary>
    public abstract class Control : IControl
    {
        // the defaults of every control are shared, immutable values whose css is known up
        // front; a page constructs and renders hundreds of controls per request, and creating
        // the values and their callbacks anew for each one was most of what a control allocated
        private static readonly PropertyColorBackground _defaultBackgroundColorValue = new(TypeColorBackground.Default);
        private static readonly PropertySpacingPadding _defaultPaddingValue = new(PropertySpacing.Space.None);
        private static readonly PropertySpacingMargin _defaultMarginValue = new(PropertySpacing.Space.None);
        private static readonly Func<IRenderControlContext, TypeHorizontalAlignment> _defaultHorizontalAlignment = _ => TypeHorizontalAlignment.Default;
        private static readonly Func<IRenderControlContext, PropertyColorBackground> _defaultBackgroundColor = _ => _defaultBackgroundColorValue;
        private static readonly Func<IRenderControlContext, PropertySpacingPadding> _defaultPadding = _ => _defaultPaddingValue;
        private static readonly Func<IRenderControlContext, PropertySpacingMargin> _defaultMargin = _ => _defaultMarginValue;
        private static readonly Func<IRenderControlContext, string> _defaultHorizontalAlignmentClass = Constant(TypeHorizontalAlignment.Default.ToClass());
        private static readonly Func<IRenderControlContext, string> _defaultBackgroundColorClass = Constant(_defaultBackgroundColorValue.ToClass());
        private static readonly Func<IRenderControlContext, string> _defaultBackgroundColorStyle = Constant(_defaultBackgroundColorValue.ToStyle());
        private static readonly Func<IRenderControlContext, string> _defaultPaddingClass = Constant(_defaultPaddingValue.ToClass());
        private static readonly Func<IRenderControlContext, string> _defaultMarginClass = Constant(_defaultMarginValue.ToClass());

        private readonly Dictionary<string, PropertyEntry> _propertys = new(8);

        /// <summary>
        /// Gets or sets the id of the control.
        /// </summary>
        public string Id { get; protected set; }

        /// <summary>
        /// Gets or sets the text color.
        /// </summary>
        public virtual Func<IRenderControlContext, PropertyColorText> TextColor
        {
            get => (Func<IRenderControlContext, PropertyColorText>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext)?.ToClass(), (renderContext) => value?.Invoke(renderContext)?.ToStyle());
        }

        /// <summary>
        /// Gets or sets the background color.
        /// </summary>
        public virtual Func<IRenderControlContext, PropertyColorBackground> BackgroundColor
        {
            get => (Func<IRenderControlContext, PropertyColorBackground>)GetPropertyObjectValue();
            set
            {
                if (ReferenceEquals(value, _defaultBackgroundColor))
                {
                    SetProperty(value, _defaultBackgroundColorClass, _defaultBackgroundColorStyle);
                    return;
                }

                SetProperty(value, ClassOf(value), StyleOf(value));
            }
        }

        /// <summary>
        /// Gets or sets the border color.
        /// </summary>
        public virtual Func<IRenderControlContext, PropertyColorBorder> BorderColor
        {
            get => (Func<IRenderControlContext, PropertyColorBorder>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext)?.ToClass(), (renderContext) => value?.Invoke(renderContext)?.ToStyle());
        }

        /// <summary>
        /// Gets or sets the padding.
        /// </summary>
        public virtual Func<IRenderControlContext, PropertySpacingPadding> Padding
        {
            get => (Func<IRenderControlContext, PropertySpacingPadding>)GetPropertyObjectValue();
            set => SetProperty(value, ReferenceEquals(value, _defaultPadding) ? _defaultPaddingClass : ClassOf(value));
        }

        /// <summary>
        /// Gets or sets the margin.
        /// </summary>
        public virtual Func<IRenderControlContext, PropertySpacingMargin> Margin
        {
            get => (Func<IRenderControlContext, PropertySpacingMargin>)GetPropertyObjectValue();
            set => SetProperty(value, ReferenceEquals(value, _defaultMargin) ? _defaultMarginClass : ClassOf(value));
        }

        /// <summary>
        /// Gets or sets the border.
        /// </summary>
        public virtual Func<IRenderControlContext, PropertyBorder> Border
        {
            get => (Func<IRenderControlContext, PropertyBorder>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext)?.ToClass());
        }

        /// <summary>
        /// Gets or sets the column property if the control is on a grid.
        /// </summary>
        public virtual Func<IRenderControlContext, PropertyGrid> GridColumn
        {
            get => (Func<IRenderControlContext, PropertyGrid>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext)?.ToClass());
        }

        /// <summary>
        /// Gets or sets the width property of the control.
        /// </summary>
        public virtual Func<IRenderControlContext, TypeWidth> Width
        {
            get => (Func<IRenderControlContext, TypeWidth>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext).ToClass());
        }

        /// <summary>
        /// Gets or sets the height property of the control.
        /// </summary>
        public virtual Func<IRenderControlContext, TypeHeight> Height
        {
            get => (Func<IRenderControlContext, TypeHeight>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext).ToClass());
        }

        /// <summary>
        /// Gets or sets the flex grow property of the control.
        /// </summary>
        public virtual Func<IRenderControlContext, TypeFlexGrow> FlexGrow
        {
            get => (Func<IRenderControlContext, TypeFlexGrow>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext).ToClass());
        }

        /// <summary>
        /// Gets or sets the display type for the current object.
        /// </summary>
        /// <remarks>
        /// This property determines how the object is visually represented. Setting this
        /// property may involve converting the value to a class representation.
        /// </remarks>
        public virtual Func<IRenderControlContext, TypeDisplay> Display
        {
            get => (Func<IRenderControlContext, TypeDisplay>)GetPropertyObjectValue();
            set => SetProperty(value, (renderContext) => value?.Invoke(renderContext).ToClass());
        }

        /// <summary>
        /// Gets or sets the horizontal alignment.
        /// </summary>
        public virtual Func<IRenderControlContext, TypeHorizontalAlignment> HorizontalAlignment
        {
            get => (Func<IRenderControlContext, TypeHorizontalAlignment>)GetPropertyObjectValue();
            set => SetProperty(value, ReferenceEquals(value, _defaultHorizontalAlignment) ? _defaultHorizontalAlignmentClass : ClassOf(value));
        }

        /// <summary>
        /// Gets or sets the css class.
        /// </summary>
        public IEnumerable<string> Classes { get; set; } = [];

        /// <summary>
        /// Gets or sets the css style.
        /// </summary>
        public IEnumerable<string> Styles { get; set; } = [];

        /// <summary>
        /// Gets or sets the role.
        /// </summary>
        public Func<IRenderControlContext, string> Role { get; set; }

        /// <summary>
        /// Determines whether the control is active and rendering.
        /// </summary>
        public Func<IRenderControlContext, bool> Enable { get; set; } = _ => true;

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The control id.</param>
        public Control(string id = null)
        {
            Id = id?.Replace('.', '-');

            // through the virtual setters, as a derived control may keep a property elsewhere
            HorizontalAlignment = _defaultHorizontalAlignment;
            BackgroundColor = _defaultBackgroundColor;
            Padding = _defaultPadding;
            Margin = _defaultMargin;
        }

        /// <summary>
        /// Returns a callback that answers the given css for every render.
        /// </summary>
        /// <param name="css">The css class or style, or null for none.</param>
        /// <returns>The callback.</returns>
        private static Func<IRenderControlContext, string> Constant(string css) => _ => css;

        /// <summary>
        /// Returns the callback that determines the css class of a property value.
        /// </summary>
        /// <remarks>
        /// A setter capturing its value in a lambda allocates the closure on entry, even on the
        /// path for a default value that needs none; the capture is therefore made here.
        /// </remarks>
        /// <typeparam name="TProperty">The type of the property value.</typeparam>
        /// <param name="value">The property value.</param>
        /// <returns>The callback.</returns>
        private static Func<IRenderControlContext, string> ClassOf<TProperty>(Func<IRenderControlContext, TProperty> value)
            where TProperty : class, IProperty
        {
            return renderContext => value?.Invoke(renderContext)?.ToClass();
        }

        /// <summary>
        /// Returns the callback that determines the css style of a property value.
        /// </summary>
        /// <typeparam name="TProperty">The type of the property value.</typeparam>
        /// <param name="value">The property value.</param>
        /// <returns>The callback.</returns>
        private static Func<IRenderControlContext, string> StyleOf<TProperty>(Func<IRenderControlContext, TProperty> value)
            where TProperty : class, IProperty
        {
            return renderContext => value?.Invoke(renderContext)?.ToStyle();
        }

        /// <summary>
        /// Returns the callback that determines the css class of a horizontal alignment.
        /// </summary>
        /// <param name="value">The horizontal alignment.</param>
        /// <returns>The callback.</returns>
        private static Func<IRenderControlContext, string> ClassOf(Func<IRenderControlContext, TypeHorizontalAlignment> value)
        {
            return renderContext => value?.Invoke(renderContext).ToClass();
        }

        /// <summary>
        /// Returns a property.
        /// </summary>
        /// <param name="defaultValue">The default value.</param>
        /// <param name="propertyName">The name of the property.</param>
        /// <returns>The value.</returns>
        protected Enum GetProperty(Enum defaultValue, [CallerMemberName] string propertyName = "")
        {
            if (_propertys.TryGetValue(propertyName, out var item))
            {
                return (Enum)item.Value;
            }

            return defaultValue;
        }

        /// <summary>
        /// Returns a property.
        /// </summary>
        /// <param name="propertyName">The name of the property.</param>
        /// <returns>The value.</returns>
        protected Enum GetProperty([CallerMemberName] string propertyName = "")
        {
            if (_propertys.TryGetValue(propertyName, out var item))
            {
                return (Enum)item.Value;
            }

            return null;
        }

        /// <summary>
        /// Returns a property.
        /// </summary>
        /// <param name="propertyName">The name of the property.</param>
        /// <returns>The value.</returns>
        protected IProperty GetPropertyObject([CallerMemberName] string propertyName = "")
        {
            if (_propertys.TryGetValue(propertyName, out var item))
            {
                return (IProperty)item.Value;
            }

            return null;
        }

        /// <summary>
        /// Returns a property.
        /// </summary>
        /// <param name="propertyName">The name of the property.</param>
        /// <returns>The value.</returns>
        protected object GetPropertyObjectValue([CallerMemberName] string propertyName = "")
        {
            if (_propertys.TryGetValue(propertyName, out var item))
            {
                return item.Value;
            }

            return null;
        }

        /// <summary>
        /// Returns a property value.
        /// </summary>
        /// <param name="propertyName">The name of the property.</param>
        /// <returns>The value.</returns>
        protected string GetPropertyValue([CallerMemberName] string propertyName = "")
        {
            if (_propertys.TryGetValue(propertyName, out var item))
            {
                return item.Class?.Invoke(null);
            }

            return null;
        }

        /// <summary>
        /// Stores a property.
        /// </summary>
        /// <param name="value">The value.</param>
        /// <param name="callbackClass">The callback function to determine the css class.</param>
        /// <param name="callbackStyle">The callback function to determine the css style.</param>
        /// <param name="propertyName">The name of the property.</param>
        protected void SetProperty(Enum value, Func<IRenderControlContext, string> callbackClass, Func<IRenderControlContext, string> callbackStyle = null, [CallerMemberName] string propertyName = "")
        {
            _propertys[propertyName] = new(value, callbackClass, callbackStyle);
        }

        /// <summary>
        /// Stores a property.
        /// </summary>
        /// <param name="value">The value.</param>
        /// <param name="callbackClass">The callback function to determine the css class.</param>
        /// <param name="callbackStyle">The callback function to determine the css style.</param>
        /// <param name="propertyName">The name of the property.</param>
        protected void SetProperty(IProperty value, Func<IRenderControlContext, string> callbackClass, Func<IRenderControlContext, string> callbackStyle = null, [CallerMemberName] string propertyName = "")
        {
            _propertys[propertyName] = new(value, callbackClass, callbackStyle);
        }

        /// <summary>
        /// Stores a property.
        /// </summary>
        /// <param name="value">The value.</param>
        /// <param name="callbackClass">The callback function to determine the css class.</param>
        /// <param name="callbackStyle">The callback function to determine the css style.</param>
        /// <param name="propertyName">The name of the property.</param>
        protected void SetProperty(Func<IRenderControlContext, string> callbackClass, Func<IRenderControlContext, string> callbackStyle = null, [CallerMemberName] string propertyName = "")
        {
            _propertys[propertyName] = new(null, callbackClass, callbackStyle);
        }

        /// <summary>
        /// Stores a property.
        /// </summary>
        /// <param name="value">The value.</param>
        /// <param name="callbackClass">The callback function to determine the css class.</param>
        /// <param name="callbackStyle">The callback function to determine the css style.</param>
        /// <param name="propertyName">The name of the property.</param>
        protected void SetProperty(object value, Func<IRenderControlContext, string> callbackClass, Func<IRenderControlContext, string> callbackStyle = null, [CallerMemberName] string propertyName = "")
        {
            _propertys[propertyName] = new(value, callbackClass, callbackStyle);
        }

        /// <summary>
        /// Returns all css classes.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>The css classes.</returns>
        /// <remarks>
        /// Every control calls it on every render, so it allocates nothing for a control that
        /// declares no class and whose properties yield none.
        /// </remarks>
        protected string GetClasses(IRenderControlContext renderContext)
        {
            return Join(Classes, renderContext, styles: false);
        }

        /// <summary>
        /// Returns all css styles.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>The css styles.</returns>
        /// <remarks>
        /// Every control calls it on every render, so it allocates nothing for a control that
        /// declares no style and whose properties yield none.
        /// </remarks>
        protected string GetStyles(IRenderControlContext renderContext)
        {
            return Join(Styles, renderContext, styles: true);
        }

        /// <summary>
        /// Joins the declared css with the css the properties yield for the render: the
        /// declared entries first, then those of the properties in the order they were first
        /// set, each entry once.
        /// </summary>
        /// <remarks>
        /// A declared null or empty entry is kept once, as an empty entry, while an empty
        /// result of a property is left out; the html of a control depends on both.
        /// </remarks>
        /// <param name="declared">The css classes or styles set on the control.</param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="styles">True to join the styles, false to join the classes.</param>
        /// <returns>The entries separated by a blank, or an empty string for none.</returns>
        private string Join(IEnumerable<string> declared, IRenderControlContext renderContext, bool styles)
        {
            List<string> entries = null;

            foreach (var entry in declared ?? [])
            {
                AddOnce(ref entries, entry);
            }

            foreach (var property in _propertys.Values)
            {
                var css = (styles ? property.Style : property.Class)?.Invoke(renderContext);

                if (!string.IsNullOrEmpty(css))
                {
                    AddOnce(ref entries, css);
                }
            }

            return entries switch
            {
                null => string.Empty,
                [var single] => single ?? string.Empty,
                _ => string.Join(" ", entries)
            };
        }

        /// <summary>
        /// Adds an entry that is not yet present.
        /// </summary>
        /// <remarks>
        /// A control carries a handful of entries, so a linear search costs less than the hash
        /// set it replaces.
        /// </remarks>
        /// <param name="entries">The entries, created with the first one.</param>
        /// <param name="entry">The entry to add.</param>
        private static void AddOnce(ref List<string> entries, string entry)
        {
            entries ??= [with(4)];

            if (!entries.Contains(entry))
            {
                entries.Add(entry);
            }
        }

        /// <summary>
        /// Returns all attributes.
        /// </summary>
        /// <returns>The attributes.</returns>
        protected string GetAttributes()
        {
            var list = _propertys
                .Where(x => x.Value.Class is not null)
                .Where(x => x.Value.Style is not null)
                .Select(x => $"{x.Key}=\"{x.Value.Value}\"")
                .Distinct();

            return string.Join(" ", list);
        }

        /// <summary>
        /// A stored property: its value and the callbacks that turn it into css.
        /// </summary>
        /// <param name="Value">The value.</param>
        /// <param name="Class">The callback that determines the css class, if any.</param>
        /// <param name="Style">The callback that determines the css style, if any.</param>
        private readonly record struct PropertyEntry
        (
            object Value,
            Func<IRenderControlContext, string> Class,
            Func<IRenderControlContext, string> Style
        );

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public abstract IHtmlNode Render(IRenderControlContext renderContext, IVisualTreeControl visualTree);
    }
}
