/**
 * The telephone numbering plans of the countries with a flag: calling code, national prefix,
 * the lengths a national number may have and, for a country sharing its calling code, how its
 * numbers are told apart, the main country first. The server keeps the same table in
 * PhoneCatalog.cs; a test holds the two equal.
 */
webexpress.webui.PhoneCatalog = class {
    // [country, calling code, national prefix, possible lengths, detection or null]
    static PLANS = [
        ["US","1","1",[10],"^(?:(?:3052(?:0[0-8]|[1-9]\\d)|5056(?:[0-35-9]\\d|4[0-68]))\\d{4}|(?:2742|305[3-9]|472[247-9]|505[2-57-9]|983[2-47-9])\\d{6}|(?:2(?:0[1-35-9]|1[02-9]|2[03-57-9]|3[1459]|4[08]|5[1-46]|6[0279]|7[0269]|8[13])|3(?:0[1-47-9]|1[02-9]|2[0135-79]|3[0-24679]|4[167]|5[0-2]|6[01349]|8[056])|4(?:0[124-9]|1[02-579]|2[3-5]|3[0245]|4[023578]|58|6[349]|7[0589]|8[04])|5(?:0[1-47-9]|1[0235-8]|20|3[0149]|4[01]|5[179]|6[1-47]|7[0-5]|8[0256])|6(?:0[1-35-9]|1[024-9]|2[03689]|3[016]|4[0156]|5[01679]|6[0-279]|78|8[0-29])|7(?:0[1-46-8]|1[2-9]|2[04-8]|3[0-247]|4[0378]|5[47]|6[02359]|7[0-59]|8[156])|8(?:0[1-68]|1[02-8]|2[0168]|3[0-2589]|4[03578]|5[046-9]|6[02-5]|7[028])|9(?:0[1346-9]|1[02-9]|2[0589]|3[0146-8]|4[01357-9]|5[12469]|7[0-3589]|8[04-69]))[2-9]\\d{6}|8(?:00|33|44|55|66|77|88)[2-9]\\d{6}|900[2-9]\\d{6}|52(?:3(?:[2-46-9][02-9]\\d|5(?:[02-46-9]\\d|5[0-46-9]))|4(?:[2-478][02-9]\\d|5(?:[034]\\d|2[024-9]|5[0-46-9])|6(?:0[1-9]|[2-9]\\d)|9(?:[05-9]\\d|2[0-5]|49)))\\d{4}|52[34][2-9]1[02-9]\\d{4}|5(?:00|2[125-9]|33|44|66|77|88)[2-9]\\d{6}|305209\\d{4})$"],
        ["AG","1","1",[10],"^(?:268)"],
        ["AI","1","1",[10],"^(?:264)"],
        ["AS","1","1",[10],"^(?:684)"],
        ["BB","1","1",[10],"^(?:246)"],
        ["BM","1","1",[10],"^(?:441)"],
        ["BS","1","1",[10],"^(?:242)"],
        ["CA","1","1",[7,10],"^(?:(?:2(?:04|[23]6|[48]9|5[07]|63)|3(?:06|43|54|6[578]|82)|4(?:03|1[68]|[26]8|3[178]|50|74)|5(?:06|1[49]|48|79|8[147])|6(?:04|[18]3|39|47|72)|7(?:0[59]|42|53|78|8[02])|8(?:[06]7|19|25|7[39])|9(?:0[25]|42))[2-9]\\d{6}|8(?:00|33|44|55|66|77|88)[2-9]\\d{6}|900[2-9]\\d{6}|52(?:3(?:[2-46-9][02-9]\\d|5(?:[02-46-9]\\d|5[0-46-9]))|4(?:[2-478][02-9]\\d|5(?:[034]\\d|2[024-9]|5[0-46-9])|6(?:0[1-9]|[2-9]\\d)|9(?:[05-9]\\d|2[0-5]|49)))\\d{4}|52[34][2-9]1[02-9]\\d{4}|(?:5(?:2[125-9]|33|44|66|77|88)|6(?:22|33))[2-9]\\d{6}|310\\d{4}|600[2-9]\\d{6})$"],
        ["DM","1","1",[10],"^(?:767)"],
        ["DO","1","1",[10],"^(?:8001|8[024]9)"],
        ["GD","1","1",[10],"^(?:473)"],
        ["GU","1","1",[10],"^(?:671)"],
        ["JM","1","1",[10],"^(?:658|876)"],
        ["KN","1","1",[10],"^(?:869)"],
        ["KY","1","1",[10],"^(?:345)"],
        ["LC","1","1",[10],"^(?:758)"],
        ["MP","1","1",[10],"^(?:670)"],
        ["MS","1","1",[10],"^(?:664)"],
        ["PR","1","1",[10],"^(?:787|939)"],
        ["SX","1","1",[10],"^(?:721)"],
        ["TC","1","1",[10],"^(?:649)"],
        ["TT","1","1",[10],"^(?:868)"],
        ["VC","1","1",[10],"^(?:784)"],
        ["VG","1","1",[10],"^(?:284)"],
        ["VI","1","1",[10],"^(?:340)"],
        ["RU","7","8",[10,14],"^(?:336(?:[013-9]\\d|2[013-9])\\d{5}|(?:3(?:0[12]|4[1-35-79]|5[1-3]|65|8[1-58]|9[0145])|4(?:01|1[1356]|2[13467]|7[1-5]|8[1-7]|9[1-689])|8(?:1[1-8]|2[01]|3[13-6]|4[0-8]|5[15-7]|6[0-35-79]|7[1-37-9]))\\d{7}|9\\d{9}|8(?:0[04]|108\\d{3})\\d{7}|80[39]\\d{7}|808\\d{7})$"],
        ["KZ","7","8",[10,14],"^(?:33622|7)"],
        ["EG","20","0",[8,9,10],null],
        ["ZA","27","0",[5,6,7,8,9,10],null],
        ["GR","30","",[10,11,12],null],
        ["NL","31","0",[5,6,7,8,9,10,11],null],
        ["BE","32","0",[8,9],null],
        ["FR","33","0",[9],null],
        ["ES","34","",[9],null],
        ["HU","36","06",[8,9],null],
        ["IT","39","",[6,7,8,9,10,11,12],"^(?:0669[0-79]\\d{1,6}|0(?:1(?:[0159]\\d|[27][1-5]|31|4[1-4]|6[1356]|8[2-57])|2\\d\\d|3(?:[0159]\\d|2[1-4]|3[12]|[48][1-6]|6[2-59]|7[1-7])|4(?:[0159]\\d|[23][1-9]|4[245]|6[1-5]|7[1-4]|81)|5(?:[0159]\\d|2[1-5]|3[2-6]|4[1-79]|6[4-6]|7[1-578]|8[3-8])|6(?:[0-57-9]\\d|6[0-8])|7(?:[0159]\\d|2[12]|3[1-7]|4[2-46]|6[13569]|7[13-6]|8[1-59])|8(?:[0159]\\d|2[3-578]|3[1-356]|[6-8][1-5])|9(?:[0159]\\d|[238][1-5]|4[12]|6[1-8]|7[1-6]))\\d{2,7}|3[2-9]\\d{7,8}|(?:31|43)\\d{8}|80(?:0\\d{3}|3)\\d{3}|(?:0878\\d{3}|89(?:2\\d|3[04]|4(?:[0-4]|[5-9]\\d\\d)|5[0-4]))\\d\\d|(?:1(?:44|6[346])|89(?:38|5[5-9]|9))\\d{6}|1(?:78\\d|99)\\d{6}|3[2-8]\\d{9,10}|55\\d{8}|84(?:[08]\\d{3}|[17])\\d{3})$"],
        ["VA","39","",[6,7,8,9,10,11,12],"^(?:06698)"],
        ["RO","40","0",[6,9],null],
        ["CH","41","0",[9,12],null],
        ["AT","43","0",[4,5,6,7,8,9,10,11,12,13],null],
        ["GB","44","0",[7,9,10],"^(?:(?:1(?:1(?:3(?:[0-58]\\d\\d|73[0-35])|4(?:(?:[0-5]\\d|70)\\d|69[7-9])|(?:(?:5[0-26-9]|[78][0-49])\\d|6(?:[0-4]\\d|50))\\d)|(?:2(?:(?:0[024-9]|2[3-9]|3[3-79]|4[1-689]|[58][02-9]|6[0-47-9]|7[013-9]|9\\d)\\d|1(?:[0-7]\\d|8[0-3]))|(?:3(?:0\\d|1[0-8]|[25][02-9]|3[02-579]|[468][0-46-9]|7[1-35-79]|9[2-578])|4(?:0[03-9]|[137]\\d|[28][02-57-9]|4[02-69]|5[0-8]|[69][0-79])|5(?:0[1-35-9]|[16]\\d|2[024-9]|3[015689]|4[02-9]|5[03-9]|7[0-35-9]|8[0-468]|9[0-57-9])|6(?:0[034689]|1\\d|2[0-35689]|[38][013-9]|4[1-467]|5[0-69]|6[13-9]|7[0-8]|9[0-24578])|7(?:0[0246-9]|2\\d|3[0236-8]|4[03-9]|5[0-46-9]|6[013-9]|7[0-35-9]|8[024-9]|9[02-9])|8(?:0[35-9]|2[1-57-9]|3[02-578]|4[0-578]|5[124-9]|6[2-69]|7\\d|8[02-9]|9[02569])|9(?:0[02-589]|[18]\\d|2[02-689]|3[1-57-9]|4[2-9]|5[0-579]|6[2-47-9]|7[0-24578]|9[2-57]))\\d)\\d)|2(?:0[013478]|3[0189]|4[017]|8[0-46-9]|9[0-2])\\d{3})\\d{4}|1(?:2(?:0(?:46[1-4]|87[2-9])|545[1-79]|76(?:2\\d|3[1-8]|6[1-6])|9(?:7(?:2[0-4]|3[2-5])|8(?:2[2-8]|7[0-47-9]|8[3-5])))|3(?:6(?:38[2-5]|47[23])|8(?:47[04-9]|64[0157-9]))|4(?:044[1-7]|20(?:2[23]|8\\d)|6(?:0(?:30|5[2-57]|6[1-8]|7[2-8])|140)|8(?:052|87[1-3]))|5(?:2(?:4(?:3[2-79]|6\\d)|76\\d)|6(?:26[06-9]|686))|6(?:06(?:4\\d|7[4-79])|295[5-7]|35[34]\\d|47(?:24|61)|59(?:5[08]|6[67]|74)|9(?:55[0-4]|77[23]))|7(?:26(?:6[13-9]|7[0-7])|(?:442|688)\\d|50(?:2[0-3]|[3-68]2|76))|8(?:27[56]\\d|37(?:5[2-5]|8[239])|843[2-58])|9(?:0(?:0(?:6[1-8]|85)|52\\d)|3583|4(?:66[1-8]|9(?:2[01]|81))|63(?:23|3[1-4])|9561))\\d{3}|7(?:457[0-57-9]|700[01]|911[028])\\d{5}|7(?:[1-3]\\d\\d|4(?:[0-46-9]\\d|5[0-689])|5(?:0[0-8]|[13-9]\\d|2[0-35-9])|7(?:0[1-9]|[1-7]\\d|8[02-9]|9[0-689])|8(?:[014-9]\\d|[23][0-8])|9(?:[024-9]\\d|1[02-9]|3[0-689]))\\d{6}|80[08]\\d{7}|800\\d{6}|8001111|(?:8(?:4[2-5]|7[0-3])|9(?:[01]\\d|8[2-49]))\\d{7}|845464\\d|70\\d{8}|(?:3[0347]|55)\\d{8}|76(?:464|652)\\d{5}|76(?:0[0-28]|2[356]|34|4[01347]|5[49]|6[0-369]|77|8[14]|9[139])\\d{6}|56\\d{8})$"],
        ["GG","44","0",[7,9,10],"^(?:1481[25-9]\\d{5}|7(?:(?:781|839)\\d|911[17])\\d{5}|80[08]\\d{7}|800\\d{6}|8001111|(?:8(?:4[2-5]|7[0-3])|9(?:[01]\\d|8[0-3]))\\d{7}|845464\\d|70\\d{8}|(?:3[0347]|55)\\d{8}|76(?:464|652)\\d{5}|76(?:0[0-28]|2[356]|34|4[01347]|5[49]|6[0-369]|77|8[14]|9[139])\\d{6}|56\\d{8})$"],
        ["IM","44","0",[10],"^(?:74576|(?:16|7[56])24)"],
        ["JE","44","0",[10],"^(?:1534[0-24-8]\\d{5}|7(?:(?:(?:50|82)9|937)\\d|7(?:00[378]|97\\d))\\d{5}|80(?:07(?:35|81)|8901)\\d{4}|(?:8(?:4(?:4(?:4(?:05|42|69)|703)|5(?:041|800))|7(?:0002|1206))|90(?:066[59]|1810|71(?:07|55)))\\d{4}|701511\\d{4}|(?:3(?:0(?:07(?:35|81)|8901)|3\\d{4}|4(?:4(?:4(?:05|42|69)|703)|5(?:041|800))|7(?:0002|1206))|55\\d{4})\\d{4}|76(?:464|652)\\d{5}|76(?:0[0-28]|2[356]|34|4[01347]|5[49]|6[0-369]|77|8[14]|9[139])\\d{6}|56\\d{8})$"],
        ["DK","45","",[8],null],
        ["SE","46","0",[6,7,8,9,10,12],null],
        ["NO","47","",[5,8],"^(?:[02-689]|7[0-8])"],
        ["SJ","47","",[5,8],"^(?:79)"],
        ["PL","48","",[6,7,8,9,10],null],
        ["DE","49","0",[4,5,6,7,8,9,10,11,12,13,14,15],null],
        ["PE","51","0",[8,9],null],
        ["MX","52","",[10],null],
        ["CU","53","0",[6,7,8,10],null],
        ["AR","54","0",[10,11],null],
        ["BR","55","0",[8,9,10,11],null],
        ["CL","56","",[9,10,11],null],
        ["CO","57","0",[8,10,11],null],
        ["VE","58","0",[10],null],
        ["MY","60","0",[8,9,10],null],
        ["AU","61","0",[5,6,7,8,9,10,12],"^(?:(?:(?:2(?:(?:[0-26-9]\\d|3[0-8]|5[0135-9])\\d|4(?:[02-9]\\d|10))|3(?:(?:[0-3589]\\d|6[1-9]|7[0-35-9])\\d|4(?:[0-578]\\d|90))|7(?:[013-57-9]\\d|2[0-8])\\d)\\d\\d|8(?:51(?:0(?:0[03-9]|[12479]\\d|3[2-9]|5[0-8]|6[1-9]|8[0-7])|1(?:[0235689]\\d|1[0-69]|4[0-589]|7[0-47-9])|2(?:0[0-79]|[18][13579]|2[14-9]|3[0-46-9]|[4-6]\\d|7[89]|9[0-4])|[34]\\d\\d)|(?:6[0-8]|[78]\\d)\\d{3}|9(?:[02-9]\\d{3}|1(?:(?:[0-58]\\d|6[0135-9])\\d|7(?:0[0-24-9]|[1-9]\\d)|9(?:[0-46-9]\\d|5[0-79])))))\\d{3}|4(?:79[01]|83[0-389]|94[0-478])\\d{5}|4(?:[0-36]\\d|4[047-9]|5[0-25-9]|7[02-8]|8[0-24-9]|9[0-37-9])\\d{6}|180(?:0\\d{3}|2)\\d{3}|190[0-26]\\d{6}|163\\d{2,6}|14(?:5(?:1[0458]|[23][458])|71\\d)\\d{4}|13(?:00\\d{6}(?:\\d{2})?|45[0-4]\\d{3})|13\\d{4})$"],
        ["CC","61","0",[6,7,8,9,10,12],"^(?:8(?:51(?:0(?:02|31|60|89)|1(?:18|76)|223)|91(?:0(?:1[0-2]|29)|1(?:[28]2|50|79)|2(?:10|64)|3(?:[06]8|22)|4[29]8|62\\d|70[23]|959))\\d{3}|4(?:79[01]|83[0-389]|94[0-478])\\d{5}|4(?:[0-36]\\d|4[047-9]|5[0-25-9]|7[02-8]|8[0-24-9]|9[0-37-9])\\d{6}|180(?:0\\d{3}|2)\\d{3}|190[0-26]\\d{6}|14(?:5(?:1[0458]|[23][458])|71\\d)\\d{4}|13(?:00\\d{6}(?:\\d{2})?|45[0-4]\\d{3})|13\\d{4})$"],
        ["CX","61","0",[6,7,8,9,10,12],"^(?:8(?:51(?:0(?:01|30|59|88)|1(?:17|46|75)|2(?:22|35))|91(?:00[6-9]|1(?:[28]1|49|78)|2(?:09|63)|3(?:12|26|75)|4(?:56|97)|64\\d|7(?:0[01]|1[0-2])|958))\\d{3}|4(?:79[01]|83[0-389]|94[0-478])\\d{5}|4(?:[0-36]\\d|4[047-9]|5[0-25-9]|7[02-8]|8[0-24-9]|9[0-37-9])\\d{6}|180(?:0\\d{3}|2)\\d{3}|190[0-26]\\d{6}|14(?:5(?:1[0458]|[23][458])|71\\d)\\d{4}|13(?:00\\d{6}(?:\\d{2})?|45[0-4]\\d{3})|13\\d{4})$"],
        ["ID","62","0",[7,8,9,10,11,12,13,14,15,16,17],null],
        ["PH","63","0",[6,8,9,10,11,12,13],null],
        ["NZ","64","0",[5,6,7,8,9,10],null],
        ["SG","65","",[8,10,11],null],
        ["TH","66","0",[8,9,10,13],null],
        ["JP","81","0",[8,9,10,11,12,13,14,15,16,17],null],
        ["KR","82","0",[5,6,8,9,10,11,12,13,14],null],
        ["VN","84","0",[7,8,9,10],null],
        ["CN","86","0",[7,8,9,10,11,12],null],
        ["TR","90","0",[7,10,12,13],null],
        ["IN","91","0",[8,9,10,11,12,13],null],
        ["PK","92","0",[8,9,10,11,12],null],
        ["AF","93","0",[9],null],
        ["LK","94","0",[9],null],
        ["MM","95","0",[6,7,8,9,10],null],
        ["IR","98","0",[4,5,6,7,10],null],
        ["SS","211","0",[9],null],
        ["MA","212","0",[9],"^(?:5(?:2(?:[0-25-79]\\d|3[1-578]|4[02-46-8]|8[0235-7])|3(?:[0-47]\\d|5[02-9]|6[02-8]|8[014-9]|9[3-9])|(?:4[067]|5[03])\\d)\\d{5}|(?:6(?:[0-79]\\d|8[0-247-9])|7(?:[0167]\\d|2[0-8]|5[0-3]|8[0-7]))\\d{6}|80[0-7]\\d{6}|89\\d{7}|(?:592(?:4[0-2]|93)|80[89]\\d\\d)\\d{4})$"],
        ["EH","212","0",[9],"^(?:528[89])"],
        ["DZ","213","0",[8,9],null],
        ["TN","216","",[8],null],
        ["LY","218","0",[9],null],
        ["GM","220","",[7],null],
        ["SN","221","",[9],null],
        ["MR","222","",[8],null],
        ["ML","223","",[8],null],
        ["GN","224","",[8,9],null],
        ["CI","225","",[10],null],
        ["BF","226","",[8],null],
        ["NE","227","",[8],null],
        ["TG","228","",[8],null],
        ["BJ","229","",[8,10],null],
        ["MU","230","",[7,8,10],null],
        ["LR","231","0",[7,8,9],null],
        ["SL","232","0",[8],null],
        ["GH","233","0",[8,9],null],
        ["NG","234","0",[10,11,12,13,14],null],
        ["TD","235","",[8],null],
        ["CF","236","",[8],null],
        ["CM","237","",[8,9],null],
        ["CV","238","",[7],null],
        ["ST","239","",[7],null],
        ["GQ","240","",[9],null],
        ["GA","241","",[7,8],null],
        ["CG","242","",[9],null],
        ["CD","243","0",[7,8,9,10],null],
        ["AO","244","",[9],null],
        ["GW","245","",[7,9],null],
        ["IO","246","",[7],null],
        ["SC","248","",[7],null],
        ["SD","249","0",[9],null],
        ["RW","250","0",[8,9],null],
        ["ET","251","0",[9],null],
        ["SO","252","0",[6,7,8,9],null],
        ["DJ","253","",[8],null],
        ["KE","254","0",[7,8,9,10],null],
        ["TZ","255","0",[9],null],
        ["UG","256","0",[9],null],
        ["BI","257","",[8],null],
        ["MZ","258","",[8,9],null],
        ["ZM","260","0",[9],null],
        ["MG","261","0",[9],null],
        ["RE","262","0",[9],"^(?:26(?:2\\d\\d|3(?:0\\d|1[0-6]))\\d{4}|(?:69(?:2\\d\\d|3(?:[06][0-6]|1[0-3]|2[0-2]|3[0-39]|4\\d|5[0-5]|7[0-37]|8[0-8]|9[0-479]))|7092[0-3])\\d{4}|80\\d{7}|89[1-37-9]\\d{6}|9(?:399[0-3]|479[0-6]|76(?:2[278]|3[0-37]))\\d{4}|8(?:1[019]|2[0156]|84|90)\\d{6})$"],
        ["YT","262","0",[9],"^(?:269(?:0[0-467]|15|5[0-4]|6\\d|[78]0)\\d{4}|(?:639(?:0[0-79]|1[019]|[267]\\d|3[09]|40|5[05-9]|9[04-79])|7093[5-7])\\d{4}|80\\d{7}|9(?:(?:39|47)8[01]|769\\d)\\d{4})$"],
        ["ZW","263","0",[5,6,7,8,9,10],null],
        ["NA","264","0",[8,9],null],
        ["MW","265","0",[7,9],null],
        ["LS","266","",[8],null],
        ["BW","267","",[7,8,10],null],
        ["SZ","268","",[8,9],null],
        ["KM","269","",[7],null],
        ["SH","290","",[4,5],"^(?:[256])"],
        ["ER","291","0",[7],null],
        ["AW","297","",[7],null],
        ["FO","298","",[6],null],
        ["GL","299","",[6],null],
        ["GI","350","",[8],null],
        ["PT","351","",[9],null],
        ["LU","352","",[4,5,6,7,8,9,10,11],null],
        ["IE","353","0",[7,8,9,10],null],
        ["IS","354","",[7,9],null],
        ["AL","355","0",[6,7,8,9],null],
        ["MT","356","",[8],null],
        ["CY","357","",[8],null],
        ["FI","358","0",[5,6,7,8,9,10,11,12],"^(?:1[03-79]|[2-9])"],
        ["AX","358","0",[5,6,7,8,9,10,11,12],"^(?:18)"],
        ["BG","359","0",[6,7,8,9,12],null],
        ["LT","370","0",[8],null],
        ["LV","371","",[8],null],
        ["EE","372","",[7,8,10],null],
        ["MD","373","0",[8],null],
        ["AM","374","0",[8],null],
        ["BY","375","8",[6,7,8,9,10,11],null],
        ["AD","376","",[6,8,9],null],
        ["MC","377","0",[8,9],null],
        ["SM","378","",[8,10],null],
        ["UA","380","0",[9,10],null],
        ["RS","381","0",[6,7,8,9,10,11,12],null],
        ["ME","382","0",[8,9],null],
        ["HR","385","0",[7,8,9],null],
        ["SI","386","0",[5,6,7,8],null],
        ["BA","387","0",[8,9],null],
        ["MK","389","0",[8],null],
        ["CZ","420","",[9,10,11,12],null],
        ["SK","421","0",[6,7,9],null],
        ["LI","423","0",[7,9],null],
        ["FK","500","",[5],null],
        ["BZ","501","",[7,11],null],
        ["GT","502","",[8,11],null],
        ["SV","503","",[7,8,11],null],
        ["HN","504","",[8,11],null],
        ["NI","505","",[8],null],
        ["CR","506","",[8,10],null],
        ["PA","507","",[7,8,10,11],null],
        ["PM","508","0",[6,9],null],
        ["HT","509","",[8],null],
        ["GP","590","0",[9],"^(?:590(?:0[1-68]|[14][0-24-9]|2[0-68]|3[1-9]|5[3-579]|[68][0-689]|7[08]|9\\d)\\d{4}|(?:69(?:0\\d\\d|1(?:2[2-9]|3[0-5])|4(?:0[89]|1[2-6]|9\\d)|6(?:1[016-9]|5[0-4]|[67]\\d))|7090[0-4])\\d{4}|80[0-5]\\d{6}|9(?:(?:39[5-7]|76[018])\\d|475[0-6])\\d{4})$"],
        ["BL","590","0",[9],"^(?:590(?:2[7-9]|3[3-7]|5[12]|87)\\d{4}|(?:69(?:0\\d\\d|1(?:2[2-9]|3[0-5])|4(?:0[89]|1[2-6]|9\\d)|6(?:1[016-9]|5[0-4]|[67]\\d))|7090[0-4])\\d{4}|80[0-5]\\d{6}|9(?:(?:39[5-7]|76[018])\\d|475[0-6])\\d{4})$"],
        ["MF","590","0",[9],"^(?:590(?:0[079]|[14]3|[27][79]|3[03-7]|5[0-268]|87)\\d{4}|(?:69(?:0\\d\\d|1(?:2[2-9]|3[0-5])|4(?:0[89]|1[2-6]|9\\d)|6(?:1[016-9]|5[0-4]|[67]\\d))|7090[0-4])\\d{4}|80[0-5]\\d{6}|9(?:(?:39[5-7]|76[018])\\d|475[0-6])\\d{4})$"],
        ["BO","591","0",[8,9],null],
        ["GY","592","",[7],null],
        ["EC","593","0",[8,9,10,11],null],
        ["GF","594","0",[9],null],
        ["PY","595","0",[6,7,8,9,10,11],null],
        ["MQ","596","0",[9],null],
        ["SR","597","",[6,7],null],
        ["UY","598","0",[6,7,8,9,10,11,12,13],null],
        ["CW","599","",[7,8],"^(?:[69])"],
        ["BQ","599","",[7],"^(?:[347])"],
        ["TL","670","",[7,8],null],
        ["NF","672","",[6],null],
        ["BN","673","",[7],null],
        ["NR","674","",[7],null],
        ["PG","675","",[7,8],null],
        ["TO","676","",[5,7],null],
        ["SB","677","",[5,7],null],
        ["VU","678","",[5,7],null],
        ["FJ","679","",[7,11],null],
        ["PW","680","",[7],null],
        ["WF","681","",[6,9],null],
        ["CK","682","",[5],null],
        ["NU","683","",[4,7],null],
        ["WS","685","",[5,6,7,10],null],
        ["KI","686","0",[5,8],null],
        ["NC","687","",[6],null],
        ["TV","688","",[5,6,7],null],
        ["PF","689","",[6,8,9],null],
        ["TK","690","",[4,5,6,7],null],
        ["FM","691","",[7],null],
        ["MH","692","1",[7],null],
        ["KP","850","0",[8,10],null],
        ["HK","852","",[5,6,7,8,9,11],null],
        ["MO","853","",[7,8],null],
        ["KH","855","0",[8,9,10],null],
        ["LA","856","0",[8,9,10],null],
        ["BD","880","0",[6,7,8,9,10],null],
        ["TW","886","0",[7,8,9,10,11],null],
        ["MV","960","",[7,10],null],
        ["LB","961","0",[7,8],null],
        ["JO","962","0",[8,9],null],
        ["SY","963","0",[8,9],null],
        ["IQ","964","0",[8,9,10],null],
        ["KW","965","",[7,8],null],
        ["SA","966","0",[9,10],null],
        ["YE","967","0",[7,8,9],null],
        ["OM","968","",[7,8,9],null],
        ["PS","970","0",[8,9,10],null],
        ["AE","971","0",[5,6,7,8,9,10,11,12],null],
        ["IL","972","0",[7,8,9,10,11,12],null],
        ["BH","973","",[8],null],
        ["QA","974","",[7,8,9,11],null],
        ["BT","975","",[7,8],null],
        ["MN","976","0",[8,9,10],null],
        ["NP","977","0",[8,10,11],null],
        ["TJ","992","",[9],null],
        ["TM","993","8",[8],null],
        ["AZ","994","0",[9],null],
        ["GE","995","0",[9],null],
        ["KG","996","0",[9,10],null],
        ["UZ","998","",[9],null]
    ];

    static _byCountry = null;
    static _byCode = null;

    /**
     * Returns the codes of the countries with a numbering plan.
     * @returns {string[]} The upper-case codes.
     */
    static countries() {
        return webexpress.webui.PhoneCatalog.PLANS.map((plan) => plan[0]);
    }

    /**
     * Returns the calling code of a country, without the plus.
     * @param {string} country - The ISO 3166-1 alpha-2 code, in any letter case.
     * @returns {string|null} The calling code.
     */
    static callingCode(country) {
        const plan = webexpress.webui.PhoneCatalog._index().byCountry.get(String(country ?? "").trim().toUpperCase());
        return plan ? plan.code : null;
    }

    /**
     * Brings a number into the E.164 form, reading a national number in the given country.
     * @param {string} value - The number as written.
     * @param {string} [country] - The country a national number belongs to.
     * @returns {string|null} The number in E.164 form, or null if it is no valid number.
     */
    static normalize(value, country) {
        const catalog = webexpress.webui.PhoneCatalog;
        const digits = catalog._compact(value);
        if (!digits) {
            return null;
        }
        if (digits.startsWith("+")) {
            const resolved = catalog._resolve(digits.slice(1));
            return resolved ? "+" + resolved.plan.code + resolved.national : null;
        }
        const plan = catalog._index().byCountry.get(String(country ?? "").trim().toUpperCase());
        if (!plan) {
            return null;
        }
        const national = catalog.stripPrefix(digits, plan.country);
        return plan.lengths.includes(national.length) ? "+" + plan.code + national : null;
    }

    /**
     * Removes the national prefix a number dialled within its country starts with.
     * @param {string} digits - The national digits.
     * @param {string} country - The country.
     * @returns {string} The digits without the prefix, or unchanged where it is not one.
     */
    static stripPrefix(digits, country) {
        const plan = webexpress.webui.PhoneCatalog._index().byCountry.get(String(country ?? "").toUpperCase());
        if (plan && plan.prefix && digits.startsWith(plan.prefix) && plan.lengths.includes(digits.length - plan.prefix.length)) {
            return digits.slice(plan.prefix.length);
        }
        return digits;
    }

    /**
     * Returns the country an international number belongs to.
     * @param {string} value - The number, international.
     * @returns {string|null} The upper-case country code.
     */
    static country(value) {
        const digits = webexpress.webui.PhoneCatalog._compact(value);
        const resolved = digits && digits.startsWith("+") ? webexpress.webui.PhoneCatalog._resolve(digits.slice(1), true) : null;
        return resolved ? resolved.plan.country : null;
    }

    /**
     * Splits an international number into its country and its national digits, even where the
     * number is not complete yet, so a field can show what the user is typing.
     * @param {string} value - The number, international.
     * @returns {{country: string, national: string}|null} The parts, or null without a known calling code.
     */
    static split(value) {
        const digits = webexpress.webui.PhoneCatalog._compact(value);
        const resolved = digits && digits.startsWith("+") ? webexpress.webui.PhoneCatalog._resolve(digits.slice(1), true) : null;
        return resolved ? { country: resolved.plan.country, national: resolved.national } : null;
    }

    /**
     * Determines whether an international number may belong to a country - more than country()
     * answers, which names one: an australian mobile number belongs to the Cocos Islands as well.
     * @param {string} value - The number, international.
     * @param {string} country - The country, in any letter case.
     * @returns {boolean} True if the number fits the numbering plan of the country.
     */
    static fits(value, country) {
        const catalog = webexpress.webui.PhoneCatalog;
        const digits = catalog._compact(value);
        const plan = catalog._index().byCountry.get(String(country ?? "").trim().toUpperCase());
        if (!digits || !digits.startsWith("+") || !plan || !digits.slice(1).startsWith(plan.code)) {
            return false;
        }
        const national = digits.slice(1 + plan.code.length);
        // the main country takes what no detection claims, so its lengths are its rule
        return plan.lengths.includes(national.length)
            && (catalog._index().byCode.get(plan.code)[0] === plan || !!plan.detect?.test(national));
    }

    /**
     * Writes an international number with its calling code set apart, as +49 30123456.
     * @param {string} value - The number, international.
     * @returns {string|null} The readable form, or null for no valid number.
     */
    static format(value) {
        const digits = webexpress.webui.PhoneCatalog._compact(value);
        const resolved = digits && digits.startsWith("+") ? webexpress.webui.PhoneCatalog._resolve(digits.slice(1)) : null;
        return resolved ? "+" + resolved.plan.code + " " + resolved.national : null;
    }

    /**
     * Removes blanks and separators and turns the international prefix 00 into a plus.
     * @param {string} value - The number as written.
     * @returns {string|null} The digits, led by a plus for an international number.
     */
    static _compact(value) {
        const text = String(value ?? "").trim();
        let digits = "";
        for (const c of text) {
            if (c >= "0" && c <= "9" || c === "+" && digits.length === 0) {
                digits += c;
            } else if (!" -./()".includes(c) && !/\s/.test(c)) {
                return null;
            }
        }
        if (digits.startsWith("00")) {
            digits = "+" + digits.slice(2);
        }
        return digits.length > 1 ? digits : null;
    }

    /**
     * Splits the digits after the plus into a numbering plan and the national number.
     * @param {string} digits - The digits after the plus.
     * @param {boolean} [partial] - Whether a national number of any length is accepted.
     * @returns {{plan: Object, national: string}|null} The plan and the national number.
     */
    static _resolve(digits, partial = false) {
        const byCode = webexpress.webui.PhoneCatalog._index().byCode;
        // calling codes are prefix-free, so at most one of the three lengths names a plan
        for (let length = 1; length <= 3 && length <= digits.length; length++) {
            const plans = byCode.get(digits.slice(0, length));
            if (!plans) {
                continue;
            }
            const national = digits.slice(length);
            // patterns overlap - the cocos islands dial australian mobile numbers - so the first
            // plan claiming the number wins, and the main country takes what none claims
            const plan = plans.find((p) => p.detect && p.detect.test(national)) || plans[0];
            return partial || plan.lengths.includes(national.length) ? { plan: plan, national: national } : null;
        }
        return null;
    }

    /**
     * Builds the lookups on first use.
     * @returns {{byCountry: Map, byCode: Map}} The plans by country and by calling code.
     */
    static _index() {
        const catalog = webexpress.webui.PhoneCatalog;
        if (!catalog._byCountry) {
            catalog._byCountry = new Map();
            catalog._byCode = new Map();
            for (const [country, code, prefix, lengths, detect] of catalog.PLANS) {
                const plan = { country, code, prefix, lengths, detect: detect ? new RegExp(detect) : null };
                catalog._byCountry.set(country, plan);
                const group = catalog._byCode.get(code) || [];
                group.push(plan);
                catalog._byCode.set(code, group);
            }
        }
        return { byCountry: catalog._byCountry, byCode: catalog._byCode };
    }
};

