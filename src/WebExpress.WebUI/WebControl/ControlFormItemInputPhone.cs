using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A form input for a telephone number: a country picker with the flag and calling code
    /// beside a field for the national number. The page receives the number in the E.164 form
    /// (+4930123456), checked against the numbering plan of its country (<see cref="PhoneCatalog"/>),
    /// so a number entered in one country dials from everywhere. A number that is only shown
    /// belongs in a <see cref="ControlPhone"/>.
    /// </summary>
    public class ControlFormItemInputPhone : ControlFormItemInput<ControlFormInputValueString>
    {
        /// <summary>
        /// Gets or sets the number shown while the form has no value of its own, international
        /// or national in <see cref="Country"/>.
        /// </summary>
        public Func<IRenderControlContext, string> Phone { get; set; }

        /// <summary>
        /// Gets or sets the country an empty field starts in. Left unset, the field starts in the
        /// country of the request language, such as Germany for de-DE.
        /// </summary>
        public Func<IRenderControlContext, string> Country { get; set; }

        /// <summary>
        /// Gets or sets the codes of the countries offered. Left unset, every country with a
        /// numbering plan is offered; a number of another country is refused.
        /// </summary>
        public Func<IRenderControlContext, IEnumerable<string>> Countries { get; set; }

        /// <summary>
        /// Gets or sets the text shown while the number field is empty.
        /// </summary>
        public Func<IRenderControlContext, string> Placeholder { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        public ControlFormItemInputPhone()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputPhone(string id)
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
        /// Validates the input: besides the rules of every input, the number must fit the
        /// numbering plan of its country, and that country must be offered.
        /// </summary>
        /// <param name="renderContext">The context in which the inputs are validated.</param>
        /// <returns>The validation results.</returns>
        public override IEnumerable<ValidationResult> Validate(IRenderControlFormContext renderContext)
        {
            // an empty field is left to the required rule; optional, it has no number to check
            var current = renderContext.GetValue<ControlFormInputValueString>(this);
            if ((Disabled?.Invoke(renderContext) ?? false) || IsEmpty(current, renderContext))
            {
                return base.Validate(renderContext);
            }

            var value = current.Text;
            var phone = PhoneCatalog.Normalize(value, StartCountry(renderContext));
            if (phone is null)
            {
                return [new ValidationResult(TypeInputValidity.Error, "webexpress.webui:form.inputphone.validation.invalid")];
            }

            // a number may belong to several countries of its calling code; one offered is enough
            if (!GetOffered(renderContext).Any(x => PhoneCatalog.Fits(phone, x)))
            {
                return [new ValidationResult(TypeInputValidity.Error, "webexpress.webui:form.inputphone.validation.country")];
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
            var disabled = Disabled?.Invoke(renderContext) ?? false;
            var country = StartCountry(renderContext);
            var value = renderContext.GetValue<ControlFormInputValueString>(this)?.Text
                ?? PhoneCatalog.Normalize(Phone?.Invoke(renderContext), country);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-input-phone", disabled ? "disabled" : null, GetClasses(renderContext)),
                Style = GetStyles(renderContext)
            }
                .AddUserAttribute("name", Name?.Invoke(renderContext))
                .AddUserAttribute("data-required", RequiredMark(renderContext))
                .AddUserAttribute("placeholder", I18N.Translate(renderContext, Placeholder?.Invoke(renderContext)))
                .AddUserAttribute("data-country", country)
                .AddUserAttribute("data-value", string.IsNullOrWhiteSpace(value) ? null : value)
                .Add(CountryCatalog.RenderOptions(renderContext, GetOffered(renderContext)));

            return html;
        }

        /// <summary>
        /// Creates the value from the posted number: in E.164 form where it is valid, as posted
        /// where it is not, so the field shows the user what was refused.
        /// </summary>
        /// <param name="value">The posted number.</param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>The value.</returns>
        protected override ControlFormInputValueString CreateValue(string value, IRenderControlFormContext renderContext)
        {
            return new ControlFormInputValueString(PhoneCatalog.Normalize(value, StartCountry(renderContext)) ?? value);
        }

        /// <summary>
        /// Returns the codes of the countries offered: those with a numbering plan, narrowed to
        /// <see cref="Countries"/>.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>The upper-case codes.</returns>
        private IEnumerable<string> GetOffered(IRenderControlContext renderContext)
        {
            var plans = PhoneCatalog.Countries.ToHashSet(StringComparer.Ordinal);

            return CountryCatalog.Restrict(Countries?.Invoke(renderContext)).Where(plans.Contains);
        }

        /// <summary>
        /// Returns the country an empty field starts in and a national number is read in.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>The upper-case country code, or null.</returns>
        private string StartCountry(IRenderControlContext renderContext)
        {
            var offered = GetOffered(renderContext).ToList();
            var configured = CountryCatalog.Normalize(Country?.Invoke(renderContext));
            var region = CountryCatalog.Normalize(RegionOf(renderContext?.Request?.Culture?.Name));

            return new[] { configured, region }.FirstOrDefault(x => x is not null && offered.Contains(x))
                ?? offered.FirstOrDefault();
        }

        /// <summary>
        /// Returns the region part of a culture name, such as DE for de-DE.
        /// </summary>
        /// <param name="culture">The culture name.</param>
        /// <returns>The region, or null for a neutral culture.</returns>
        private static string RegionOf(string culture)
        {
            var dash = culture?.LastIndexOf('-') ?? -1;

            return dash > 0 ? culture[(dash + 1)..] : null;
        }
    }
}
