using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using WebExpress.WebCore.WebSession;
using WebExpress.WebUI.WebNotification;

namespace WebExpress.WebUI.WebSession
{
    /// <summary>
    /// Collection of notifications.
    /// Key = The notification id.
    /// Value = The notification.
    /// </summary>
    [JsonConverter(typeof(SessionPropertyNotificationConverter))]
    public class SessionPropertyNotification : Dictionary<Guid, INotification>, ISessionProperty
    {
    }
}
