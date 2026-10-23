using System.Text.Json;
using System.Text.Json.Nodes;
using WebExpress.WebUI.WebSpreadsheet;

namespace WebExpress.WebUI.Test.WebSpreadsheet
{
    /// <summary>
    /// Tests the server side of the spreadsheet workbook: addressing, building, writing and
    /// reading the JSON the spreadsheet control exchanges, and its validation.
    /// </summary>
    public class UnitTestSpreadsheetWorkbook
    {
        /// <summary>
        /// Tests that column letters and indices convert both ways.
        /// </summary>
        [Theory]
        [InlineData(0, "A")]
        [InlineData(25, "Z")]
        [InlineData(26, "AA")]
        [InlineData(701, "ZZ")]
        [InlineData(16383, "XFD")]
        public void ColumnNamesRoundTrip(int index, string name)
        {
            Assert.Equal(name, SpreadsheetAddress.ColumnName(index));
            Assert.Equal(index, SpreadsheetAddress.ColumnIndex(name));
            Assert.Equal(index, SpreadsheetAddress.ColumnIndex(name.ToLowerInvariant()));
        }

        /// <summary>
        /// Tests that cell names are read with their limits.
        /// </summary>
        [Theory]
        [InlineData("B3", true, 2, 1)]
        [InlineData("$C$10", true, 9, 2)]
        [InlineData("A0", false, -1, -1)]
        [InlineData("XFE1", false, -1, -1)]
        [InlineData("A1048577", false, -1, -1)]
        [InlineData("foo", false, -1, -1)]
        [InlineData(null, false, -1, -1)]
        public void CellNamesAreParsed(string reference, bool valid, int row, int column)
        {
            Assert.Equal(valid, SpreadsheetAddress.TryParseCell(reference, out var r, out var c));
            Assert.Equal(row, r);
            Assert.Equal(column, c);
        }

        /// <summary>
        /// Tests that ranges are read and normalized.
        /// </summary>
        [Fact]
        public void RangesAreParsedAndNormalized()
        {
            Assert.True(SpreadsheetAddress.TryParseRange("C3:A1", out var first, out var last));
            Assert.Equal((0, 0), first);
            Assert.Equal((2, 2), last);
            Assert.True(SpreadsheetAddress.TryParseRange("B2", out first, out last));
            Assert.Equal(first, last);
            Assert.False(SpreadsheetAddress.TryParseRange("A1:B2:C3", out _, out _));
            Assert.False(SpreadsheetAddress.TryParseRange("A1:x", out _, out _));
            Assert.Equal("C2", SpreadsheetAddress.CellName(1, 2));
            Assert.Throws<ArgumentOutOfRangeException>(() => SpreadsheetAddress.ColumnName(-1));
            Assert.Throws<ArgumentException>(() => SpreadsheetAddress.ColumnIndex("1"));
        }

