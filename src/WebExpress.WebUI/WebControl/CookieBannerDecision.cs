using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// Exposes a validated browser preference to application code for the current request.
    /// </summary>
    public sealed class CookieBannerDecision
    {
        /// <summary>
        /// Gets the time at which the visitor saved the selection.
        /// </summary>
        public DateTimeOffset DecidedAt { get; }

        /// <summary>
        /// Gets the time after which this preference must be requested again.
        /// </summary>
        public DateTimeOffset ExpiresAt { get; }

        /// <summary>
        /// Gets the category permissions keyed by stable application identifiers.
        /// </summary>
        public IReadOnlyDictionary<string, bool> Categories { get; }

        /// <summary>
        /// Prevents application code from changing the validated snapshot.
        /// </summary>
        /// <param name="decidedAt">The validated selection timestamp.</param>
        /// <param name="expiresAt">The validated expiration timestamp.</param>
        /// <param name="categories">The validated category permissions.</param>
        internal CookieBannerDecision(DateTimeOffset decidedAt, DateTimeOffset expiresAt, Dictionary<string, bool> categories)
        {
            DecidedAt = decidedAt;
            ExpiresAt = expiresAt;
            Categories = new ReadOnlyDictionary<string, bool>(categories);
        }

        /// <summary>
        /// Defaults unknown categories to denied so integrations must opt in explicitly.
        /// </summary>
        /// <param name="id">The application's category identifier.</param>
        /// <returns>True only when the requested category is present and permitted.</returns>
        public bool IsAllowed(string id)
        {
            return id is not null && Categories.TryGetValue(id, out var allowed) && allowed;
        }
    }
}
