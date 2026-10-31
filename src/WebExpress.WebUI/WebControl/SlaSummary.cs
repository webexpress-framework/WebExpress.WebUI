using System.Collections.Generic;
using System.Linq;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Condenses a set of evaluated agreements into the two readings a container
    /// shows: the status it takes its colour from and the count per status.
    /// </summary>
    /// <remarks>
    /// The group and the management surface frame agreements differently but
    /// summarise them identically, and the client recomputes the same summary as
    /// the tiles change status. Keeping the rule in one place is what stops the
    /// three from drifting apart.
    /// </remarks>
    public static class SlaSummary
    {
        /// <summary>
        /// The order the statuses are reported in: the ones that need attention
        /// first, because a summary is read from the left.
        /// </summary>
        private static readonly TypeStatusSla[] _order =
        [
            TypeStatusSla.Violated,
            TypeStatusSla.AtRisk,
            TypeStatusSla.Paused,
            TypeStatusSla.Fulfilled
        ];

        /// <summary>
        /// Returns the status a container takes its colour from: the worst one
        /// among the agreements, because a panel that showed the best of them
        /// would hide the one thing it exists to surface. Paused only wins when
        /// every agreement is paused - a single stopped clock among running ones
        /// says nothing about the set.
        /// </summary>
        /// <param name="evaluations">The status of the framed agreements.</param>
        /// <returns>The worst status.</returns>
        public static TypeStatusSla Worst(IEnumerable<SlaEvaluation> evaluations)
        {
            if (evaluations.Any(x => x.Status == TypeStatusSla.Violated))
            {
                return TypeStatusSla.Violated;
            }

            if (evaluations.Any(x => x.Status == TypeStatusSla.AtRisk))
            {
                return TypeStatusSla.AtRisk;
            }

            if (evaluations.Any() && evaluations.All(x => x.Status == TypeStatusSla.Paused))
            {
                return TypeStatusSla.Paused;
            }

            return TypeStatusSla.Fulfilled;
        }

        /// <summary>
        /// Returns the English default for the summary, as a count per status
        /// with the empty ones left out. The client replaces it with the
        /// visitor's language and keeps it current.
        /// </summary>
        /// <param name="evaluations">The status of the framed agreements.</param>
        /// <returns>The text.</returns>
        public static string Text(IEnumerable<SlaEvaluation> evaluations)
        {
            if (!evaluations.Any())
            {
                return "No agreements";
            }

            var parts = _order
                .Select(status => new { Status = status, Count = evaluations.Count(x => x.Status == status) })
                .Where(x => x.Count > 0)
                .Select(x => $"{x.Count} {Label(x.Status)}");

            return string.Join(", ", parts);
        }

        /// <summary>
        /// Returns the English default for a status inside the summary, which
        /// reads as a count rather than as a badge.
        /// </summary>
        /// <param name="status">The status.</param>
        /// <returns>The text.</returns>
        private static string Label(TypeStatusSla status)
        {
            return status switch
            {
                TypeStatusSla.AtRisk => "at risk",
                TypeStatusSla.Violated => "violated",
                TypeStatusSla.Paused => "paused",
                _ => "fulfilled",
            };
        }
    }
}