        /// <summary>
        /// Tests that a workbook built in C# is written as the JSON the control reads.
        /// </summary>
        [Fact]
        public void BuiltWorkbookIsWrittenAsJson()
        {
            // arrange
            var workbook = new SpreadsheetWorkbook();
            var sheet = workbook.AddSheet("Plan", 20, 5);
            sheet.SetData(
            [
                ["Item", "Amount"],
                ["Rent", 1200],
                ["Total", "=SUM(B2:B2)"]
            ]);
            sheet.SetValue("C1", true);
            sheet.SetValue("D1", new DateTime(2026, 10, 20));
            sheet.SetValue("D2", new DateTime(2026, 10, 20, 12, 0, 0));
            sheet.Format("A1:B1", style => { style.Bold = true; style.Fill = "#eeeeee"; style.BorderBottom = "thin #000000"; });
            sheet["B2"].Comment = "Monthly";
            sheet["B2"].CommentAuthor = "Ann";
            sheet.Merge("A5:B5").Freeze(1);
            sheet.ColumnWidths[0] = 160;
            sheet.RowStyles[0] = new SpreadsheetStyle { Italic = true };
            sheet.TabColor = "#00ff00";
            sheet.Gridlines = false;
            workbook.DefineName("Rent", "=Plan!$B$2");
            workbook.Styles["head"] = new SpreadsheetStyle { Bold = true };
            workbook.Meta["title"] = "Budget";
            workbook.ActiveSheet = "Plan";

            // act
            var json = JsonNode.Parse(workbook.ToJson())!.AsObject();

            // validation
            Assert.Equal(1, (int)json["version"]!);
            Assert.Equal("Plan", (string)json["activeSheet"]!);
            var cells = json["sheets"]![0]!["cells"]!.AsObject();
            Assert.Equal("Item", (string)cells["A1"]!["v"]!);
            Assert.True((bool)cells["A1"]!["s"]!["bold"]!);
            Assert.Equal("thin #000000", (string)cells["A1"]!["s"]!["border"]!["bottom"]!);
            Assert.Equal(1200, (double)cells["B2"]!["v"]!);
            Assert.Equal("Monthly", (string)cells["B2"]!["c"]!["text"]!);
            Assert.Equal("=SUM(B2:B2)", (string)cells["B3"]!["f"]!);
            Assert.True((bool)cells["C1"]!["v"]!);
            Assert.Equal(46315, (double)cells["D1"]!["v"]!);
            Assert.Equal("yyyy-mm-dd", (string)cells["D1"]!["s"]!["nf"]!);
            Assert.Equal("yyyy-mm-dd hh:mm", (string)cells["D2"]!["s"]!["nf"]!);
            Assert.Equal("A5:B5", (string)json["sheets"]![0]!["merges"]![0]!);
            Assert.Equal(1, (int)json["sheets"]![0]!["frozen"]!["rows"]!);
            Assert.Equal(160, (int)json["sheets"]![0]!["cols"]!["0"]!["size"]!);
            Assert.True((bool)json["sheets"]![0]!["rows"]!["0"]!["s"]!["italic"]!);
            Assert.False((bool)json["sheets"]![0]!["props"]!["gridlines"]!);
            Assert.Equal("Plan!$B$2", (string)json["names"]!["Rent"]!);
            Assert.True((bool)json["styles"]!["head"]!["bold"]!);
            Assert.Equal("Budget", (string)json["meta"]!["title"]!);
            Assert.Contains("\n", workbook.ToJson(true));
            Assert.Equal(workbook.ToJson(), workbook.ToString());
        }

        /// <summary>
        /// Tests that a posted workbook is read with its formula results and errors.
        /// </summary>
        [Fact]
        public void PostedWorkbookIsReadWithResults()
        {
            // arrange
            var json = """
                {"version":1,"sheets":[{"id":"s1","name":"S","rowCount":10,"colCount":4,
                "cells":{"A1":{"v":2},"B1":{"f":"=A1*2","r":4},"C1":{"f":"=1/0","r":{"error":"#DIV/0!"}},
                "D1":{"v":{"href":"https://example.com","text":"Docs"},"t":"link"},"A2":{"v":"x","c":"note"},"bad":{"v":1},
                "A3":{"v":{"x":1}}},
                "data":null,"frozen":{"rows":1,"cols":0},"merges":["C3:D4","E1","x"],
                "rows":{"2":{"size":40,"s":{"color":"#ff0000"}},"x":{}},"props":{"tabColor":"red"}}],
                "names":{"Two":"S!A1","1bad":"S!A1"},"styles":{"t":{"fill":"#00ff00"},"empty":{"evil":1}},"meta":{"by":"me"},"activeSheet":"S"}
                """;

            // act
            var workbook = SpreadsheetWorkbook.Parse(json);
            var sheet = workbook["S"];

            // validation
            Assert.Equal(2d, sheet.GetValue("A1"));
            Assert.Equal(4d, sheet.GetValue("B1"));
            Assert.Equal("#DIV/0!", sheet["C1"].Error);
            Assert.Null(sheet.GetValue("C1"));
            Assert.Equal("link", sheet["D1"].Type);
            Assert.IsAssignableFrom<JsonNode>(sheet["D1"].Value);
            Assert.Equal("note", sheet["A2"].Comment);
            Assert.Null(sheet["A3"]);
            Assert.Equal(1, sheet.FrozenRows);
            Assert.Equal(["C3:D4"], sheet.Merges);
            Assert.Equal(40, sheet.RowHeights[2]);
            Assert.Equal("#ff0000", sheet.RowStyles[2].Color);
            Assert.Equal("red", sheet.TabColor);
            Assert.Single(workbook.Names);
            Assert.Single(workbook.Styles);
            Assert.Equal("me", (string)workbook.Meta["by"]!);
            Assert.Equal("S", workbook.ActiveSheet);
            Assert.Same(sheet, workbook.GetSheet("s1"));
            Assert.False(workbook.IsEmpty);
            Assert.Equal(4, (double)JsonNode.Parse(workbook.ToJsonObject(includeResults: true).ToJsonString())!["sheets"]![0]!["cells"]!["B1"]!["r"]!);
            Assert.Equal("#DIV/0!", (string)workbook.ToJsonObject(includeResults: true)["sheets"]![0]!["cells"]!["C1"]!["r"]!["error"]!);
        }

