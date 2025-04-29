using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Grouping of controls.
    /// </summary>
    public abstract class ControlFormItemGroup : ControlFormItem, IControlFormItemGroup, IFormValidation
    {
        private readonly List<ControlFormItem> _items = [];
        private readonly List<ValidationResult> _validationResults = [];

        /// <summary>
        /// Returns the form items.
        /// </summary>
        public ICollection<ControlFormItem> Items => _items;

        /// <summary>
        /// Determines whether the inputs are valid.
        /// </summary>
        public IEnumerable<ValidationResult> ValidationResults => _validationResults;

        /// <summary>
        /// Returns or sets whether the form element has been validated.
        /// </summary>
        private bool IsValidated { get; set; }

        /// <summary>
        /// Returns the most serious validation result.
        /// </summary>
        public virtual TypesInputValidity ValidationResult
        {
            get
            {
                var buf = ValidationResults;

                if (buf.Where(x => x.Type == TypesInputValidity.Error).Any())
                {
                    return TypesInputValidity.Error;
                }
                else if (buf.Where(x => x.Type == TypesInputValidity.Warning).Any())
                {
                    return TypesInputValidity.Warning;
                }
                else if (buf.Where(x => x.Type == TypesInputValidity.Success).Any())
                {
                    return TypesInputValidity.Success;
                }

                return IsValidated ? TypesInputValidity.Success : TypesInputValidity.Default;
            }
        }

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="id">The id of the control.</param>
        ///<param name="item">The form item.</param> 
        public ControlFormItemGroup(string id = null, params ControlFormItem[] item)
            : base(id)
        {
            _items.AddRange(item);
        }

        /// <summary>
        /// Adds a collection of form entries to the existing items.
        /// </summary>
        /// <param name="items">The form entries to add.</param>
        /// <remarks>
        /// This method appends the specified collection of <see cref="ControlListItem"/> instances to the 
        /// current list of items. It ensures that the new items are concatenated with the existing ones, 
        /// maintaining the order of addition.
        /// This method accepts any item that derives from <see cref="ControlListItem"/>.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        public IControlFormItemGroup Add(params ControlFormItem[] items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Adds a collection of form entries to the existing items.
        /// </summary>
        /// <param name="items">The form entries to add.</param>
        /// <remarks>
        /// This method appends the specified collection of <see cref="ControlListItem"/> instances to the 
        /// current form of items. It ensures that the new items are concatenated with the existing ones, 
        /// maintaining the order of addition.
        /// This method accepts any item that derives from <see cref="ControlListItem"/>.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemGroup Add(IEnumerable<ControlFormItem> items)
        {
            _items.AddRange(items);

            return this;
        }

        /// <summary>
        /// Removes a specified form entry from the existing items.
        /// </summary>
        /// <param name="item">The form entry to remove.</param>
        /// <remarks>
        /// This method removes the specified <see cref="ControlListItem"/> instance from the 
        /// current form of items. If the item does not exist in the list, the method does nothing.
        /// This method accepts any item that derives from <see cref="ControlListItem"/>.
        /// </remarks>
        /// <returns>The current instance for method chaining.</returns>
        public virtual IControlFormItemGroup Remove(ControlFormItem item)
        {
            _items.Remove(item);

            return this;
        }

        /// <summary>
        /// Adds a collection of validation results to the existing validation results.
        /// </summary>
        /// <param name="validationResults">The validation results to add.</param>
        /// <remarks>
        /// This method appends the specified collection of <see cref="ValidationResult"/> instances to the 
        /// current list of validation results. It ensures that the new validation results are concatenated 
        /// with the existing ones, maintaining the order of addition.
        /// This method accepts any item that derives from <see cref="ValidationResult"/>.
        /// </remarks>
        public virtual void AddValidationResult(params ValidationResult[] validationResults)
        {
            _validationResults.AddRange(validationResults);
        }

        /// <summary>
        /// Removes a specified validation result from the existing validation results.
        /// </summary>
        /// <param name="validationResult">The validation result to remove.</param>
        /// <remarks>
        /// This method removes the specified <see cref="ValidationResult"/> instance from the 
        /// current list of validation results. If the validation result does not exist in the list, 
        /// the method does nothing.
        /// This method accepts any item that derives from <see cref="ValidationResult"/>.
        /// </remarks>
        public void RemoveValidationResult(ValidationResult validationResult)
        {
            _validationResults.Remove(validationResult);
        }

        /// <summary>
        /// Initializes the form element.
        /// </summary>
        /// <param name="renderContext">The context in which the control is rendered.</param>
        public override void Initialize(IRenderControlFormContext renderContext)
        {
            var groupContex = new RenderControlFormGroupContext(renderContext, this);

            foreach (var item in Items)
            {
                item.Initialize(groupContex);
            }
        }

        /// <summary>
        /// Checks the input element for correctness of the data.
        /// </summary>
        /// <param name="renderContext">The context in which the inputs are validated.</param>
        public virtual void Validate(IRenderControlFormContext renderContext)
        {
            var validationResults = ValidationResults as List<ValidationResult>;

            validationResults.Clear();

            foreach (var v in Items.Where(x => x is IFormValidation).Select(x => x as IFormValidation))
            {
                v.Validate(renderContext);

                validationResults.AddRange(v.ValidationResults);
            }
        }
    }
}