/**
 * Read-only telephone number: the flag of its country and the number as a link that dials it.
 * The following events are triggered:
 * - webexpress.webui.Event.CHANGE_VALUE_EVENT
 */
webexpress.webui.PhoneCtrl = class extends webexpress.webui.Ctrl {
    /**
     * Constructor
     * @param {HTMLElement} element host element
     */
    constructor(element) {
        super(element);

        this._locale = element.getAttribute("lang")
            || document.documentElement.getAttribute("lang")
            || navigator.language
            || "en";
        const value = element.getAttribute("data-value") || element.textContent;

        element.removeAttribute("data-value");
        element.classList.add("wx-phone");
        element.innerHTML = "";

        this._box = document.createElement("span");
        this._flag = document.createElement("i");
        this._link = document.createElement("a");
        this._box.appendChild(this._flag);
        this._box.appendChild(this._link);
        element.appendChild(this._box);

        this._value = null;
        this._render(webexpress.webui.PhoneCatalog.normalize(value));
    }

    /**
     * Returns the number in E.164 form, or null.
     * @returns {string|null} The number.
     */
    get value() {
        return this._value;
    }

    /**
     * Shows another number; an international one, or a national one is not accepted here.
     * @param {string|null} value - The number in any international notation.
     */
    set value(value) {
        const normalized = webexpress.webui.PhoneCatalog.normalize(value);
        if (normalized !== this._value) {
            this._render(normalized);
            this._dispatch(webexpress.webui.Event.CHANGE_VALUE_EVENT, { value: this.value });
        }
    }

    /**
     * Writes a number into the display.
     * @param {string|null} value - The normalized number.
     */
    _render(value) {
        this._value = value;
        const country = value ? webexpress.webui.PhoneCatalog.country(value) : null;

        this._box.hidden = !value;
        this._flag.className = country ? "wx-flag wx-flag-" + country.toLowerCase() : "";
        // the number says where it dials; the flag only shows it at a glance
        this._flag.setAttribute("aria-hidden", "true");
        if (country) {
            this._flag.setAttribute("title", this._countryName(country));
        } else {
            this._flag.removeAttribute("title");
        }
        this._link.textContent = value ? webexpress.webui.PhoneCatalog.format(value) : "";
        if (value) {
            this._link.setAttribute("href", "tel:" + value);
        } else {
            this._link.removeAttribute("href");
        }
    }

    /**
     * Names a country in the language of the page.
     * @param {string} country - The upper-case country code.
     * @returns {string} The name, or the code where the browser has none.
     */
    _countryName(country) {
        try {
            return new Intl.DisplayNames([this._locale], { type: "region" }).of(country) || country;
        } catch (e) {
            // an unknown locale tag still leaves the code as a tooltip
            return country;
        }
    }
};

// register class
webexpress.webui.Controller.registerClass("wx-webui-phone", webexpress.webui.PhoneCtrl);
