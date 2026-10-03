using System;
using System.Collections.Concurrent;
using System.Collections.Generic;

namespace WebExpress.WebUI.WebMarkdown
{
    /// <summary>
    /// Holds the <see cref="IMarkdownPlugin"/> implementations by the name a text uses for them.
    /// <para>
    /// The registry is process wide because <see cref="MarkdownRendererHtml"/> is static and
    /// renders without access to the component hub. On a server
    /// <see cref="MarkdownPluginManager"/> fills it from the loaded plugins. Names are compared
    /// without regard to case, as the markdown syntax does not fix one.
    /// </para>
    /// </summary>
    public static class MarkdownPluginRegistry
    {
        private static readonly ConcurrentDictionary<string, IMarkdownPlugin> _plugins = new(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Returns the names of the registered plugins.
        /// </summary>
        public static IEnumerable<string> Names => _plugins.Keys;

        /// <summary>
        /// Registers a plugin under a name. The first registration of a name is kept, so a
        /// second plugin cannot silently change how existing documents look.
        /// </summary>
        /// <param name="name">The name a text uses for the plugin.</param>
        /// <param name="plugin">The plugin.</param>
        /// <returns>True when registered, false when the name is already taken.</returns>
        public static bool Register(string name, IMarkdownPlugin plugin)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(name);
            ArgumentNullException.ThrowIfNull(plugin);

            return _plugins.TryAdd(name, plugin);
        }

        /// <summary>
        /// Removes the plugin registered under a name.
        /// </summary>
        /// <param name="name">The name.</param>
        /// <returns>True when a plugin was removed.</returns>
        public static bool Remove(string name)
        {
            return name is not null && _plugins.TryRemove(name, out _);
        }

        /// <summary>
        /// Removes a name only while it still refers to the given plugin, so an unloading
        /// plugin cannot take away a name another plugin holds.
        /// </summary>
        /// <param name="name">The name.</param>
        /// <param name="plugin">The plugin the name is expected to refer to.</param>
        /// <returns>True when the plugin was removed.</returns>
        internal static bool Remove(string name, IMarkdownPlugin plugin)
        {
            return name is not null && _plugins.TryRemove(KeyValuePair.Create(name, plugin));
        }

        /// <summary>
        /// Returns the plugin registered under a name.
        /// </summary>
        /// <param name="name">The name.</param>
        /// <returns>The plugin, or null when none is registered.</returns>
        public static IMarkdownPlugin Get(string name)
        {
            return name is not null && _plugins.TryGetValue(name, out var plugin) ? plugin : null;
        }
    }
}
