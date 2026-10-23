using System;
using WebExpress.WebUI.Test.Fixture;
using WebExpress.WebUI.WebControl;
using WebExpress.WebUI.WebPage;

namespace WebExpress.WebUI.Test.WebControl
{
    /// <summary>
    /// Tests the holiday of the schedule control.
    /// </summary>
    [Collection("NonParallelTests")]
    public class UnitTestControlScheduleHoliday
    {
        /// <summary>
        /// Tests the id property of the schedule holiday.
        /// </summary>
        [Theory]
        [InlineData(null, @"<div class=""wx-schedule-holiday""></div>")]
        [InlineData("id", @"<div id=""id"" class=""wx-schedule-holiday""></div>")]
        public void Id(string id, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlScheduleHoliday(id)
            {
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }

        /// <summary>
        /// Tests that a holiday is emitted as a bare date, because it is a whole
        /// day rather than a moment and must not shift with the visitor's zone.
        /// </summary>
        [Fact]
        public void Date_SerializesAsBareDate()
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlScheduleHoliday()
            {
                // the time of day is deliberately non-zero and must not survive
                Date = _ => new DateTime(2026, 8, 15, 23, 30, 0),
                Name = _ => "Assumption Day"
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(
                @"<div class=""wx-schedule-holiday"" data-date=""2026-08-15"" data-name=""Assumption Day""></div>", html);
        }

        /// <summary>
        /// Tests that the region and the kind reach the client, and that the
        /// neutral kind emits no attribute.
        /// </summary>
        [Theory]
        [InlineData(TypeHolidaySchedule.Default, @"<div class=""wx-schedule-holiday"" data-date=""2026-08-15"" data-region=""BY""></div>")]
        [InlineData(TypeHolidaySchedule.Public, @"<div class=""wx-schedule-holiday"" data-date=""2026-08-15"" data-region=""BY"" data-type=""public""></div>")]
        [InlineData(TypeHolidaySchedule.Observance, @"<div class=""wx-schedule-holiday"" data-date=""2026-08-15"" data-region=""BY"" data-type=""observance""></div>")]
        public void Type(TypeHolidaySchedule type, string expected)
        {
            // arrange
            var componentHub = UnitTestControlFixture.CreateAndRegisterComponentHubMock();
            var context = UnitTestControlFixture.CreateRenderContextMock();
            var visualTree = new VisualTreeControl(componentHub, context.PageContext);
            var control = new ControlScheduleHoliday()
            {
                Date = _ => new DateTime(2026, 8, 15),
                Region = _ => "BY",
                Type = _ => type
            };

            // act
            var html = control.Render(context, visualTree);

            // validation
            AssertExtensions.EqualWithPlaceholders(expected, html);
        }
    }
}