        /// <summary>
        /// Tests that styles accept only values safe to become css.
        /// </summary>
        [Fact]
        public void StylesAreSanitized()
        {
            var style = SpreadsheetStyle.FromJson(JsonNode.Parse("""
                {"font":"Arial; background:url(x)","size":400,"bold":true,"color":"expression(x)","fill":"rgb(1,2,3)",
                "align":"middle","valign":"top","nf":"0.00","indent":3,"wrap":true,"underline":true,"strike":true,"italic":true,
                "border":{"top":"thin #000","left":"fat","right":"double red","bottom":"dotted expression()"}}
                """));

            Assert.NotNull(style);
            Assert.Null(style.Font);
            Assert.Null(style.Size);
            Assert.True(style.Bold && style.Italic && style.Underline && style.Strike && style.Wrap);
            Assert.Null(style.Color);
            Assert.Equal("rgb(1,2,3)", style.Fill);
            Assert.Null(style.Align);
            Assert.Equal("top", style.VerticalAlign);
            Assert.Equal(3, style.Indent);
            Assert.Equal("thin #000", style.BorderTop);
            Assert.Null(style.BorderLeft);
            Assert.Equal("double red", style.BorderRight);
            Assert.Null(style.BorderBottom);
            Assert.Null(SpreadsheetStyle.FromJson(JsonNode.Parse("""{"evil":true}""")));
            Assert.Null(SpreadsheetStyle.FromJson(null));
            Assert.Equal("{}", new SpreadsheetStyle().ToString());
            Assert.True(SpreadsheetStyle.IsColor("#abcdef"));
            Assert.False(SpreadsheetStyle.IsColor("url(x)"));
            Assert.True(SpreadsheetStyle.IsBorder("medium"));
            Assert.False(SpreadsheetStyle.IsBorder("thin thick #000"));
        }

        /// <summary>
        /// Tests that reading refuses what is no workbook and accepts what is empty.
        /// </summary>
        [Theory]
        [InlineData("[1]")]
        [InlineData("{\"version\":99}")]
        [InlineData("{\"sheets\":[1]}")]
        [InlineData("{ broken")]
        public void InvalidWorkbooksAreRefused(string json)
        {
            Assert.ThrowsAny<JsonException>(() => SpreadsheetWorkbook.Parse(json));
            Assert.False(SpreadsheetWorkbook.TryParse(json, out var workbook));
            Assert.Null(workbook);
        }

