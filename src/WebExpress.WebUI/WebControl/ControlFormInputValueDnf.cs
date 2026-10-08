using System;
using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Represents the value of a form input field as a disjunctive normal form:
    /// a disjunction of conjunctions, where [[A,B],[C]] reads as (A AND B) OR (C).
    /// </summary>
    /// <remarks>
    /// The two dimensions travel in a single string so the expression fits one
    /// hidden form field and one table cell: the terms of a conjunction are joined
    /// with a semicolon and the conjunctions with a vertical bar. A one group
    /// expression is therefore byte for byte the semicolon list every other
    /// selection control already speaks, which is what lets a plain selection value
    /// be adopted by a DNF control without conversion. Term ids consequently must
    /// not contain either separator.
    /// </remarks>
    public class ControlFormInputValueDnf : IControlFormInputValue
    {
        /// <summary>
        /// Separates the terms of one conjunction.
        /// </summary>
        public const char TermSeparator = ';';

        /// <summary>
        /// Separates the conjunctions of the disjunction.
        /// </summary>
        public const char GroupSeparator = '|';

        private readonly List<string[]> _groups = [];

        /// <summary>
        /// Gets the conjunctions of the expression, each a list of term ids that
        /// are combined with AND. The conjunctions themselves are combined with OR.
        /// </summary>
        public IEnumerable<IEnumerable<string>> Groups => _groups;

        /// <summary>
        /// Gets a value indicating whether the expression carries no term at all.
        /// </summary>
        public bool IsEmpty => _groups.Count == 0;

        /// <summary>
        /// Gets every term id used anywhere in the expression, once. Callers that
        /// have to resolve labels or authorize the referenced entities need the
        /// whole set rather than the structure.
        /// </summary>
        public IEnumerable<string> Terms => _groups.SelectMany(x => x).Distinct();

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        public ControlFormInputValueDnf()
        {
        }

        /// <summary>
        /// Initializes a new instance of the class from its serialized form.
        /// </summary>
        /// <param name="value">The serialized expression, for example "a;b|c".</param>
        public ControlFormInputValueDnf(string value)
        {
            _groups.AddRange(Normalize(Split(value)));
        }

        /// <summary>
        /// Initializes a new instance of the class from its structure.
        /// </summary>
        /// <param name="groups">The conjunctions of the expression.</param>
        public ControlFormInputValueDnf(IEnumerable<IEnumerable<string>> groups)
        {
            _groups.AddRange(Normalize(groups));
        }

        /// <summary>
        /// Initializes a new instance of the class holding a single conjunction.
        /// </summary>
        /// <param name="terms">The term ids that are combined with AND.</param>
        public ControlFormInputValueDnf(params string[] terms)
        {
            _groups.AddRange(Normalize([terms]));
        }

        /// <summary>
        /// Adds a conjunction to the expression.
        /// </summary>
        /// <param name="terms">The term ids that are combined with AND.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual ControlFormInputValueDnf Add(params string[] terms)
        {
            _groups.AddRange(Normalize([terms]));

            return this;
        }

        /// <summary>
        /// Removes a conjunction from the expression.
        /// </summary>
        /// <param name="index">The zero based index of the conjunction.</param>
        /// <returns>The current instance for method chaining.</returns>
        public virtual ControlFormInputValueDnf Remove(int index)
        {
            if (index >= 0 && index < _groups.Count)
            {
                _groups.RemoveAt(index);
            }

            return this;
        }

        /// <summary>
        /// Returns whether the expression is satisfied by the given set of term
        /// ids. This is the semantics the control exists to express, so evaluating
        /// it belongs to the value rather than to every consumer of it.
        /// </summary>
        /// <param name="facts">The term ids that hold.</param>
        /// <returns>True when at least one conjunction is fully contained in the facts.</returns>
        public virtual bool IsSatisfiedBy(IEnumerable<string> facts)
        {
            var set = new HashSet<string>(facts ?? [], StringComparer.Ordinal);

            return _groups.Any(group => group.All(set.Contains));
        }

        /// <summary>
        /// Returns the serialized expression.
        /// </summary>
        /// <param name="format">Ignored for a disjunctive normal form.</param>
        /// <param name="formatProvider">Ignored for a disjunctive normal form.</param>
        /// <returns>The serialized expression, or an empty string when unset.</returns>
        public virtual string ToString(string format, IFormatProvider formatProvider)
        {
            return string.Join(GroupSeparator, _groups.Select(group => string.Join(TermSeparator, group)));
        }

        /// <summary>
        /// Returns the serialized expression.
        /// </summary>
        /// <returns>The serialized expression, or an empty string when unset.</returns>
        public override string ToString()
        {
            return ToString(null, null);
        }

        /// <summary>
        /// Splits the serialized form into its two levels.
        /// </summary>
        /// <param name="value">The serialized expression.</param>
        /// <returns>The raw conjunctions.</returns>
        private static IEnumerable<IEnumerable<string>> Split(string value)
        {
            return string.IsNullOrEmpty(value)
                ? []
                : value.Split(GroupSeparator).Select(group => group.Split(TermSeparator));
        }

        /// <summary>
        /// Drops what carries no meaning: blank terms, terms repeated inside one
        /// conjunction (A AND A is A) and conjunctions that ended up empty.
        /// </summary>
        /// <param name="groups">The raw conjunctions.</param>
        /// <returns>The normalized conjunctions.</returns>
        private static IEnumerable<string[]> Normalize(IEnumerable<IEnumerable<string>> groups)
        {
            return (groups ?? [])
                .Where(group => group is not null)
                .Select(group => group
                    .Where(term => !string.IsNullOrWhiteSpace(term))
                    .Select(term => term.Trim())
                    .Distinct(StringComparer.Ordinal)
                    .ToArray())
                .Where(group => group.Length > 0);
        }
    }
}
