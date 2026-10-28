using System;
using System.Collections.Frozen;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace WebExpress.WebUI.WebControl
{
    /// <summary>
    /// The telephone numbering plans of the countries in the <see cref="CountryCatalog"/>: their
    /// calling code, the national prefix dialled before a national number, and the lengths a
    /// national number may have. A number is stored in the international E.164 form
    /// (+4930123456), because that form dials from everywhere and names its country. The
    /// countries sharing a calling code, such as the members of +1: in the order of the metadata, 
    /// the main country first, each by its leading digits or the patterns of its number types. The 
    /// client keeps the same table in webexpress.webui.phone.js; a test holds the two equal.
    /// </summary>
    public static class PhoneCatalog
    {
        /// <summary>
        /// One numbering plan. The detection is null for a country whose calling code is its own.
        /// </summary>
        private sealed record Plan(string Country, string CallingCode, string NationalPrefix, int[] Lengths, string Detect)
        {
            /// <summary>
            /// Gets the compiled detection, or null where the country needs none.
            /// </summary>
            public Regex Detection { get; } = Detect is null ? null : new Regex(Detect, RegexOptions.CultureInvariant);
        }

        private static readonly Plan[] _plans =
        [
            new("US", "1", "1", [10], @"^(?:(?:3052(?:0[0-8]|[1-9]\d)|5056(?:[0-35-9]\d|4[0-68]))\d{4}|(?:2742|305[3-9]|472[247-9]|505[2-57-9]|983[2-47-9])\d{6}|(?:2(?:0[1-35-9]|1[02-9]|2[03-57-9]|3[1459]|4[08]|5[1-46]|6[0279]|7[0269]|8[13])|3(?:0[1-47-9]|1[02-9]|2[0135-79]|3[0-24679]|4[167]|5[0-2]|6[01349]|8[056])|4(?:0[124-9]|1[02-579]|2[3-5]|3[0245]|4[023578]|58|6[349]|7[0589]|8[04])|5(?:0[1-47-9]|1[0235-8]|20|3[0149]|4[01]|5[179]|6[1-47]|7[0-5]|8[0256])|6(?:0[1-35-9]|1[024-9]|2[03689]|3[016]|4[0156]|5[01679]|6[0-279]|78|8[0-29])|7(?:0[1-46-8]|1[2-9]|2[04-8]|3[0-247]|4[0378]|5[47]|6[02359]|7[0-59]|8[156])|8(?:0[1-68]|1[02-8]|2[0168]|3[0-2589]|4[03578]|5[046-9]|6[02-5]|7[028])|9(?:0[1346-9]|1[02-9]|2[0589]|3[0146-8]|4[01357-9]|5[12469]|7[0-3589]|8[04-69]))[2-9]\d{6}|8(?:00|33|44|55|66|77|88)[2-9]\d{6}|900[2-9]\d{6}|52(?:3(?:[2-46-9][02-9]\d|5(?:[02-46-9]\d|5[0-46-9]))|4(?:[2-478][02-9]\d|5(?:[034]\d|2[024-9]|5[0-46-9])|6(?:0[1-9]|[2-9]\d)|9(?:[05-9]\d|2[0-5]|49)))\d{4}|52[34][2-9]1[02-9]\d{4}|5(?:00|2[125-9]|33|44|66|77|88)[2-9]\d{6}|305209\d{4})$"),
            new("AG", "1", "1", [10], @"^(?:268)"),
            new("AI", "1", "1", [10], @"^(?:264)"),
            new("AS", "1", "1", [10], @"^(?:684)"),
            new("BB", "1", "1", [10], @"^(?:246)"),
            new("BM", "1", "1", [10], @"^(?:441)"),
            new("BS", "1", "1", [10], @"^(?:242)"),
            new("CA", "1", "1", [7, 10], @"^(?:(?:2(?:04|[23]6|[48]9|5[07]|63)|3(?:06|43|54|6[578]|82)|4(?:03|1[68]|[26]8|3[178]|50|74)|5(?:06|1[49]|48|79|8[147])|6(?:04|[18]3|39|47|72)|7(?:0[59]|42|53|78|8[02])|8(?:[06]7|19|25|7[39])|9(?:0[25]|42))[2-9]\d{6}|8(?:00|33|44|55|66|77|88)[2-9]\d{6}|900[2-9]\d{6}|52(?:3(?:[2-46-9][02-9]\d|5(?:[02-46-9]\d|5[0-46-9]))|4(?:[2-478][02-9]\d|5(?:[034]\d|2[024-9]|5[0-46-9])|6(?:0[1-9]|[2-9]\d)|9(?:[05-9]\d|2[0-5]|49)))\d{4}|52[34][2-9]1[02-9]\d{4}|(?:5(?:2[125-9]|33|44|66|77|88)|6(?:22|33))[2-9]\d{6}|310\d{4}|600[2-9]\d{6})$"),
            new("DM", "1", "1", [10], @"^(?:767)"),
            new("DO", "1", "1", [10], @"^(?:8001|8[024]9)"),
            new("GD", "1", "1", [10], @"^(?:473)"),
            new("GU", "1", "1", [10], @"^(?:671)"),
            new("JM", "1", "1", [10], @"^(?:658|876)"),
            new("KN", "1", "1", [10], @"^(?:869)"),
            new("KY", "1", "1", [10], @"^(?:345)"),
            new("LC", "1", "1", [10], @"^(?:758)"),
            new("MP", "1", "1", [10], @"^(?:670)"),
            new("MS", "1", "1", [10], @"^(?:664)"),
            new("PR", "1", "1", [10], @"^(?:787|939)"),
            new("SX", "1", "1", [10], @"^(?:721)"),
            new("TC", "1", "1", [10], @"^(?:649)"),
            new("TT", "1", "1", [10], @"^(?:868)"),
            new("VC", "1", "1", [10], @"^(?:784)"),
            new("VG", "1", "1", [10], @"^(?:284)"),
            new("VI", "1", "1", [10], @"^(?:340)"),
            new("RU", "7", "8", [10, 14], @"^(?:336(?:[013-9]\d|2[013-9])\d{5}|(?:3(?:0[12]|4[1-35-79]|5[1-3]|65|8[1-58]|9[0145])|4(?:01|1[1356]|2[13467]|7[1-5]|8[1-7]|9[1-689])|8(?:1[1-8]|2[01]|3[13-6]|4[0-8]|5[15-7]|6[0-35-79]|7[1-37-9]))\d{7}|9\d{9}|8(?:0[04]|108\d{3})\d{7}|80[39]\d{7}|808\d{7})$"),
            new("KZ", "7", "8", [10, 14], @"^(?:33622|7)"),
            new("EG", "20", "0", [8, 9, 10], null),
            new("ZA", "27", "0", [5, 6, 7, 8, 9, 10], null),
            new("GR", "30", "", [10, 11, 12], null),
            new("NL", "31", "0", [5, 6, 7, 8, 9, 10, 11], null),
            new("BE", "32", "0", [8, 9], null),
            new("FR", "33", "0", [9], null),
            new("ES", "34", "", [9], null),
            new("HU", "36", "06", [8, 9], null),
            new("IT", "39", "", [6, 7, 8, 9, 10, 11, 12], @"^(?:0669[0-79]\d{1,6}|0(?:1(?:[0159]\d|[27][1-5]|31|4[1-4]|6[1356]|8[2-57])|2\d\d|3(?:[0159]\d|2[1-4]|3[12]|[48][1-6]|6[2-59]|7[1-7])|4(?:[0159]\d|[23][1-9]|4[245]|6[1-5]|7[1-4]|81)|5(?:[0159]\d|2[1-5]|3[2-6]|4[1-79]|6[4-6]|7[1-578]|8[3-8])|6(?:[0-57-9]\d|6[0-8])|7(?:[0159]\d|2[12]|3[1-7]|4[2-46]|6[13569]|7[13-6]|8[1-59])|8(?:[0159]\d|2[3-578]|3[1-356]|[6-8][1-5])|9(?:[0159]\d|[238][1-5]|4[12]|6[1-8]|7[1-6]))\d{2,7}|3[2-9]\d{7,8}|(?:31|43)\d{8}|80(?:0\d{3}|3)\d{3}|(?:0878\d{3}|89(?:2\d|3[04]|4(?:[0-4]|[5-9]\d\d)|5[0-4]))\d\d|(?:1(?:44|6[346])|89(?:38|5[5-9]|9))\d{6}|1(?:78\d|99)\d{6}|3[2-8]\d{9,10}|55\d{8}|84(?:[08]\d{3}|[17])\d{3})$"),
            new("VA", "39", "", [6, 7, 8, 9, 10, 11, 12], @"^(?:06698)"),
            new("RO", "40", "0", [6, 9], null),
            new("CH", "41", "0", [9, 12], null),
            new("AT", "43", "0", [4, 5, 6, 7, 8, 9, 10, 11, 12, 13], null),
            new("GB", "44", "0", [7, 9, 10], @"^(?:(?:1(?:1(?:3(?:[0-58]\d\d|73[0-35])|4(?:(?:[0-5]\d|70)\d|69[7-9])|(?:(?:5[0-26-9]|[78][0-49])\d|6(?:[0-4]\d|50))\d)|(?:2(?:(?:0[024-9]|2[3-9]|3[3-79]|4[1-689]|[58][02-9]|6[0-47-9]|7[013-9]|9\d)\d|1(?:[0-7]\d|8[0-3]))|(?:3(?:0\d|1[0-8]|[25][02-9]|3[02-579]|[468][0-46-9]|7[1-35-79]|9[2-578])|4(?:0[03-9]|[137]\d|[28][02-57-9]|4[02-69]|5[0-8]|[69][0-79])|5(?:0[1-35-9]|[16]\d|2[024-9]|3[015689]|4[02-9]|5[03-9]|7[0-35-9]|8[0-468]|9[0-57-9])|6(?:0[034689]|1\d|2[0-35689]|[38][013-9]|4[1-467]|5[0-69]|6[13-9]|7[0-8]|9[0-24578])|7(?:0[0246-9]|2\d|3[0236-8]|4[03-9]|5[0-46-9]|6[013-9]|7[0-35-9]|8[024-9]|9[02-9])|8(?:0[35-9]|2[1-57-9]|3[02-578]|4[0-578]|5[124-9]|6[2-69]|7\d|8[02-9]|9[02569])|9(?:0[02-589]|[18]\d|2[02-689]|3[1-57-9]|4[2-9]|5[0-579]|6[2-47-9]|7[0-24578]|9[2-57]))\d)\d)|2(?:0[013478]|3[0189]|4[017]|8[0-46-9]|9[0-2])\d{3})\d{4}|1(?:2(?:0(?:46[1-4]|87[2-9])|545[1-79]|76(?:2\d|3[1-8]|6[1-6])|9(?:7(?:2[0-4]|3[2-5])|8(?:2[2-8]|7[0-47-9]|8[3-5])))|3(?:6(?:38[2-5]|47[23])|8(?:47[04-9]|64[0157-9]))|4(?:044[1-7]|20(?:2[23]|8\d)|6(?:0(?:30|5[2-57]|6[1-8]|7[2-8])|140)|8(?:052|87[1-3]))|5(?:2(?:4(?:3[2-79]|6\d)|76\d)|6(?:26[06-9]|686))|6(?:06(?:4\d|7[4-79])|295[5-7]|35[34]\d|47(?:24|61)|59(?:5[08]|6[67]|74)|9(?:55[0-4]|77[23]))|7(?:26(?:6[13-9]|7[0-7])|(?:442|688)\d|50(?:2[0-3]|[3-68]2|76))|8(?:27[56]\d|37(?:5[2-5]|8[239])|843[2-58])|9(?:0(?:0(?:6[1-8]|85)|52\d)|3583|4(?:66[1-8]|9(?:2[01]|81))|63(?:23|3[1-4])|9561))\d{3}|7(?:457[0-57-9]|700[01]|911[028])\d{5}|7(?:[1-3]\d\d|4(?:[0-46-9]\d|5[0-689])|5(?:0[0-8]|[13-9]\d|2[0-35-9])|7(?:0[1-9]|[1-7]\d|8[02-9]|9[0-689])|8(?:[014-9]\d|[23][0-8])|9(?:[024-9]\d|1[02-9]|3[0-689]))\d{6}|80[08]\d{7}|800\d{6}|8001111|(?:8(?:4[2-5]|7[0-3])|9(?:[01]\d|8[2-49]))\d{7}|845464\d|70\d{8}|(?:3[0347]|55)\d{8}|76(?:464|652)\d{5}|76(?:0[0-28]|2[356]|34|4[01347]|5[49]|6[0-369]|77|8[14]|9[139])\d{6}|56\d{8})$"),
            new("GG", "44", "0", [7, 9, 10], @"^(?:1481[25-9]\d{5}|7(?:(?:781|839)\d|911[17])\d{5}|80[08]\d{7}|800\d{6}|8001111|(?:8(?:4[2-5]|7[0-3])|9(?:[01]\d|8[0-3]))\d{7}|845464\d|70\d{8}|(?:3[0347]|55)\d{8}|76(?:464|652)\d{5}|76(?:0[0-28]|2[356]|34|4[01347]|5[49]|6[0-369]|77|8[14]|9[139])\d{6}|56\d{8})$"),
            new("IM", "44", "0", [10], @"^(?:74576|(?:16|7[56])24)"),
            new("JE", "44", "0", [10], @"^(?:1534[0-24-8]\d{5}|7(?:(?:(?:50|82)9|937)\d|7(?:00[378]|97\d))\d{5}|80(?:07(?:35|81)|8901)\d{4}|(?:8(?:4(?:4(?:4(?:05|42|69)|703)|5(?:041|800))|7(?:0002|1206))|90(?:066[59]|1810|71(?:07|55)))\d{4}|701511\d{4}|(?:3(?:0(?:07(?:35|81)|8901)|3\d{4}|4(?:4(?:4(?:05|42|69)|703)|5(?:041|800))|7(?:0002|1206))|55\d{4})\d{4}|76(?:464|652)\d{5}|76(?:0[0-28]|2[356]|34|4[01347]|5[49]|6[0-369]|77|8[14]|9[139])\d{6}|56\d{8})$"),
            new("DK", "45", "", [8], null),
            new("SE", "46", "0", [6, 7, 8, 9, 10, 12], null),
            new("NO", "47", "", [5, 8], @"^(?:[02-689]|7[0-8])"),
            new("SJ", "47", "", [5, 8], @"^(?:79)"),
            new("PL", "48", "", [6, 7, 8, 9, 10], null),
            new("DE", "49", "0", [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], null),
            new("PE", "51", "0", [8, 9], null),
            new("MX", "52", "", [10], null),
            new("CU", "53", "0", [6, 7, 8, 10], null),
            new("AR", "54", "0", [10, 11], null),
            new("BR", "55", "0", [8, 9, 10, 11], null),
            new("CL", "56", "", [9, 10, 11], null),
            new("CO", "57", "0", [8, 10, 11], null),
            new("VE", "58", "0", [10], null),
            new("MY", "60", "0", [8, 9, 10], null),
            new("AU", "61", "0", [5, 6, 7, 8, 9, 10, 12], @"^(?:(?:(?:2(?:(?:[0-26-9]\d|3[0-8]|5[0135-9])\d|4(?:[02-9]\d|10))|3(?:(?:[0-3589]\d|6[1-9]|7[0-35-9])\d|4(?:[0-578]\d|90))|7(?:[013-57-9]\d|2[0-8])\d)\d\d|8(?:51(?:0(?:0[03-9]|[12479]\d|3[2-9]|5[0-8]|6[1-9]|8[0-7])|1(?:[0235689]\d|1[0-69]|4[0-589]|7[0-47-9])|2(?:0[0-79]|[18][13579]|2[14-9]|3[0-46-9]|[4-6]\d|7[89]|9[0-4])|[34]\d\d)|(?:6[0-8]|[78]\d)\d{3}|9(?:[02-9]\d{3}|1(?:(?:[0-58]\d|6[0135-9])\d|7(?:0[0-24-9]|[1-9]\d)|9(?:[0-46-9]\d|5[0-79])))))\d{3}|4(?:79[01]|83[0-389]|94[0-478])\d{5}|4(?:[0-36]\d|4[047-9]|5[0-25-9]|7[02-8]|8[0-24-9]|9[0-37-9])\d{6}|180(?:0\d{3}|2)\d{3}|190[0-26]\d{6}|163\d{2,6}|14(?:5(?:1[0458]|[23][458])|71\d)\d{4}|13(?:00\d{6}(?:\d{2})?|45[0-4]\d{3})|13\d{4})$"),
            new("CC", "61", "0", [6, 7, 8, 9, 10, 12], @"^(?:8(?:51(?:0(?:02|31|60|89)|1(?:18|76)|223)|91(?:0(?:1[0-2]|29)|1(?:[28]2|50|79)|2(?:10|64)|3(?:[06]8|22)|4[29]8|62\d|70[23]|959))\d{3}|4(?:79[01]|83[0-389]|94[0-478])\d{5}|4(?:[0-36]\d|4[047-9]|5[0-25-9]|7[02-8]|8[0-24-9]|9[0-37-9])\d{6}|180(?:0\d{3}|2)\d{3}|190[0-26]\d{6}|14(?:5(?:1[0458]|[23][458])|71\d)\d{4}|13(?:00\d{6}(?:\d{2})?|45[0-4]\d{3})|13\d{4})$"),
            new("CX", "61", "0", [6, 7, 8, 9, 10, 12], @"^(?:8(?:51(?:0(?:01|30|59|88)|1(?:17|46|75)|2(?:22|35))|91(?:00[6-9]|1(?:[28]1|49|78)|2(?:09|63)|3(?:12|26|75)|4(?:56|97)|64\d|7(?:0[01]|1[0-2])|958))\d{3}|4(?:79[01]|83[0-389]|94[0-478])\d{5}|4(?:[0-36]\d|4[047-9]|5[0-25-9]|7[02-8]|8[0-24-9]|9[0-37-9])\d{6}|180(?:0\d{3}|2)\d{3}|190[0-26]\d{6}|14(?:5(?:1[0458]|[23][458])|71\d)\d{4}|13(?:00\d{6}(?:\d{2})?|45[0-4]\d{3})|13\d{4})$"),
            new("ID", "62", "0", [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], null),
            new("PH", "63", "0", [6, 8, 9, 10, 11, 12, 13], null),
            new("NZ", "64", "0", [5, 6, 7, 8, 9, 10], null),
            new("SG", "65", "", [8, 10, 11], null),
            new("TH", "66", "0", [8, 9, 10, 13], null),
            new("JP", "81", "0", [8, 9, 10, 11, 12, 13, 14, 15, 16, 17], null),
            new("KR", "82", "0", [5, 6, 8, 9, 10, 11, 12, 13, 14], null),
            new("VN", "84", "0", [7, 8, 9, 10], null),
            new("CN", "86", "0", [7, 8, 9, 10, 11, 12], null),
            new("TR", "90", "0", [7, 10, 12, 13], null),
            new("IN", "91", "0", [8, 9, 10, 11, 12, 13], null),
            new("PK", "92", "0", [8, 9, 10, 11, 12], null),
            new("AF", "93", "0", [9], null),
            new("LK", "94", "0", [9], null),
            new("MM", "95", "0", [6, 7, 8, 9, 10], null),
            new("IR", "98", "0", [4, 5, 6, 7, 10], null),
            new("SS", "211", "0", [9], null),
            new("MA", "212", "0", [9], @"^(?:5(?:2(?:[0-25-79]\d|3[1-578]|4[02-46-8]|8[0235-7])|3(?:[0-47]\d|5[02-9]|6[02-8]|8[014-9]|9[3-9])|(?:4[067]|5[03])\d)\d{5}|(?:6(?:[0-79]\d|8[0-247-9])|7(?:[0167]\d|2[0-8]|5[0-3]|8[0-7]))\d{6}|80[0-7]\d{6}|89\d{7}|(?:592(?:4[0-2]|93)|80[89]\d\d)\d{4})$"),
            new("EH", "212", "0", [9], @"^(?:528[89])"),
            new("DZ", "213", "0", [8, 9], null),
            new("TN", "216", "", [8], null),
            new("LY", "218", "0", [9], null),
            new("GM", "220", "", [7], null),
            new("SN", "221", "", [9], null),
            new("MR", "222", "", [8], null),
            new("ML", "223", "", [8], null),
            new("GN", "224", "", [8, 9], null),
            new("CI", "225", "", [10], null),
            new("BF", "226", "", [8], null),
            new("NE", "227", "", [8], null),
            new("TG", "228", "", [8], null),
            new("BJ", "229", "", [8, 10], null),
            new("MU", "230", "", [7, 8, 10], null),
            new("LR", "231", "0", [7, 8, 9], null),
            new("SL", "232", "0", [8], null),
            new("GH", "233", "0", [8, 9], null),
            new("NG", "234", "0", [10, 11, 12, 13, 14], null),
            new("TD", "235", "", [8], null),
            new("CF", "236", "", [8], null),
            new("CM", "237", "", [8, 9], null),
            new("CV", "238", "", [7], null),
            new("ST", "239", "", [7], null),
            new("GQ", "240", "", [9], null),
            new("GA", "241", "", [7, 8], null),
            new("CG", "242", "", [9], null),
            new("CD", "243", "0", [7, 8, 9, 10], null),
            new("AO", "244", "", [9], null),
            new("GW", "245", "", [7, 9], null),
            new("IO", "246", "", [7], null),
            new("SC", "248", "", [7], null),
            new("SD", "249", "0", [9], null),
            new("RW", "250", "0", [8, 9], null),
            new("ET", "251", "0", [9], null),
            new("SO", "252", "0", [6, 7, 8, 9], null),
            new("DJ", "253", "", [8], null),
            new("KE", "254", "0", [7, 8, 9, 10], null),
            new("TZ", "255", "0", [9], null),
            new("UG", "256", "0", [9], null),
            new("BI", "257", "", [8], null),
            new("MZ", "258", "", [8, 9], null),
            new("ZM", "260", "0", [9], null),
            new("MG", "261", "0", [9], null),
            new("RE", "262", "0", [9], @"^(?:26(?:2\d\d|3(?:0\d|1[0-6]))\d{4}|(?:69(?:2\d\d|3(?:[06][0-6]|1[0-3]|2[0-2]|3[0-39]|4\d|5[0-5]|7[0-37]|8[0-8]|9[0-479]))|7092[0-3])\d{4}|80\d{7}|89[1-37-9]\d{6}|9(?:399[0-3]|479[0-6]|76(?:2[278]|3[0-37]))\d{4}|8(?:1[019]|2[0156]|84|90)\d{6})$"),
            new("YT", "262", "0", [9], @"^(?:269(?:0[0-467]|15|5[0-4]|6\d|[78]0)\d{4}|(?:639(?:0[0-79]|1[019]|[267]\d|3[09]|40|5[05-9]|9[04-79])|7093[5-7])\d{4}|80\d{7}|9(?:(?:39|47)8[01]|769\d)\d{4})$"),
            new("ZW", "263", "0", [5, 6, 7, 8, 9, 10], null),
            new("NA", "264", "0", [8, 9], null),
            new("MW", "265", "0", [7, 9], null),
            new("LS", "266", "", [8], null),
            new("BW", "267", "", [7, 8, 10], null),
            new("SZ", "268", "", [8, 9], null),
            new("KM", "269", "", [7], null),
            new("SH", "290", "", [4, 5], @"^(?:[256])"),
            new("ER", "291", "0", [7], null),
            new("AW", "297", "", [7], null),
            new("FO", "298", "", [6], null),
            new("GL", "299", "", [6], null),
            new("GI", "350", "", [8], null),
            new("PT", "351", "", [9], null),
            new("LU", "352", "", [4, 5, 6, 7, 8, 9, 10, 11], null),
            new("IE", "353", "0", [7, 8, 9, 10], null),
            new("IS", "354", "", [7, 9], null),
            new("AL", "355", "0", [6, 7, 8, 9], null),
            new("MT", "356", "", [8], null),
            new("CY", "357", "", [8], null),
            new("FI", "358", "0", [5, 6, 7, 8, 9, 10, 11, 12], @"^(?:1[03-79]|[2-9])"),
            new("AX", "358", "0", [5, 6, 7, 8, 9, 10, 11, 12], @"^(?:18)"),
            new("BG", "359", "0", [6, 7, 8, 9, 12], null),
            new("LT", "370", "0", [8], null),
            new("LV", "371", "", [8], null),
            new("EE", "372", "", [7, 8, 10], null),
            new("MD", "373", "0", [8], null),
            new("AM", "374", "0", [8], null),
            new("BY", "375", "8", [6, 7, 8, 9, 10, 11], null),
            new("AD", "376", "", [6, 8, 9], null),
            new("MC", "377", "0", [8, 9], null),
            new("SM", "378", "", [8, 10], null),
            new("UA", "380", "0", [9, 10], null),
            new("RS", "381", "0", [6, 7, 8, 9, 10, 11, 12], null),
            new("ME", "382", "0", [8, 9], null),
            new("HR", "385", "0", [7, 8, 9], null),
            new("SI", "386", "0", [5, 6, 7, 8], null),
            new("BA", "387", "0", [8, 9], null),
            new("MK", "389", "0", [8], null),
            new("CZ", "420", "", [9, 10, 11, 12], null),
            new("SK", "421", "0", [6, 7, 9], null),
            new("LI", "423", "0", [7, 9], null),
            new("FK", "500", "", [5], null),
            new("BZ", "501", "", [7, 11], null),
            new("GT", "502", "", [8, 11], null),
            new("SV", "503", "", [7, 8, 11], null),
            new("HN", "504", "", [8, 11], null),
            new("NI", "505", "", [8], null),
            new("CR", "506", "", [8, 10], null),
            new("PA", "507", "", [7, 8, 10, 11], null),
            new("PM", "508", "0", [6, 9], null),
            new("HT", "509", "", [8], null),
            new("GP", "590", "0", [9], @"^(?:590(?:0[1-68]|[14][0-24-9]|2[0-68]|3[1-9]|5[3-579]|[68][0-689]|7[08]|9\d)\d{4}|(?:69(?:0\d\d|1(?:2[2-9]|3[0-5])|4(?:0[89]|1[2-6]|9\d)|6(?:1[016-9]|5[0-4]|[67]\d))|7090[0-4])\d{4}|80[0-5]\d{6}|9(?:(?:39[5-7]|76[018])\d|475[0-6])\d{4})$"),
            new("BL", "590", "0", [9], @"^(?:590(?:2[7-9]|3[3-7]|5[12]|87)\d{4}|(?:69(?:0\d\d|1(?:2[2-9]|3[0-5])|4(?:0[89]|1[2-6]|9\d)|6(?:1[016-9]|5[0-4]|[67]\d))|7090[0-4])\d{4}|80[0-5]\d{6}|9(?:(?:39[5-7]|76[018])\d|475[0-6])\d{4})$"),
            new("MF", "590", "0", [9], @"^(?:590(?:0[079]|[14]3|[27][79]|3[03-7]|5[0-268]|87)\d{4}|(?:69(?:0\d\d|1(?:2[2-9]|3[0-5])|4(?:0[89]|1[2-6]|9\d)|6(?:1[016-9]|5[0-4]|[67]\d))|7090[0-4])\d{4}|80[0-5]\d{6}|9(?:(?:39[5-7]|76[018])\d|475[0-6])\d{4})$"),
            new("BO", "591", "0", [8, 9], null),
            new("GY", "592", "", [7], null),
            new("EC", "593", "0", [8, 9, 10, 11], null),
            new("GF", "594", "0", [9], null),
            new("PY", "595", "0", [6, 7, 8, 9, 10, 11], null),
            new("MQ", "596", "0", [9], null),
            new("SR", "597", "", [6, 7], null),
            new("UY", "598", "0", [6, 7, 8, 9, 10, 11, 12, 13], null),
            new("CW", "599", "", [7, 8], @"^(?:[69])"),
            new("BQ", "599", "", [7], @"^(?:[347])"),
            new("TL", "670", "", [7, 8], null),
            new("NF", "672", "", [6], null),
            new("BN", "673", "", [7], null),
            new("NR", "674", "", [7], null),
            new("PG", "675", "", [7, 8], null),
            new("TO", "676", "", [5, 7], null),
            new("SB", "677", "", [5, 7], null),
            new("VU", "678", "", [5, 7], null),
            new("FJ", "679", "", [7, 11], null),
            new("PW", "680", "", [7], null),
            new("WF", "681", "", [6, 9], null),
            new("CK", "682", "", [5], null),
            new("NU", "683", "", [4, 7], null),
            new("WS", "685", "", [5, 6, 7, 10], null),
            new("KI", "686", "0", [5, 8], null),
            new("NC", "687", "", [6], null),
            new("TV", "688", "", [5, 6, 7], null),
            new("PF", "689", "", [6, 8, 9], null),
            new("TK", "690", "", [4, 5, 6, 7], null),
            new("FM", "691", "", [7], null),
            new("MH", "692", "1", [7], null),
            new("KP", "850", "0", [8, 10], null),
            new("HK", "852", "", [5, 6, 7, 8, 9, 11], null),
            new("MO", "853", "", [7, 8], null),
            new("KH", "855", "0", [8, 9, 10], null),
            new("LA", "856", "0", [8, 9, 10], null),
            new("BD", "880", "0", [6, 7, 8, 9, 10], null),
            new("TW", "886", "0", [7, 8, 9, 10, 11], null),
            new("MV", "960", "", [7, 10], null),
            new("LB", "961", "0", [7, 8], null),
            new("JO", "962", "0", [8, 9], null),
            new("SY", "963", "0", [8, 9], null),
            new("IQ", "964", "0", [8, 9, 10], null),
            new("KW", "965", "", [7, 8], null),
            new("SA", "966", "0", [9, 10], null),
            new("YE", "967", "0", [7, 8, 9], null),
            new("OM", "968", "", [7, 8, 9], null),
            new("PS", "970", "0", [8, 9, 10], null),
            new("AE", "971", "0", [5, 6, 7, 8, 9, 10, 11, 12], null),
            new("IL", "972", "0", [7, 8, 9, 10, 11, 12], null),
            new("BH", "973", "", [8], null),
            new("QA", "974", "", [7, 8, 9, 11], null),
            new("BT", "975", "", [7, 8], null),
            new("MN", "976", "0", [8, 9, 10], null),
            new("NP", "977", "0", [8, 10, 11], null),
            new("TJ", "992", "", [9], null),
            new("TM", "993", "8", [8], null),
            new("AZ", "994", "0", [9], null),
            new("GE", "995", "0", [9], null),
            new("KG", "996", "0", [9, 10], null),
            new("UZ", "998", "", [9], null)
        ];

        private static readonly FrozenDictionary<string, Plan> _byCountry = _plans.ToFrozenDictionary(x => x.Country, StringComparer.Ordinal);

        // the plans keep the order of the metadata, which is the order of detection; the first
        // of a calling code is its main country and takes a number no detection claims
        private static readonly FrozenDictionary<string, Plan[]> _byCallingCode = _plans
            .GroupBy(x => x.CallingCode)
            .ToFrozenDictionary(x => x.Key, x => x.ToArray(), StringComparer.Ordinal);

        /// <summary>
        /// Returns the codes of the countries with a numbering plan, in upper case.
        /// </summary>
        public static IEnumerable<string> Countries => _plans.Select(x => x.Country);

        /// <summary>
        /// Returns the calling code of a country, without the leading plus.
        /// </summary>
        /// <param name="country">The ISO 3166-1 alpha-2 code of the country, in any letter case.</param>
        /// <returns>The calling code, or null for a country without a numbering plan.</returns>
        public static string GetCallingCode(string country)
        {
            var normalized = CountryCatalog.Normalize(country);

            return normalized is not null && _byCountry.TryGetValue(normalized, out var plan)
                ? plan.CallingCode
                : null;
        }

        /// <summary>
        /// Brings a number into the E.164 form. An international number - written with a plus or
        /// with the international prefix 00 - names its own country; a national number is read
        /// in the numbering plan of the given country, without its national prefix. Blanks and
        /// the usual separators are ignored.
        /// </summary>
        /// <param name="value">The number as written.</param>
        /// <param name="country">The country a national number belongs to. Can be null.</param>
        /// <returns>The number in E.164 form, or null if it is no valid number.</returns>
        public static string Normalize(string value, string country = null)
        {
            var digits = Compact(value);
            if (digits is null)
            {
                return null;
            }

            if (digits.StartsWith('+'))
            {
                var resolved = Resolve(digits[1..]);

                return resolved is null ? null : $"+{resolved.Value.Plan.CallingCode}{resolved.Value.National}";
            }

            var normalized = CountryCatalog.Normalize(country);
            if (normalized is null || !_byCountry.TryGetValue(normalized, out var plan))
            {
                return null;
            }

            // a number dialled within the country starts with its national prefix, which the
            // international form leaves out
            var national = plan.NationalPrefix.Length > 0 && digits.StartsWith(plan.NationalPrefix, StringComparison.Ordinal)
                && plan.Lengths.Contains(digits.Length - plan.NationalPrefix.Length)
                ? digits[plan.NationalPrefix.Length..]
                : digits;

            return plan.Lengths.Contains(national.Length) ? $"+{plan.CallingCode}{national}" : null;
        }

        /// <summary>
        /// Determines whether a number is valid, either international or national in the given country.
        /// </summary>
        /// <param name="value">The number as written.</param>
        /// <param name="country">The country a national number belongs to. Can be null.</param>
        /// <returns>True if the number can be brought into the E.164 form.</returns>
        public static bool IsValid(string value, string country = null)
        {
            return Normalize(value, country) is not null;
        }

        /// <summary>
        /// Returns the country an international number belongs to.
        /// </summary>
        /// <param name="value">The number, international.</param>
        /// <returns>The upper-case code of the country, or null for no valid international number.</returns>
        public static string GetCountry(string value)
        {
            var digits = Compact(value);

            return digits is not null && digits.StartsWith('+')
                ? Resolve(digits[1..])?.Plan.Country
                : null;
        }

        /// <summary>
        /// Determines whether an international number may belong to a country. That is more than
        /// <see cref="GetCountry"/> answers, which names one country only: an australian mobile
        /// number is detected as Australia, but belongs to the Cocos Islands as well.
        /// </summary>
        /// <param name="value">The number, international.</param>
        /// <param name="country">The country, in any letter case.</param>
        /// <returns>True if the number fits the numbering plan of the country.</returns>
        public static bool Fits(string value, string country)
        {
            var digits = Compact(value);
            var normalized = CountryCatalog.Normalize(country);
            if (digits is null || !digits.StartsWith('+') || normalized is null
                || !_byCountry.TryGetValue(normalized, out var plan)
                || !digits[1..].StartsWith(plan.CallingCode, StringComparison.Ordinal))
            {
                return false;
            }

            var national = digits[(1 + plan.CallingCode.Length)..];
            var plans = _byCallingCode[plan.CallingCode];

            // the main country takes what no detection claims, so its lengths are its rule
            return plan.Lengths.Contains(national.Length)
                && (plans[0] == plan || plan.Detection?.IsMatch(national) == true);
        }

        /// <summary>
        /// Writes an international number with its calling code set apart, as +49 30123456. The
        /// grouping of the national number differs from country to country and is left as it is.
        /// </summary>
        /// <param name="value">The number, international.</param>
        /// <returns>The readable form, or null for no valid international number.</returns>
        public static string Format(string value)
        {
            var digits = Compact(value);
            var resolved = digits is not null && digits.StartsWith('+') ? Resolve(digits[1..]) : null;

            return resolved is null ? null : $"+{resolved.Value.Plan.CallingCode} {resolved.Value.National}";
        }

        /// <summary>
        /// Removes blanks and separators and turns the international prefix 00 into a plus.
        /// </summary>
        /// <param name="value">The number as written.</param>
        /// <returns>The digits, led by a plus for an international number, or null if other characters remain.</returns>
        private static string Compact(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            var builder = new StringBuilder();
            foreach (var c in value.Trim())
            {
                if (char.IsAsciiDigit(c) || (c == '+' && builder.Length == 0))
                {
                    builder.Append(c);
                }
                else if (!" -./()".Contains(c) && !char.IsWhiteSpace(c))
                {
                    return null;
                }
            }

            var digits = builder.ToString();
            if (digits.StartsWith("00", StringComparison.Ordinal))
            {
                digits = "+" + digits[2..];
            }

            return digits.Length > 1 ? digits : null;
        }

        /// <summary>
        /// Splits the digits of an international number into its numbering plan and its
        /// national number, and checks the length of the latter.
        /// </summary>
        /// <param name="digits">The digits after the plus.</param>
        /// <returns>The plan and the national number, or null if the number fits no plan.</returns>
        private static (Plan Plan, string National)? Resolve(string digits)
        {
            // calling codes are prefix-free, so at most one of the three lengths names a plan
            for (var length = 1; length <= 3 && length < digits.Length; length++)
            {
                if (!_byCallingCode.TryGetValue(digits[..length], out var plans))
                {
                    continue;
                }

                var national = digits[length..];
                // patterns overlap - the cocos islands dial australian mobile numbers - so the
                // first plan claiming the number wins
                var plan = plans.FirstOrDefault(x => x.Detection?.IsMatch(national) == true) ?? plans[0];

                return plan.Lengths.Contains(national.Length) ? (plan, national) : null;
            }

            return null;
        }
    }
}