        /// <summary>
        /// Tests that an empty value gives one empty sheet and duplicate names are numbered.
        /// </summary>
        [Fact]
        public void EmptyAndDuplicateSheetsAreRepaired()
        {
            var empty = SpreadsheetWorkbook.Parse("");
            Assert.Single(empty.Sheets);
            Assert.True(empty.IsEmpty);
            Assert.True(SpreadsheetWorkbook.TryParse("{}", out var none));
            Assert.Equal("Sheet1", none.Sheets[0].Name);

            var duplicates = SpreadsheetWorkbook.Parse("""{"sheets":[{"name":"A"},{"name":"a"},{"name":"x/y"},{"data":[[1,"=A1"]]}]}""");
            Assert.Equal(["A", "Sheet2", "Sheet3", "Sheet4"], duplicates.Sheets.Select(s => s.Name));
            Assert.Equal("=A1", duplicates.Sheets[3]["B1"].Formula);
            Assert.True(SpreadsheetWorkbook.IsWorkbook(" {\"x\":1}"));
            Assert.False(SpreadsheetWorkbook.IsWorkbook("<p>"));
        }

        /// <summary>
        /// Tests the validation of sheet and range names.
        /// </summary>
        [Fact]
        public void NamesAreValidated()
        {
            var workbook = new SpreadsheetWorkbook();
            workbook.AddSheet("Data");

            Assert.Throws<ArgumentException>(() => workbook.AddSheet("data"));
            Assert.Throws<ArgumentException>(() => workbook.AddSheet("a:b"));
            Assert.Throws<ArgumentException>(() => workbook.AddSheet("'quoted'"));
            Assert.Throws<ArgumentException>(() => workbook.DefineName("B2", "Data!A1"));
            Assert.Throws<ArgumentException>(() => workbook.DefineName("TRUE", "Data!A1"));
            Assert.Throws<ArgumentException>(() => workbook.DefineName("Ok", " "));
            Assert.True(SpreadsheetWorkbook.IsValidName("Revenue_2026"));
            Assert.Null(workbook.GetSheet("missing"));
        }

        /// <summary>
        /// Tests cells of a sheet: setting, clearing, formulas, growing and invalid references.
        /// </summary>
        [Fact]
        public void SheetCellsAreSetAndCleared()
        {
            var sheet = new SpreadsheetSheet("S") { RowCount = 2, ColumnCount = 2 };

            sheet.SetFormula("C5", "A1+1");
            Assert.Equal("=A1+1", sheet["C5"].Formula);
            Assert.Equal(5, sheet.RowCount);
            Assert.Equal(3, sheet.ColumnCount);
            sheet.SetValue("C5", 3.5);
            Assert.Null(sheet["C5"].Formula);
            Assert.Equal(3.5, sheet.GetValue("C5"));
            sheet["C5"] = null;
            Assert.Null(sheet["C5"]);
            Assert.Null(sheet.GetValue("C5"));
            sheet.SetCell(0, 0, new SpreadsheetCell { Value = "x" });
            Assert.Single(sheet.Cells);
            Assert.True(sheet.Cells.ContainsKey("A1"));
            Assert.Throws<ArgumentException>(() => sheet.SetValue("nope", 1));
            Assert.Throws<ArgumentException>(() => sheet.SetFormula("A1", " "));
            Assert.Throws<ArgumentOutOfRangeException>(() => sheet.SetCell(-1, 0, null));
            Assert.Throws<ArgumentException>(() => sheet.Merge("A1"));
            Assert.Throws<ArgumentException>(() => sheet.Format("x", _ => { }));
            Assert.Throws<ArgumentNullException>(() => sheet.Format("A1", null));
            Assert.Equal(0, sheet.Freeze(-3, -1).FrozenRows);
        }

