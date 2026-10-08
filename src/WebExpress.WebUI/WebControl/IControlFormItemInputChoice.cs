using System;
using System.Collections.Generic;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a segmented choice control that is part of the web UI.
    /// </summary>
    public interface IControlFormItemInputChoice : IControlFormItemInput<ControlFormInputValueString>
    {
        /// <summary>
        /// Gets the options of the control.
        /// </summary>
        IEnumerable<ControlFormItemInputChoiceItem> Items { get; }

        /// <summary>
        /// Gets the name of the input the visible options are filtered by.
        /// </summary>
        Func<IRenderControlContext, string> FilterSource { get; }

        /// <summary>
        /// Adds one or more options to the control.
        /// </summary>
        /// <param name="items">The options to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInputChoice Add(params ControlFormItemInputChoiceItem[] items);

        /// <summary>
        /// Adds one or more options to the control.
        /// </summary>
        /// <param name="items">The options to add.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInputChoice Add(IEnumerable<ControlFormItemInputChoiceItem> items);

        /// <summary>
        /// Removes the specified option from the control.
        /// </summary>
        /// <param name="item">The option to remove.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInputChoice Remove(ControlFormItemInputChoiceItem item);
    }
}
