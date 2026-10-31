using System;
using WebExpress.WebCore.WebHtml;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// A form input for an IPv4 or IPv6 address, optionally with a prefix length in CIDR
    /// notation. The address is checked and stored by <see cref="IpAddress"/>, so the page
    /// receives one spelling of it - an IPv6 address in its canonical, compressed form.
    /// </summary>
    public class ControlFormItemInputIp : ControlFormItemInputFormatted
    {
        /// <summary>
        /// Gets or sets the version the address must belong to. Left unset, both are accepted.
        /// </summary>
        public Func<IRenderControlContext, TypeIpVersion> Version { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether a prefix length is accepted, as in 192.0.2.0/24,
        /// to enter a network rather than a single host.
        /// </summary>
        public Func<IRenderControlContext, bool> AllowPrefix { get; set; }

        /// <summary>
        /// Gets the type of the native input.
        /// </summary>
        protected override string InputType => "text";

        /// <summary>
        /// Gets the message for a text that is no IP address.
        /// </summary>
        protected override string InvalidMessage => "webexpress.webui:form.inputip.validation.invalid";

        /// <summary>
        /// Initializes a new instance of the class with an automatically assigned ID.
        /// </summary>
        public ControlFormItemInputIp()
            : this(DeterministicId.Create())
        {
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        public ControlFormItemInputIp(string id)
            : base(id)
        {
        }

        /// <summary>
        /// Brings a text into the stored form of an address. Any valid address is normalized
        /// here, whatever the version, so the version rule can name what is wrong.
        /// </summary>
        /// <param name="value">The text as posted.</param>
        /// <param name="renderContext">The context of the form.</param>
        /// <returns>The normalized address, or null if the text is no IP address.</returns>
        protected override string Normalize(string value, IRenderControlContext renderContext)
        {
            return IpAddress.Normalize(value, TypeIpVersion.Any, true);
        }

        /// <summary>
        /// Tells a prefix length that exceeds the address apart from a text that is no address.
        /// </summary>
        /// <param name="value">The text as posted.</param>
        /// <param name="renderContext">The context of the form.</param>
        /// <returns>The message key.</returns>
        protected override string Reject(string value, IRenderControlContext renderContext)
        {
            return IpAddress.Check(value, TypeIpVersion.Any, true, out _) == IpAddressError.Prefix
                ? "webexpress.webui:form.inputip.validation.prefix"
                : InvalidMessage;
        }

        /// <summary>
        /// Accepts an address only in the required version and with a prefix where one is allowed.
        /// </summary>
        /// <param name="value">The normalized address.</param>
        /// <param name="renderContext">The context of the form.</param>
        /// <returns>The message key, or null if the address is accepted.</returns>
        protected override string Check(string value, IRenderControlContext renderContext)
        {
            var error = IpAddress.Check(value, Version?.Invoke(renderContext) ?? TypeIpVersion.Any, AllowPrefix?.Invoke(renderContext) ?? false, out _);

            return error switch
            {
                IpAddressError.None => null,
                IpAddressError.NotVersion4 => "webexpress.webui:form.inputip.validation.version4",
                IpAddressError.NotVersion6 => "webexpress.webui:form.inputip.validation.version6",
                IpAddressError.PrefixNotAllowed => "webexpress.webui:form.inputip.validation.noprefix",
                IpAddressError.Prefix => "webexpress.webui:form.inputip.validation.prefix",
                _ => InvalidMessage
            };
        }

        /// <summary>
        /// Shows an example of the version the field asks for.
        /// </summary>
        /// <param name="renderContext">The context of the form.</param>
        /// <returns>The example.</returns>
        protected override string DefaultPlaceholder(IRenderControlContext renderContext)
        {
            var prefix = AllowPrefix?.Invoke(renderContext) ?? false;

            return (Version?.Invoke(renderContext) ?? TypeIpVersion.Any) switch
            {
                TypeIpVersion.Version6 => prefix ? "2001:db8::/32" : "2001:db8::1",
                TypeIpVersion.Version4 => prefix ? "192.0.2.0/24" : "192.0.2.10",
                _ => prefix ? "192.0.2.0/24, 2001:db8::/32" : "192.0.2.10, 2001:db8::1"
            };
        }
    }
}