        /// <summary>
        /// Tests the cell conversions of values and empty cells.
        /// </summary>
        [Fact]
        public void CellsConvertValues()
        {
            Assert.Null(SpreadsheetCell.FromJson(null));
            Assert.Equal(5d, SpreadsheetCell.FromJson(JsonValue.Create(5)).Value);
            Assert.Equal("t", SpreadsheetCell.FromJson(JsonValue.Create("t")).Value);
            Assert.Null(SpreadsheetCell.FromJson(JsonNode.Parse("""{"v":""}""")));
            var comment = SpreadsheetCell.FromJson(JsonNode.Parse("""{"c":{"text":"hi","author":"Ann"},"st":"good","m":{"options":["a"]}}"""));
            Assert.Equal("Ann", comment.CommentAuthor);
            Assert.Equal("good", comment.StyleName);
            Assert.True(comment.IsEmpty);
            var json = comment.ToJson()!;
            Assert.Equal("hi", (string)json["c"]!["text"]!);
            Assert.Equal("a", (string)json["m"]!["options"]![0]!);
            Assert.Null(new SpreadsheetCell().ToJson());
            Assert.Equal(7d, (double)new SpreadsheetCell { Value = 7 }.ToJson()!["v"]!);
            Assert.Equal("http://x/", (string)new SpreadsheetCell { Value = new Uri("http://x") }.ToJson()!["v"]!);
            Assert.Equal(46315.5, SpreadsheetDate.ToSerial(new DateTime(2026, 10, 20, 12, 0, 0)));
            Assert.Equal(new DateTime(2026, 10, 20, 12, 0, 0), SpreadsheetDate.FromSerial(46315.5));
        }

        /// <summary>
        /// Verifies that visibility survives a server round trip alongside sizes and styles.
        /// </summary>
        [Fact]
        public void HiddenAxesAndSheetsSurviveRoundTrip()
        {
            // arrange
            const string input = """
                {"version":1,"sheets":[{"name":"Budget","rowCount":10,"colCount":4,
                "rows":{"0":{"hidden":true},"1":{"hidden":true,"size":40,"s":{"bold":true}}},
                "cols":{"0":{"hidden":true},"1":{"hidden":true,"size":120,"s":{"italic":true}}},
                "props":{"hidden":true,"gridlines":false,"tabColor":"red"}}]}
                """;

            // act
            var workbook = SpreadsheetWorkbook.Parse(input);
            var sheet = JsonNode.Parse(workbook.ToJson())["sheets"][0];

            // validation
            Assert.True((bool)sheet["rows"]["0"]["hidden"]);
            Assert.True((bool)sheet["rows"]["1"]["hidden"]);
            Assert.Equal(40, (int)sheet["rows"]["1"]["size"]);
            Assert.True((bool)sheet["rows"]["1"]["s"]["bold"]);
            Assert.True((bool)sheet["cols"]["0"]["hidden"]);
            Assert.True((bool)sheet["cols"]["1"]["hidden"]);
            Assert.Equal(120, (int)sheet["cols"]["1"]["size"]);
            Assert.True((bool)sheet["cols"]["1"]["s"]["italic"]);
            Assert.True((bool)sheet["props"]["hidden"]);
            Assert.False((bool)sheet["props"]["gridlines"]);
            Assert.Equal("red", (string)sheet["props"]["tabColor"]);
        }

        /// <summary>
        /// Verifies that only boolean true hides valid rows, columns and sheets.
        /// </summary>
        /// <param name="flag">The JSON visibility value.</param>
        [Theory]
        [InlineData("false")]
        [InlineData("null")]
        [InlineData("\"true\"")]
        [InlineData("1")]
        public void InvalidOrFalseHiddenFlagsRemainVisible(string flag)
        {
            // arrange
            var input = """
                {"sheets":[{"name":"S","rowCount":2,"colCount":2,
                "rows":{"0":{"hidden":FLAG},"-1":{"hidden":true},"2":{"hidden":true}},
                "cols":{"0":{"hidden":FLAG},"-1":{"hidden":true},"2":{"hidden":true}},"props":{"hidden":FLAG}}]}
                """.Replace("FLAG", flag);

            // act
            var sheet = JsonNode.Parse(SpreadsheetWorkbook.Parse(input).ToJson())["sheets"][0];

            // validation
            Assert.Null(sheet["rows"]);
            Assert.Null(sheet["cols"]);
            Assert.Null(sheet["props"]);
        }
    }
}
