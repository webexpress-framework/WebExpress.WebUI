using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Threading;
using WebExpress.WebCore;
using WebExpress.WebCore.Internationalization;
using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebComponent;
using WebExpress.WebCore.WebPlugin;

namespace WebExpress.WebUI.WebPdf
{
    /// <summary>
    /// Keeps <see cref="PdfPluginRegistry"/> in step with the loaded plugins: the
    /// <see cref="IPdfPlugin"/> implementations of a plugin are registered when it is loaded
    /// and removed when it is unloaded, so a text that names a plugin of an add-on renders
    /// exactly while the add-on is installed.
    /// </summary>
    public sealed class PdfPluginManager : IComponentManager
    {
        private readonly IComponentHub _componentHub;
        private readonly IHttpServerContext _httpServerContext;
        private readonly Dictionary<IPluginContext, List<(string Name, IPdfPlugin Plugin)>> _dictionary = [];
        private readonly Lock _lock = new();

        /// <summary>
        /// Initializes a new instance of the class.
        /// </summary>
        /// <param name="componentHub">The component hub.</param>
        /// <param name="httpServerContext">The reference to the context of the host.</param>
        [SuppressMessage("CodeQuality", "IDE0051:Remove unused private members", Justification = "Used via Reflection.")]
        private PdfPluginManager(IComponentHub componentHub, IHttpServerContext httpServerContext)
        {
            _componentHub = componentHub;
            _httpServerContext = httpServerContext;

            _componentHub?.PluginManager?.AddPlugin += OnAddPlugin;
            _componentHub?.PluginManager?.RemovePlugin += OnRemovePlugin;

            // the manager is created while the webui plugin loads, so plugins loaded before it
            // have already raised their event
            foreach (var pluginContext in _componentHub?.PluginManager?.Plugins ?? [])
            {
                Register(pluginContext);
            }

            _httpServerContext?.Log?.Debug
            (
                I18N.Translate("webexpress.webui:pdfpluginmanager.initialization")
            );
        }

        /// <summary>
        /// Discovers and registers the PDF plugins of a plugin.
        /// </summary>
        /// <param name="pluginContext">The context of the plugin.</param>
        private void Register(IPluginContext pluginContext)
        {
            if (pluginContext?.Assembly is null)
            {
                return;
            }

            lock (_lock)
            {
                if (_dictionary.ContainsKey(pluginContext))
                {
                    return;
                }

                var registered = new List<(string Name, IPdfPlugin Plugin)>();
                _dictionary.Add(pluginContext, registered);

                foreach (var type in pluginContext.Assembly.GetExportedTypes()
                    .Where(x => x.IsClass && x.IsSealed && typeof(IPdfPlugin).IsAssignableFrom(x)))
                {
                    var name = type.CustomAttributes
                        .Where(x => x.AttributeType == typeof(NameAttribute))
                        .Select(x => x.ConstructorArguments.FirstOrDefault().Value?.ToString())
                        .FirstOrDefault();

                    if (string.IsNullOrWhiteSpace(name))
                    {
                        _httpServerContext?.Log?.Warning
                        (
                            I18N.Translate("webexpress.webui:pdfpluginmanager.noname", type.FullName)
                        );

                        continue;
                    }

                    var plugin = ComponentActivator.CreateInstance<IPdfPlugin>(_httpServerContext, _componentHub, type);

                    if (!PdfPluginRegistry.Register(name, plugin))
                    {
                        _httpServerContext?.Log?.Warning
                        (
                            I18N.Translate("webexpress.webui:pdfpluginmanager.duplicate", name, pluginContext.PluginId)
                        );

                        continue;
                    }

                    registered.Add((name, plugin));

                    _httpServerContext?.Log?.Debug
                    (
                        I18N.Translate("webexpress.webui:pdfpluginmanager.register", name, pluginContext.PluginId)
                    );
                }
            }
        }

        /// <summary>
        /// Removes the PDF plugins a plugin has registered.
        /// </summary>
        /// <param name="pluginContext">The context of the plugin.</param>
        private void Remove(IPluginContext pluginContext)
        {
            lock (_lock)
            {
                if (pluginContext is null || !_dictionary.Remove(pluginContext, out var registered))
                {
                    return;
                }

                foreach (var (name, plugin) in registered)
                {
                    PdfPluginRegistry.Remove(name, plugin);
                }
            }
        }

        /// <summary>
        /// Raises the event when a plugin is added.
        /// </summary>
        /// <param name="sender">The source of the event.</param>
        /// <param name="e">The context of the plugin being added.</param>
        private void OnAddPlugin(object sender, IPluginContext e)
        {
            Register(e);
        }

        /// <summary>
        /// Raises the event when a plugin is removed.
        /// </summary>
        /// <param name="sender">The source of the event.</param>
        /// <param name="e">The context of the plugin being removed.</param>
        private void OnRemovePlugin(object sender, IPluginContext e)
        {
            Remove(e);
        }

        /// <summary>
        /// Releases the plugin events and the names this manager has registered, so a
        /// restarted server starts from the plugins it actually loads.
        /// </summary>
        public void Dispose()
        {
            _componentHub?.PluginManager?.AddPlugin -= OnAddPlugin;
            _componentHub?.PluginManager?.RemovePlugin -= OnRemovePlugin;

            List<IPluginContext> pluginContexts;

            lock (_lock)
            {
                pluginContexts = [.. _dictionary.Keys];
            }

            foreach (var pluginContext in pluginContexts)
            {
                Remove(pluginContext);
            }

            GC.SuppressFinalize(this);
        }
    }
}
