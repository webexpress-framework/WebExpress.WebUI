using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A form input for an account in a domain: a picker of the domains offered beside a field
    /// for the user name, composed into DOMAIN\user or user@domain.tld (<see cref="DomainLogon"/>).
    /// Without <see cref="Domains"/>, the field takes the whole account as text. The page receives
    /// the account in its full notation, checked against the limits of a directory such as
    /// Active Directory.
    /// </summary>
    public class ControlFormItemInputDomain : ControlFormItemInput<ControlFormInputValueString>
    {
        /// <summary>
        /// Gets or sets the account shown while the form has no value of its own.
        /// </summary>
        public Func<IRenderControlContext, string> Account { get; set; }

        /// <summary>
        /// Gets or sets the domain the picker starts with. Without <see cref="Domains"/>, a bare
        /// user name is completed with it, because users of a single domain rarely type it.
        /// </summary>
        public Func<IRenderControlContext, string> Domain { get; set; }

        /// <summary>
        /// Gets or sets the domains offered, compared without regard to letter case. An account
        /// of another domain is refused. Left unset, the field takes any domain as text.
        /// </summary>
        public Func<IRenderControlContext, IEnumerable<string>> Domains { get; set; }

        /// <summary>
        /// Gets or sets the notation the account is composed in and must be written in. Left
        /// unset, a domain with a dot makes a principal name, one without a down-level name.
        /// </summary>
        public Func<IRenderControlContext, TypeDomainFormat> Format { get; set; }

        /// <summary>
        /// Gets or sets the text shown while the user field is empty. Left unset, the field shows
        /// an example of what it asks for.
        /// </summary>
        public Func<IRenderControlContext, string> Placeholder { get; set; }

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        public ControlFormItemInputDomain()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputDomain(string id)
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
        /// Validates the input: besides the rules of every input, the account must keep the limits
        /// of a directory, be written in the required notation and belong to an offered domain.
        /// </summary>
        /// <param name="renderContext">The context in which the inputs are validated.</param>
        /// <returns>The validation results.</returns>
        public override IEnumerable<ValidationResult> Validate(IRenderControlFormContext renderContext)
        {
            // an empty field is left to the required rule; optional, it has no account to check
            var current = renderContext.GetValue<ControlFormInputValueString>(this);
            if ((Disabled?.Invoke(renderContext) ?? false) || IsEmpty(current, renderContext))
            {
                return base.Validate(renderContext);
            }

            var account = DomainLogon.Normalize(current.Text, StartDomain(renderContext));
            if (!DomainLogon.TryParse(account, out var domain, out _, out var format))
            {
                return [new ValidationResult(TypeInputValidity.Error, "webexpress.webui:form.inputdomain.validation.invalid")];
            }

            var required = Format?.Invoke(renderContext) ?? TypeDomainFormat.Any;
            if (required != TypeDomainFormat.Any && required != format)
            {
                return [new ValidationResult(TypeInputValidity.Error, required == TypeDomainFormat.DownLevel
                    ? "webexpress.webui:form.inputdomain.validation.downlevel"
                    : "webexpress.webui:form.inputdomain.validation.principal")];
            }

            var offered = GetOffered(renderContext);
            if (offered.Count > 0 && !offered.Contains(domain, StringComparer.OrdinalIgnoreCase))
            {
                return [new ValidationResult(TypeInputValidity.Error, "webexpress.webui:form.inputdomain.validation.domain")];
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
            var offered = GetOffered(renderContext);
            var format = Format?.Invoke(renderContext) ?? TypeDomainFormat.Any;
            var value = renderContext.GetValue<ControlFormInputValueString>(this)?.Text
                ?? DomainLogon.Normalize(Account?.Invoke(renderContext), StartDomain(renderContext))
                ?? Account?.Invoke(renderContext);

            var html = new HtmlElementTextContentDiv()
            {
                Id = Id,
                Class = Css.Concatenate("wx-webui-input-domain", disabled ? "disabled" : null, GetClasses(renderContext)),
                Style = GetStyles(renderContext)
            }
                .AddUserAttribute("name", Name?.Invoke(renderContext))
                .AddUserAttribute("data-required", RequiredMark(renderContext))
                .AddUserAttribute("placeholder", I18N.Translate(renderContext, Placeholder?.Invoke(renderContext) ?? DefaultPlaceholder(offered.Count > 0, format)))
                .AddUserAttribute("data-format", format switch
                {
                    TypeDomainFormat.DownLevel => "downlevel",
                    TypeDomainFormat.Principal => "principal",
                    _ => null
                })
                .AddUserAttribute("data-domain", offered.Count > 0 ? StartDomain(renderContext) : null)
                .AddUserAttribute("data-value", string.IsNullOrWhiteSpace(value) ? null : value)
                .Add(offered.Select(x => new HtmlElementTextContentDiv()
                {
                    Id = x,
                    Class = "wx-selection-item"
                }
                    .AddUserAttribute("data-label", x)));

            return html;
        }

        /// <summary>
        /// Creates the value from the posted account: completed with the start domain where it is a
        /// bare user name, as posted where it is no account, so the field shows what was refused.
        /// </summary>
        /// <param name="value">The posted account.</param>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>The value.</returns>
        protected override ControlFormInputValueString CreateValue(string value, IRenderControlFormContext renderContext)
        {
            return new ControlFormInputValueString(DomainLogon.Normalize(value, StartDomain(renderContext)) ?? value);
        }

        /// <summary>
        /// Returns the domains offered, trimmed and without duplicates.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>The domains, in the order given.</returns>
        private List<string> GetOffered(IRenderControlContext renderContext)
        {
            return (Domains?.Invoke(renderContext) ?? [])
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        /// <summary>
        /// Returns the domain the picker starts with and a bare user name is completed with: the
        /// configured one where it is offered, else the first one offered.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        /// <returns>The domain, or null.</returns>
        private string StartDomain(IRenderControlContext renderContext)
        {
            var offered = GetOffered(renderContext);
            var configured = Domain?.Invoke(renderContext)?.Trim();

            if (offered.Count == 0)
            {
                return string.IsNullOrEmpty(configured) ? null : configured;
            }

            return offered.FirstOrDefault(x => string.Equals(x, configured, StringComparison.OrdinalIgnoreCase)) ?? offered[0];
        }

        /// <summary>
        /// Returns the example the empty field shows: a user name beside the picker, the whole
        /// account in the notation asked for without it.
        /// </summary>
        /// <param name="picker">Whether the field has a domain picker.</param>
        /// <param name="format">The notation asked for.</param>
        /// <returns>The internationalization key of the example.</returns>
        private static string DefaultPlaceholder(bool picker, TypeDomainFormat format)
        {
            if (picker)
            {
                return "webexpress.webui:form.inputdomain.placeholder.user";
            }

            return format switch
            {
                TypeDomainFormat.DownLevel => "webexpress.webui:form.inputdomain.placeholder.downlevel",
                TypeDomainFormat.Principal => "webexpress.webui:form.inputdomain.placeholder.principal",
                _ => "webexpress.webui:form.inputdomain.placeholder.any"
            };
        }
    }
}
