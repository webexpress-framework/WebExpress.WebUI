using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A form input that lets the user choose a country by its flag and name. It is built on the
    /// client's selection control, so search, multiple selection and the keyboard work as there;
    /// what it adds is the list of countries, translated and sorted in the language of the
    /// request. The value is the ISO 3166-1 alpha-2 code, which stays the same whatever language
    /// the form was filled in. A country that is only shown belongs in a <see cref="ControlCountry"/>.
    /// </summary>
    public class ControlFormItemInputCountry : ControlFormItemInput<ControlFormInputValueString>
    {
        /// <summary>
        /// Gets or sets the code of the country chosen while the form has no value of its own.
        /// With <see cref="MultiSelect"/>, several codes are separated by a semicolon.
        /// </summary>
        public Func<IRenderControlContext, string> Country { get; set; }

        /// <summary>
        /// Gets or sets the codes of the countries offered. Left unset, every country of the
        /// <see cref="CountryCatalog"/> is offered; a submitted code outside this set is refused.
        /// </summary>
        public Func<IRenderControlContext, IEnumerable<string>> Countries { get; set; }

        /// <summary>
        /// Gets or sets the text shown while no country is chosen.
        /// </summary>
        public Func<IRenderControlContext, string> Placeholder { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether several countries can be chosen.
        /// </summary>
        public Func<IRenderControlContext, bool> MultiSelect { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        public ControlFormItemInputCountry()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputCountry(string id)
            : base(id)
        {
        }

        /// <summary>
        /// Determines whether a label element may point at the field. The client moves the id onto the
        /// hidden input that posts the value, which is no labelable element, so the caption is a span.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>True if a label element may point at the field.</returns>
        public override bool IsLabelable(IRenderControlFormContext renderContext)
        {
            return false;
        }

        /// <summary>
        /// Validates the input. Besides the rules of every input, each submitted code must name a
        /// country that is offered, because the hidden field posts whatever a script puts there.
        /// </summary>
        /// <param name="renderContext">The context in which the inputs are validated.</param>
        /// <returns>The validation results.</returns>
        public override IEnumerable<ValidationResult> Validate(IRenderControlFormContext renderContext)
        {
            if ((Disabled?.Invoke(renderContext) ?? false) || IsMissing(renderContext))
            {
                return base.Validate(renderContext);
            }

            var offered = CountryCatalog.Restrict(Countries?.Invoke(renderContext)).ToHashSet(StringComparer.Ordinal);
            var codes = Split(renderContext.GetValue<ControlFormInputValueString>(this)?.Text);

            if (codes.Any(x => !offered.Contains(CountryCatalog.Normalize(x) ?? ""))
                || (codes.Count > 1 && MultiSelect?.Invoke(renderContext) != true))
            {
                return [new ValidationResult(TypeInputValidity.Error, "webexpress.webui:form.inputcountry.validation.unknown")];
            }

            return base.Validate(renderContext);
        }

        /// <summary>
        /// Converts the control to an HTML representation.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <param name="visualTree">The visual tree representing the control's structure.</param>
        /// <returns>An HTML node representing the rendered control.</returns>
        public override IHtmlNode Render(IRenderControlFormContext renderContext, IVisualTreeControl visualTree)
        {
            var value = renderContext.GetValue<ControlFormInputValueString>(this)?.Text ?? Country?.Invoke(renderContext);
            var disabled = Disabled?.Invoke(renderContext) ?? false;

            // the selection keys its options on their ids, so the codes are posted as they are
            // written here and the stored value does not depend on how it was typed in code
            var selected = string.Join(";", Split(value).Select(CountryCatalog.Normalize).Where(x => x is not null));

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-input-selection", "wx-country-input", disabled ? "disabled" : null, GetClasses(renderContext)),
                Style = GetStyles(renderContext)
            }
                .AddUserAttribute("name", Name?.Invoke(renderContext))
                .AddUserAttribute("data-required", RequiredMark(renderContext))
                .AddUserAttribute("placeholder", I18N.Translate(renderContext, Placeholder?.Invoke(renderContext)))
                .AddUserAttribute("data-multiselection", MultiSelect?.Invoke(renderContext) == true ? "true" : null)
                .AddUserAttribute("data-value", string.IsNullOrEmpty(selected) ? null : selected)
                .Add(CountryCatalog.RenderOptions(renderContext, CountryCatalog.Restrict(Countries?.Invoke(renderContext))));

            return html;
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
        protected override ControlFormInputValueString CreateValue(string value, IRenderControlFormContext renderContext)
        {
            return new ControlFormInputValueString(value);
        }

        /// <summary>
        /// Determines whether a value names no country. A posted ";" is not blank text, but it
        /// lists no code, and a required field must not take it as an answer.
        /// </summary>
        /// <param name="value">The value to check.</param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>True if the value names no country.</returns>
        protected override bool IsEmpty(ControlFormInputValueString value, IRenderControlFormContext renderContext)
        {
            return Split(value?.Text).Count == 0;
        }

        /// <summary>
        /// Splits a value into its codes, in the semicolon-separated form the selection posts.
        /// </summary>
        /// <param name="value">The value to split.</param>
        /// <returns>The trimmed, non-empty codes.</returns>
        private static List<string> Split(string value)
        {
            return (value ?? "")
                .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToList();
        }
    }
}
