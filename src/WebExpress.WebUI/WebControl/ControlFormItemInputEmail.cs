using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A form input for an e-mail address. The browser offers the addresses it knows and checks
    /// the notation as the user types; the server applies the same rule (<see cref="EmailAddress"/>),
    /// stores the address with its domain in lower case and, where <see cref="Domains"/> is set,
    /// accepts addresses of those domains only. An address that is only shown belongs in a
    /// <see cref="ControlEmail"/>.
    /// </summary>
    public class ControlFormItemInputEmail : ControlFormItemInputFormatted
    {
        /// <summary>
        /// Gets or sets the domains an address must belong to, sub-domains included. Left unset,
        /// any domain is accepted.
        /// </summary>
        public Func<IRenderControlContext, IEnumerable<string>> Domains { get; set; }

        /// <summary>
        /// Gets the type of the native input.
        /// </summary>
        protected override string InputType => "email";

        /// <summary>
        /// Gets the autocomplete token of the field.
        /// </summary>
        protected override string AutoComplete => "email";

        /// <summary>
        /// Gets the message for a text that is no e-mail address.
        /// </summary>
        protected override string InvalidMessage => "webexpress.webui:form.inputemail.validation.invalid";

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        public ControlFormItemInputEmail()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputEmail(string id)
            : base(id)
        {
        }

        /// <summary>
        /// Brings a text into the stored form of an address.
        /// </summary>
        /// <param name="value">The text as posted.</param>
        /// <param name="renderContext">The context of the form.</param>
        /// <returns>The normalized address, or null if the text is no address.</returns>
        protected override string Normalize(string value, IRenderControlContext renderContext)
        {
            return EmailAddress.Normalize(value);
        }

        /// <summary>
        /// Accepts an address only within the permitted domains.
        /// </summary>
        /// <param name="value">The normalized address.</param>
        /// <param name="renderContext">The context of the form.</param>
        /// <returns>The message key, or null if the address is accepted.</returns>
        protected override string Check(string value, IRenderControlContext renderContext)
        {
            var domains = Domains?.Invoke(renderContext)?.Where(x => !string.IsNullOrWhiteSpace(x)).ToList();

            return domains is { Count: > 0 } && !domains.Any(x => EmailAddress.IsInDomain(value, x))
                ? "webexpress.webui:form.inputemail.validation.domain"
                : null;
        }
    }
}
