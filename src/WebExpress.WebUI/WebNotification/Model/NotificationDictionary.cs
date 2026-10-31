using System;
using System.Collections.Generic;
using System.Linq;
using WebExpress.WebCore.WebApplication;

namespace WebExpress.WebUI.WebNotification.Model
{
    /// <summary>
    /// Represents a dictionary that manages notifications for different application contexts.
    /// </summary>
    internal class NotificationDictionary
    {
        private readonly Dictionary<IApplicationContext, Dictionary<Guid, INotification>> _dict = [];

        /// <summary>
        /// Adds a notification item to the dictionary.
        /// </summary>
        /// <param name="applicationContext">The application context.</param>
        /// <param name="notification">The notification.</param>
        /// <returns>True if the notification item was added successfully, false if an element with the same key already exists.</returns>
        public bool AddNotificationItem(IApplicationContext applicationContext, INotification notification)
        {
            if (!_dict.TryGetValue(applicationContext, out var notificationDict))
            {
                notificationDict = new Dictionary<Guid, INotification>();
                _dict[applicationContext] = notificationDict;
            }

            if (!notificationDict.ContainsKey(notification.Id))
            {
                notificationDict.Add(notification.Id, notification);

                return true;
            }

            return false; // notification with the same id already exists
        }

        /// <summary>
        /// Removes notifications from the dictionary.
        /// </summary>
        /// <param name="applicationContext">The application context.</param>
        /// <returns>An IEnumerable of notification that were removed.</returns>
        public IEnumerable<INotification> RemoveNotifications(IApplicationContext applicationContext)
        {
            if (_dict.TryGetValue(applicationContext, out var notificationDict))
            {
                var notifications = notificationDict.Values;

                _dict.Remove(applicationContext);

                foreach (var item in notifications)
                {
                    yield return item;
                }
            }
        }

        /// <summary>
        /// Removes notifications from the dictionary by their unique identifier.
        /// </summary>
        /// <param name="id">The unique identifier of the notification to be removed.</param>
        /// <returns>The notification that were removed or null if no notification was found with the given id.</returns>
        public INotification RemoveNotification(Guid id)
        {
            foreach (var notificationDict in _dict.Values)
            {
                if (notificationDict.TryGetValue(id, out var notification))
                {
                    notificationDict.Remove(id);

                    return notification;
                }
            }

            return null;
        }

        /// <summary>
        /// Returns all notification for a given application context.
        /// </summary>
        /// <param name="applicationContext">The application context.</param>
        /// <returns>An IEnumerable of notifications.</returns>
        public IEnumerable<INotification> GetNotifications(IApplicationContext applicationContext)
        {
            return _dict.Where(x => x.Key == applicationContext)
                       .SelectMany(x => x.Value.Values);
        }
    }
}
