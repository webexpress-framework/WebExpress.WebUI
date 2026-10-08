using System;
using System.Collections.Generic;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents a form item input selection control.
    /// Provides methods to manage selection options.
    /// </summary>
    public interface IControlFormItemInputSelection : IControlFormItemInput<ControlFormInputValueString>
    {
        /// <summary>
        /// Gets the entries.
        /// </summary>
        IEnumerable<IControlFormItemInputSelectionItem> Options { get; }

        /// <summary>
        /// Gets or sets the label of the selected options.
        /// </summary>
        Func<IRenderControlContext, string> Placeholder { get; }

        /// <summary>
        /// Allows you to select multiple items.
        /// </summary>
        Func<IRenderControlContext, bool> MultiSelect { get; }

        /// <summary>
        /// Gets a value indicating whether sticky selection mode is enabled.
        /// When enabled and a value has been selected, the selection cannot be
        /// cleared through the user interface.
        /// </summary>
        Func<IRenderControlContext, bool> StickySelection { get; }

        /// <summary>
        /// Gets the name of the form field this selection follows. Left unset, the selection
        /// offers all of its options; named, it offers only the options that
        /// <see cref="IControlFormItemInputSelectionItem.Requires"/> marks as belonging to
        /// the value currently chosen there.
        /// </summary>
        /// <remarks>
        /// This exists because two fields of one form may describe a pairing of which not
        /// every combination is valid, and only one side of it can be settled on the server
        /// before the form is submitted - the other is being chosen in the same dialog. Where
        /// the invalid combinations are known while the form is rendered, offering them and
        /// refusing the submission afterwards tells the user too late; the dependency lets the
        /// second field narrow itself as the first one is answered.
        /// <para>
        /// A field that has not been answered narrows nothing, so a form that fills its fields
        /// one after another - a form loading its row over a service, for example - does not
        /// lose the value of the dependent field on the way. A value that is no longer offered
        /// is dropped, because the control may not submit what it does not offer; with
        /// <see cref="StickySelection"/> the first still-offered option takes its place
        /// instead, since a sticky selection may not be emptied.
        /// </para>
        /// </remarks>
        Func<IRenderControlContext, string> DependsOn { get; }

        /// <summary>
        /// Adds one or more items to the selection options.
        /// </summary>
        /// <param name="items">The items to add to the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInputSelection Add(params IControlFormItemInputSelectionItem[] items);

        /// <summary>
        /// Adds one or more items to the selection options.
        /// </summary>
        /// <param name="items">The items to add to the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInputSelection Add(IEnumerable<IControlFormItemInputSelectionItem> items);

        /// <summary>
        /// Removes an item from the selection options.
        /// </summary>
        /// <param name="item">The item to remove from the selection options.</param>
        /// <returns>The current instance for method chaining.</returns>
        IControlFormItemInputSelection Remove(IControlFormItemInputSelectionItem item);
    }
}
