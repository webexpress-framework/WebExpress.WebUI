using WebExpress.WebCore.WebAttribute;
using WebExpress.WebCore.WebInclude;

namespace WebExpress.WebUI.Test.WebInclude
{
    /// <summary>
    /// An include declared by the plugin that owns the test application, which is the case
    /// the asset manager mounts straight on the application route rather than under a
    /// segment of the plugin's own.
    /// </summary>
    [Asset("/assets/css/testinclude.css")]
    [Asset("/assets/js/testinclude.js")]
    public sealed class TestIncludeOwnPlugin : IInclude
    {
    }
}
