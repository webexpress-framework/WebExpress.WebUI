using System;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the schedule control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlSchedule
    {
        /// <summary>
        /// Tests the id property of the schedule control.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-schedule"" role=""region""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-webui-schedule"" role=""region""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSchedule(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the view and the offered views emit their attributes only
        /// when they differ from the client default.
        /// </summary>
        [Theory]
        [InlineData(TypeViewSchedule.Default, null, @"<div class=""wx-webui-schedule"" role=""region""></div>")]
        [InlineData(TypeViewSchedule.Agenda, null, @"<div class=""wx-webui-schedule"" role=""region"" data-view=""agenda""></div>")]
        [InlineData(TypeViewSchedule.Week, "week,month", @"<div class=""wx-webui-schedule"" role=""region"" data-view=""week"" data-views=""week,month""></div>")]
        [InlineData(TypeViewSchedule.Month, null, @"<div class=""wx-webui-schedule"" role=""region"" data-view=""month""></div>")]
        public void View(TypeViewSchedule view, string views, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSchedule()
            {
                View = _ => view,
                Views = views is null ? null : _ => views
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the agenda grouping of the schedule control.
        /// </summary>
        [Theory]
        [InlineData(TypeGroupingScheduleAgenda.Default, @"<div class=""wx-webui-schedule"" role=""region""></div>")]
        [InlineData(TypeGroupingScheduleAgenda.Day, @"<div class=""wx-webui-schedule"" role=""region"" data-agenda-grouping=""day""></div>")]
        [InlineData(TypeGroupingScheduleAgenda.Week, @"<div class=""wx-webui-schedule"" role=""region"" data-agenda-grouping=""week""></div>")]
        [InlineData(TypeGroupingScheduleAgenda.Month, @"<div class=""wx-webui-schedule"" role=""region"" data-agenda-grouping=""month""></div>")]
        public void AgendaGrouping(TypeGroupingScheduleAgenda grouping, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSchedule()
            {
                AgendaGrouping = _ => grouping
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the calendar culture configuration: the culture tag, the week
        /// start and the ISO week numbering.
        /// </summary>
        [Theory]
        [InlineData(null, null, false, @"<div class=""wx-webui-schedule"" role=""region""></div>")]
        [InlineData("de-DE", null, false, @"<div class=""wx-webui-schedule"" role=""region"" data-culture=""de-DE""></div>")]
        [InlineData("en-US", DayOfWeek.Sunday, false, @"<div class=""wx-webui-schedule"" role=""region"" data-culture=""en-US"" data-week-start=""0""></div>")]
        [InlineData("de-DE", DayOfWeek.Monday, true, @"<div class=""wx-webui-schedule"" role=""region"" data-culture=""de-DE"" data-week-start=""1"" data-iso-week=""true""></div>")]
        [InlineData("th-TH-u-ca-buddhist", DayOfWeek.Saturday, false, @"<div class=""wx-webui-schedule"" role=""region"" data-culture=""th-TH-u-ca-buddhist"" data-week-start=""6""></div>")]
        public void CalendarCulture(string culture, DayOfWeek? weekStart, bool isoWeek, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSchedule()
            {
                Culture = culture is null ? null : _ => culture,
                WeekStart = _ => weekStart,
                IsoWeek = _ => isoWeek
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that only the opt-out of the holiday marking is emitted,
        /// because the client marks them unless it reads an explicit "false".
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-webui-schedule"" role=""region""></div>")]
        [InlineData(true, @"<div class=""wx-webui-schedule"" role=""region""></div>")]
        [InlineData(false, @"<div class=""wx-webui-schedule"" role=""region"" data-show-holidays=""false""></div>")]
        public void ShowHolidays(bool? show, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSchedule()
            {
                ShowHolidays = show is null ? null : _ => show.Value
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that only the opt-out of the time axis is emitted, and that the
        /// axis bounds are carried when they narrow it.
        /// </summary>
        [Theory]
        [InlineData(null, null, null, @"<div class=""wx-webui-schedule"" role=""region""></div>")]
        [InlineData(true, 8, 20, @"<div class=""wx-webui-schedule"" role=""region"" data-hour-start=""8"" data-hour-end=""20""></div>")]
        [InlineData(false, null, null, @"<div class=""wx-webui-schedule"" role=""region"" data-time-axis=""false""></div>")]
        public void TimeAxis(bool? axis, int? hourStart, int? hourEnd, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSchedule()
            {
                TimeAxis = axis is null ? null : _ => axis.Value,
                HourStart = _ => hourStart,
                HourEnd = _ => hourEnd
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests the optional affordances of the schedule: the week numbers, the
        /// mini calendar and the editable items.
        /// </summary>
        [Theory]
        [InlineData(false, false, false, @"<div class=""wx-webui-schedule"" role=""region""></div>")]
        [InlineData(true, false, false, @"<div class=""wx-webui-schedule"" role=""region"" data-week-numbers=""true""></div>")]
        [InlineData(false, true, false, @"<div class=""wx-webui-schedule"" role=""region"" data-mini-calendar=""true""></div>")]
        [InlineData(false, false, true, @"<div class=""wx-webui-schedule"" role=""region"" data-editable=""true""></div>")]
        [InlineData(true, true, true, @"<div class=""wx-webui-schedule"" role=""region"" data-week-numbers=""true"" data-mini-calendar=""true"" data-editable=""true""></div>")]
        public void Affordances(bool weekNumbers, bool miniCalendar, bool editable, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSchedule()
            {
                ShowWeekNumbers = _ => weekNumbers,
                MiniCalendar = _ => miniCalendar,
                Editable = _ => editable
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that the initial date is emitted as a bare date.
        /// </summary>
        [Fact]
        public void Date_SerializesAsBareDate()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSchedule()
            {
                Date = _ => new DateTime(2026, 8, 15, 13, 0, 0)
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(
                @"<div class=""wx-webui-schedule"" role=""region"" data-date=""2026-08-15""></div>", html);
        }

        /// <summary>
        /// Tests that the items and the holidays are rendered as descriptor
        /// children, which is what the client reads its model from.
        /// </summary>
        [Fact]
        public void Add_RendersDescriptors()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlSchedule("s");

            control
                .Add(new ControlScheduleItem("a")
                {
                    Title = _ => "Quest",
                    Start = _ => new DateTime(2026, 8, 12, 10, 0, 0),
                    End = _ => new DateTime(2026, 8, 12, 11, 0, 0)
                })
                .Add(new ControlScheduleHoliday()
                {
                    Date = _ => new DateTime(2026, 8, 15),
                    Name = _ => "Assumption Day"
                });

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(
                @"<div id=""s"" class=""wx-webui-schedule"" role=""region"">"
                + @"<div id=""a"" class=""wx-schedule-item"" data-title=""Quest"" data-start=""2026-08-12T10:00:00"" data-end=""2026-08-12T11:00:00""></div>"
                + @"<div class=""wx-schedule-holiday"" data-date=""2026-08-15"" data-name=""Assumption Day""></div>"
                + @"</div>", html);
        }

        /// <summary>
        /// Tests that the items and the holidays are exposed for inspection and
        /// that a null entry is dropped rather than rendered as an empty one.
        /// </summary>
        [Fact]
        public void Add_IgnoresNull()
        {
            // arrange
            var control = new ControlSchedule();

            // act
            control.Add((IControlScheduleItem)null, new ControlScheduleItem("a"));
            control.Add((IControlScheduleHoliday)null);

            // validation
            Assert.Single(control.Items);
            Assert.Empty(control.Holidays);
        }
    }
}
