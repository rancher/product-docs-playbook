/*!
 * Snowball JavaScript Library v0.3
 * http://code.google.com/p/urim/
 * http://snowball.tartarus.org/
 *
 * Copyright 2010, Oleg Mazko
 * http://www.mozilla.org/MPL/
 */

/**
 * export the module via AMD, CommonJS or as a browser global
 * Export code from https://github.com/umdjs/umd/blob/master/returnExports.js
 */
;(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory)
    } else if (typeof exports === 'object') {
        /**
         * Node. Does not work with strict CommonJS, but
         * only CommonJS-like environments that support module.exports,
         * like Node.
         */
        module.exports = factory()
    } else {
        // Browser globals (root is window)
        factory()(root.lunr);
    }
}(this, function () {
    /**
     * Just return a value to define the module export.
     * This example returns an object, but the module
     * can return a function as the exported value.
     */
    return function(lunr) {
        /* provides utilities for the included stemmers */
        lunr.stemmerSupport = {
            Among: function(s, substring_i, result, method) {
                this.toCharArray = function(s) {
                    var sLength = s.length, charArr = new Array(sLength);
                    for (var i = 0; i < sLength; i++)
                        charArr[i] = s.charCodeAt(i);
                    return charArr;
                };

                if ((!s && s != "") || (!substring_i && (substring_i != 0)) || !result)
                    throw ("Bad Among initialisation: s:" + s + ", substring_i: "
                        + substring_i + ", result: " + result);
                this.s_size = s.length;
                this.s = this.toCharArray(s);
                this.substring_i = substring_i;
                this.result = result;
                this.method = method;
            },
            SnowballProgram: function() {
                var current;
                return {
                    bra : 0,
                    ket : 0,
                    limit : 0,
                    cursor : 0,
                    limit_backward : 0,
                    setCurrent : function(word) {
                        current = word;
                        this.cursor = 0;
                        this.limit = word.length;
                        this.limit_backward = 0;
                        this.bra = this.cursor;
                        this.ket = this.limit;
                    },
                    getCurrent : function() {
                        var result = current;
                        current = null;
                        return result;
                    },
                    in_grouping : function(s, min, max) {
                        if (this.cursor < this.limit) {
                            var ch = current.charCodeAt(this.cursor);
                            if (ch <= max && ch >= min) {
                                ch -= min;
                                if (s[ch >> 3] & (0X1 << (ch & 0X7))) {
                                    this.cursor++;
                                    return true;
                                }
                            }
                        }
                        return false;
                    },
                    in_grouping_b : function(s, min, max) {
                        if (this.cursor > this.limit_backward) {
                            var ch = current.charCodeAt(this.cursor - 1);
                            if (ch <= max && ch >= min) {
                                ch -= min;
                                if (s[ch >> 3] & (0X1 << (ch & 0X7))) {
                                    this.cursor--;
                                    return true;
                                }
                            }
                        }
                        return false;
                    },
                    out_grouping : function(s, min, max) {
                        if (this.cursor < this.limit) {
                            var ch = current.charCodeAt(this.cursor);
                            if (ch > max || ch < min) {
                                this.cursor++;
                                return true;
                            }
                            ch -= min;
                            if (!(s[ch >> 3] & (0X1 << (ch & 0X7)))) {
                                this.cursor++;
                                return true;
                            }
                        }
                        return false;
                    },
                    out_grouping_b : function(s, min, max) {
                        if (this.cursor > this.limit_backward) {
                            var ch = current.charCodeAt(this.cursor - 1);
                            if (ch > max || ch < min) {
                                this.cursor--;
                                return true;
                            }
                            ch -= min;
                            if (!(s[ch >> 3] & (0X1 << (ch & 0X7)))) {
                                this.cursor--;
                                return true;
                            }
                        }
                        return false;
                    },
                    eq_s : function(s_size, s) {
                        if (this.limit - this.cursor < s_size)
                            return false;
                        for (var i = 0; i < s_size; i++)
                            if (current.charCodeAt(this.cursor + i) != s.charCodeAt(i))
                                return false;
                        this.cursor += s_size;
                        return true;
                    },
                    eq_s_b : function(s_size, s) {
                        if (this.cursor - this.limit_backward < s_size)
                            return false;
                        for (var i = 0; i < s_size; i++)
                            if (current.charCodeAt(this.cursor - s_size + i) != s
                                .charCodeAt(i))
                                return false;
                        this.cursor -= s_size;
                        return true;
                    },
                    find_among : function(v, v_size) {
                        var i = 0, j = v_size, c = this.cursor, l = this.limit, common_i = 0, common_j = 0, first_key_inspected = false;
                        while (true) {
                            var k = i + ((j - i) >> 1), diff = 0, common = common_i < common_j
                                ? common_i
                                : common_j, w = v[k];
                            for (var i2 = common; i2 < w.s_size; i2++) {
                                if (c + common == l) {
                                    diff = -1;
                                    break;
                                }
                                diff = current.charCodeAt(c + common) - w.s[i2];
                                if (diff)
                                    break;
                                common++;
                            }
                            if (diff < 0) {
                                j = k;
                                common_j = common;
                            } else {
                                i = k;
                                common_i = common;
                            }
                            if (j - i <= 1) {
                                if (i > 0 || j == i || first_key_inspected)
                                    break;
                                first_key_inspected = true;
                            }
                        }
                        while (true) {
                            var w = v[i];
                            if (common_i >= w.s_size) {
                                this.cursor = c + w.s_size;
                                if (!w.method)
                                    return w.result;
                                var res = w.method();
                                this.cursor = c + w.s_size;
                                if (res)
                                    return w.result;
                            }
                            i = w.substring_i;
                            if (i < 0)
                                return 0;
                        }
                    },
                    find_among_b : function(v, v_size) {
                        var i = 0, j = v_size, c = this.cursor, lb = this.limit_backward, common_i = 0, common_j = 0, first_key_inspected = false;
                        while (true) {
                            var k = i + ((j - i) >> 1), diff = 0, common = common_i < common_j
                                ? common_i
                                : common_j, w = v[k];
                            for (var i2 = w.s_size - 1 - common; i2 >= 0; i2--) {
                                if (c - common == lb) {
                                    diff = -1;
                                    break;
                                }
                                diff = current.charCodeAt(c - 1 - common) - w.s[i2];
                                if (diff)
                                    break;
                                common++;
                            }
                            if (diff < 0) {
                                j = k;
                                common_j = common;
                            } else {
                                i = k;
                                common_i = common;
                            }
                            if (j - i <= 1) {
                                if (i > 0 || j == i || first_key_inspected)
                                    break;
                                first_key_inspected = true;
                            }
                        }
                        while (true) {
                            var w = v[i];
                            if (common_i >= w.s_size) {
                                this.cursor = c - w.s_size;
                                if (!w.method)
                                    return w.result;
                                var res = w.method();
                                this.cursor = c - w.s_size;
                                if (res)
                                    return w.result;
                            }
                            i = w.substring_i;
                            if (i < 0)
                                return 0;
                        }
                    },
                    replace_s : function(c_bra, c_ket, s) {
                        var adjustment = s.length - (c_ket - c_bra), left = current
                            .substring(0, c_bra), right = current.substring(c_ket);
                        current = left + s + right;
                        this.limit += adjustment;
                        if (this.cursor >= c_ket)
                            this.cursor += adjustment;
                        else if (this.cursor > c_bra)
                            this.cursor = c_bra;
                        return adjustment;
                    },
                    slice_check : function() {
                        if (this.bra < 0 || this.bra > this.ket || this.ket > this.limit
                            || this.limit > current.length)
                            throw ("faulty slice operation");
                    },
                    slice_from : function(s) {
                        this.slice_check();
                        this.replace_s(this.bra, this.ket, s);
                    },
                    slice_del : function() {
                        this.slice_from("");
                    },
                    insert : function(c_bra, c_ket, s) {
                        var adjustment = this.replace_s(c_bra, c_ket, s);
                        if (c_bra <= this.bra)
                            this.bra += adjustment;
                        if (c_bra <= this.ket)
                            this.ket += adjustment;
                    },
                    slice_to : function() {
                        this.slice_check();
                        return current.substring(this.bra, this.ket);
                    },
                    eq_v_b : function(s) {
                        return this.eq_s_b(s.length, s);
                    }
                };
            }
        };

        lunr.trimmerSupport = {
            generateTrimmer: function(wordCharacters) {
                var startRegex = new RegExp("^[^" + wordCharacters + "]+")
                var endRegex = new RegExp("[^" + wordCharacters + "]+$")

                return function(token) {
                    // for lunr version 2
                    if (typeof token.update === "function") {
                        return token.update(function (s) {
                            return s
                                .replace(startRegex, '')
                                .replace(endRegex, '');
                        })
                    } else { // for lunr version 1
                        return token
                            .replace(startRegex, '')
                            .replace(endRegex, '');
                    }
                };
            }
        }
    }
}));
/**
 * export the module via AMD, CommonJS or as a browser global
 * Export code from https://github.com/umdjs/umd/blob/master/returnExports.js
 */
;(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory)
    } else if (typeof exports === 'object') {
        /**
         * Node. Does not work with strict CommonJS, but
         * only CommonJS-like environments that support module.exports,
         * like Node.
         */
        module.exports = factory()
    } else {
        // Browser globals (root is window)
        factory()(root.lunr);
    }
}(this, function () {
    /**
     * Just return a value to define the module export.
     * This example returns an object, but the module
     * can return a function as the exported value.
     */

    return function(lunr) {
        // TinySegmenter 0.1 -- Super compact Japanese tokenizer in Javascript
        // (c) 2008 Taku Kudo <taku@chasen.org>
        // TinySegmenter is freely distributable under the terms of a new BSD licence.
        // For details, see http://chasen.org/~taku/software/TinySegmenter/LICENCE.txt

        function TinySegmenter() {
          var patterns = {
            "[一二三四五六七八九十百千万億兆]":"M",
            "[一-龠々〆ヵヶ]":"H",
            "[ぁ-ん]":"I",
            "[ァ-ヴーｱ-ﾝﾞｰ]":"K",
            "[a-zA-Zａ-ｚＡ-Ｚ]":"A",
            "[0-9０-９]":"N"
          }
          this.chartype_ = [];
          for (var i in patterns) {
            var regexp = new RegExp(i);
            this.chartype_.push([regexp, patterns[i]]);
          }

          this.BIAS__ = -332
          this.BC1__ = {"HH":6,"II":2461,"KH":406,"OH":-1378};
          this.BC2__ = {"AA":-3267,"AI":2744,"AN":-878,"HH":-4070,"HM":-1711,"HN":4012,"HO":3761,"IA":1327,"IH":-1184,"II":-1332,"IK":1721,"IO":5492,"KI":3831,"KK":-8741,"MH":-3132,"MK":3334,"OO":-2920};
          this.BC3__ = {"HH":996,"HI":626,"HK":-721,"HN":-1307,"HO":-836,"IH":-301,"KK":2762,"MK":1079,"MM":4034,"OA":-1652,"OH":266};
          this.BP1__ = {"BB":295,"OB":304,"OO":-125,"UB":352};
          this.BP2__ = {"BO":60,"OO":-1762};
          this.BQ1__ = {"BHH":1150,"BHM":1521,"BII":-1158,"BIM":886,"BMH":1208,"BNH":449,"BOH":-91,"BOO":-2597,"OHI":451,"OIH":-296,"OKA":1851,"OKH":-1020,"OKK":904,"OOO":2965};
          this.BQ2__ = {"BHH":118,"BHI":-1159,"BHM":466,"BIH":-919,"BKK":-1720,"BKO":864,"OHH":-1139,"OHM":-181,"OIH":153,"UHI":-1146};
          this.BQ3__ = {"BHH":-792,"BHI":2664,"BII":-299,"BKI":419,"BMH":937,"BMM":8335,"BNN":998,"BOH":775,"OHH":2174,"OHM":439,"OII":280,"OKH":1798,"OKI":-793,"OKO":-2242,"OMH":-2402,"OOO":11699};
          this.BQ4__ = {"BHH":-3895,"BIH":3761,"BII":-4654,"BIK":1348,"BKK":-1806,"BMI":-3385,"BOO":-12396,"OAH":926,"OHH":266,"OHK":-2036,"ONN":-973};
          this.BW1__ = {",と":660,",同":727,"B1あ":1404,"B1同":542,"、と":660,"、同":727,"」と":1682,"あっ":1505,"いう":1743,"いっ":-2055,"いる":672,"うし":-4817,"うん":665,"から":3472,"がら":600,"こう":-790,"こと":2083,"こん":-1262,"さら":-4143,"さん":4573,"した":2641,"して":1104,"すで":-3399,"そこ":1977,"それ":-871,"たち":1122,"ため":601,"った":3463,"つい":-802,"てい":805,"てき":1249,"でき":1127,"です":3445,"では":844,"とい":-4915,"とみ":1922,"どこ":3887,"ない":5713,"なっ":3015,"など":7379,"なん":-1113,"にし":2468,"には":1498,"にも":1671,"に対":-912,"の一":-501,"の中":741,"ませ":2448,"まで":1711,"まま":2600,"まる":-2155,"やむ":-1947,"よっ":-2565,"れた":2369,"れで":-913,"をし":1860,"を見":731,"亡く":-1886,"京都":2558,"取り":-2784,"大き":-2604,"大阪":1497,"平方":-2314,"引き":-1336,"日本":-195,"本当":-2423,"毎日":-2113,"目指":-724,"Ｂ１あ":1404,"Ｂ１同":542,"｣と":1682};
          this.BW2__ = {"..":-11822,"11":-669,"――":-5730,"−−":-13175,"いう":-1609,"うか":2490,"かし":-1350,"かも":-602,"から":-7194,"かれ":4612,"がい":853,"がら":-3198,"きた":1941,"くな":-1597,"こと":-8392,"この":-4193,"させ":4533,"され":13168,"さん":-3977,"しい":-1819,"しか":-545,"した":5078,"して":972,"しな":939,"その":-3744,"たい":-1253,"たた":-662,"ただ":-3857,"たち":-786,"たと":1224,"たは":-939,"った":4589,"って":1647,"っと":-2094,"てい":6144,"てき":3640,"てく":2551,"ては":-3110,"ても":-3065,"でい":2666,"でき":-1528,"でし":-3828,"です":-4761,"でも":-4203,"とい":1890,"とこ":-1746,"とと":-2279,"との":720,"とみ":5168,"とも":-3941,"ない":-2488,"なが":-1313,"など":-6509,"なの":2614,"なん":3099,"にお":-1615,"にし":2748,"にな":2454,"によ":-7236,"に対":-14943,"に従":-4688,"に関":-11388,"のか":2093,"ので":-7059,"のに":-6041,"のの":-6125,"はい":1073,"はが":-1033,"はず":-2532,"ばれ":1813,"まし":-1316,"まで":-6621,"まれ":5409,"めて":-3153,"もい":2230,"もの":-10713,"らか":-944,"らし":-1611,"らに":-1897,"りし":651,"りま":1620,"れた":4270,"れて":849,"れば":4114,"ろう":6067,"われ":7901,"を通":-11877,"んだ":728,"んな":-4115,"一人":602,"一方":-1375,"一日":970,"一部":-1051,"上が":-4479,"会社":-1116,"出て":2163,"分の":-7758,"同党":970,"同日":-913,"大阪":-2471,"委員":-1250,"少な":-1050,"年度":-8669,"年間":-1626,"府県":-2363,"手権":-1982,"新聞":-4066,"日新":-722,"日本":-7068,"日米":3372,"曜日":-601,"朝鮮":-2355,"本人":-2697,"東京":-1543,"然と":-1384,"社会":-1276,"立て":-990,"第に":-1612,"米国":-4268,"１１":-669};
          this.BW3__ = {"あた":-2194,"あり":719,"ある":3846,"い.":-1185,"い。":-1185,"いい":5308,"いえ":2079,"いく":3029,"いた":2056,"いっ":1883,"いる":5600,"いわ":1527,"うち":1117,"うと":4798,"えと":1454,"か.":2857,"か。":2857,"かけ":-743,"かっ":-4098,"かに":-669,"から":6520,"かり":-2670,"が,":1816,"が、":1816,"がき":-4855,"がけ":-1127,"がっ":-913,"がら":-4977,"がり":-2064,"きた":1645,"けど":1374,"こと":7397,"この":1542,"ころ":-2757,"さい":-714,"さを":976,"し,":1557,"し、":1557,"しい":-3714,"した":3562,"して":1449,"しな":2608,"しま":1200,"す.":-1310,"す。":-1310,"する":6521,"ず,":3426,"ず、":3426,"ずに":841,"そう":428,"た.":8875,"た。":8875,"たい":-594,"たの":812,"たり":-1183,"たる":-853,"だ.":4098,"だ。":4098,"だっ":1004,"った":-4748,"って":300,"てい":6240,"てお":855,"ても":302,"です":1437,"でに":-1482,"では":2295,"とう":-1387,"とし":2266,"との":541,"とも":-3543,"どう":4664,"ない":1796,"なく":-903,"など":2135,"に,":-1021,"に、":-1021,"にし":1771,"にな":1906,"には":2644,"の,":-724,"の、":-724,"の子":-1000,"は,":1337,"は、":1337,"べき":2181,"まし":1113,"ます":6943,"まっ":-1549,"まで":6154,"まれ":-793,"らし":1479,"られ":6820,"るる":3818,"れ,":854,"れ、":854,"れた":1850,"れて":1375,"れば":-3246,"れる":1091,"われ":-605,"んだ":606,"んで":798,"カ月":990,"会議":860,"入り":1232,"大会":2217,"始め":1681,"市":965,"新聞":-5055,"日,":974,"日、":974,"社会":2024,"ｶ月":990};
          this.TC1__ = {"AAA":1093,"HHH":1029,"HHM":580,"HII":998,"HOH":-390,"HOM":-331,"IHI":1169,"IOH":-142,"IOI":-1015,"IOM":467,"MMH":187,"OOI":-1832};
          this.TC2__ = {"HHO":2088,"HII":-1023,"HMM":-1154,"IHI":-1965,"KKH":703,"OII":-2649};
          this.TC3__ = {"AAA":-294,"HHH":346,"HHI":-341,"HII":-1088,"HIK":731,"HOH":-1486,"IHH":128,"IHI":-3041,"IHO":-1935,"IIH":-825,"IIM":-1035,"IOI":-542,"KHH":-1216,"KKA":491,"KKH":-1217,"KOK":-1009,"MHH":-2694,"MHM":-457,"MHO":123,"MMH":-471,"NNH":-1689,"NNO":662,"OHO":-3393};
          this.TC4__ = {"HHH":-203,"HHI":1344,"HHK":365,"HHM":-122,"HHN":182,"HHO":669,"HIH":804,"HII":679,"HOH":446,"IHH":695,"IHO":-2324,"IIH":321,"III":1497,"IIO":656,"IOO":54,"KAK":4845,"KKA":3386,"KKK":3065,"MHH":-405,"MHI":201,"MMH":-241,"MMM":661,"MOM":841};
          this.TQ1__ = {"BHHH":-227,"BHHI":316,"BHIH":-132,"BIHH":60,"BIII":1595,"BNHH":-744,"BOHH":225,"BOOO":-908,"OAKK":482,"OHHH":281,"OHIH":249,"OIHI":200,"OIIH":-68};
          this.TQ2__ = {"BIHH":-1401,"BIII":-1033,"BKAK":-543,"BOOO":-5591};
          this.TQ3__ = {"BHHH":478,"BHHM":-1073,"BHIH":222,"BHII":-504,"BIIH":-116,"BIII":-105,"BMHI":-863,"BMHM":-464,"BOMH":620,"OHHH":346,"OHHI":1729,"OHII":997,"OHMH":481,"OIHH":623,"OIIH":1344,"OKAK":2792,"OKHH":587,"OKKA":679,"OOHH":110,"OOII":-685};
          this.TQ4__ = {"BHHH":-721,"BHHM":-3604,"BHII":-966,"BIIH":-607,"BIII":-2181,"OAAA":-2763,"OAKK":180,"OHHH":-294,"OHHI":2446,"OHHO":480,"OHIH":-1573,"OIHH":1935,"OIHI":-493,"OIIH":626,"OIII":-4007,"OKAK":-8156};
          this.TW1__ = {"につい":-4681,"東京都":2026};
          this.TW2__ = {"ある程":-2049,"いった":-1256,"ころが":-2434,"しょう":3873,"その後":-4430,"だって":-1049,"ていた":1833,"として":-4657,"ともに":-4517,"もので":1882,"一気に":-792,"初めて":-1512,"同時に":-8097,"大きな":-1255,"対して":-2721,"社会党":-3216};
          this.TW3__ = {"いただ":-1734,"してい":1314,"として":-4314,"につい":-5483,"にとっ":-5989,"に当た":-6247,"ので,":-727,"ので、":-727,"のもの":-600,"れから":-3752,"十二月":-2287};
          this.TW4__ = {"いう.":8576,"いう。":8576,"からな":-2348,"してい":2958,"たが,":1516,"たが、":1516,"ている":1538,"という":1349,"ました":5543,"ません":1097,"ようと":-4258,"よると":5865};
          this.UC1__ = {"A":484,"K":93,"M":645,"O":-505};
          this.UC2__ = {"A":819,"H":1059,"I":409,"M":3987,"N":5775,"O":646};
          this.UC3__ = {"A":-1370,"I":2311};
          this.UC4__ = {"A":-2643,"H":1809,"I":-1032,"K":-3450,"M":3565,"N":3876,"O":6646};
          this.UC5__ = {"H":313,"I":-1238,"K":-799,"M":539,"O":-831};
          this.UC6__ = {"H":-506,"I":-253,"K":87,"M":247,"O":-387};
          this.UP1__ = {"O":-214};
          this.UP2__ = {"B":69,"O":935};
          this.UP3__ = {"B":189};
          this.UQ1__ = {"BH":21,"BI":-12,"BK":-99,"BN":142,"BO":-56,"OH":-95,"OI":477,"OK":410,"OO":-2422};
          this.UQ2__ = {"BH":216,"BI":113,"OK":1759};
          this.UQ3__ = {"BA":-479,"BH":42,"BI":1913,"BK":-7198,"BM":3160,"BN":6427,"BO":14761,"OI":-827,"ON":-3212};
          this.UW1__ = {",":156,"、":156,"「":-463,"あ":-941,"う":-127,"が":-553,"き":121,"こ":505,"で":-201,"と":-547,"ど":-123,"に":-789,"の":-185,"は":-847,"も":-466,"や":-470,"よ":182,"ら":-292,"り":208,"れ":169,"を":-446,"ん":-137,"・":-135,"主":-402,"京":-268,"区":-912,"午":871,"国":-460,"大":561,"委":729,"市":-411,"日":-141,"理":361,"生":-408,"県":-386,"都":-718,"｢":-463,"･":-135};
          this.UW2__ = {",":-829,"、":-829,"〇":892,"「":-645,"」":3145,"あ":-538,"い":505,"う":134,"お":-502,"か":1454,"が":-856,"く":-412,"こ":1141,"さ":878,"ざ":540,"し":1529,"す":-675,"せ":300,"そ":-1011,"た":188,"だ":1837,"つ":-949,"て":-291,"で":-268,"と":-981,"ど":1273,"な":1063,"に":-1764,"の":130,"は":-409,"ひ":-1273,"べ":1261,"ま":600,"も":-1263,"や":-402,"よ":1639,"り":-579,"る":-694,"れ":571,"を":-2516,"ん":2095,"ア":-587,"カ":306,"キ":568,"ッ":831,"三":-758,"不":-2150,"世":-302,"中":-968,"主":-861,"事":492,"人":-123,"会":978,"保":362,"入":548,"初":-3025,"副":-1566,"北":-3414,"区":-422,"大":-1769,"天":-865,"太":-483,"子":-1519,"学":760,"実":1023,"小":-2009,"市":-813,"年":-1060,"強":1067,"手":-1519,"揺":-1033,"政":1522,"文":-1355,"新":-1682,"日":-1815,"明":-1462,"最":-630,"朝":-1843,"本":-1650,"東":-931,"果":-665,"次":-2378,"民":-180,"気":-1740,"理":752,"発":529,"目":-1584,"相":-242,"県":-1165,"立":-763,"第":810,"米":509,"自":-1353,"行":838,"西":-744,"見":-3874,"調":1010,"議":1198,"込":3041,"開":1758,"間":-1257,"｢":-645,"｣":3145,"ｯ":831,"ｱ":-587,"ｶ":306,"ｷ":568};
          this.UW3__ = {",":4889,"1":-800,"−":-1723,"、":4889,"々":-2311,"〇":5827,"」":2670,"〓":-3573,"あ":-2696,"い":1006,"う":2342,"え":1983,"お":-4864,"か":-1163,"が":3271,"く":1004,"け":388,"げ":401,"こ":-3552,"ご":-3116,"さ":-1058,"し":-395,"す":584,"せ":3685,"そ":-5228,"た":842,"ち":-521,"っ":-1444,"つ":-1081,"て":6167,"で":2318,"と":1691,"ど":-899,"な":-2788,"に":2745,"の":4056,"は":4555,"ひ":-2171,"ふ":-1798,"へ":1199,"ほ":-5516,"ま":-4384,"み":-120,"め":1205,"も":2323,"や":-788,"よ":-202,"ら":727,"り":649,"る":5905,"れ":2773,"わ":-1207,"を":6620,"ん":-518,"ア":551,"グ":1319,"ス":874,"ッ":-1350,"ト":521,"ム":1109,"ル":1591,"ロ":2201,"ン":278,"・":-3794,"一":-1619,"下":-1759,"世":-2087,"両":3815,"中":653,"主":-758,"予":-1193,"二":974,"人":2742,"今":792,"他":1889,"以":-1368,"低":811,"何":4265,"作":-361,"保":-2439,"元":4858,"党":3593,"全":1574,"公":-3030,"六":755,"共":-1880,"円":5807,"再":3095,"分":457,"初":2475,"別":1129,"前":2286,"副":4437,"力":365,"動":-949,"務":-1872,"化":1327,"北":-1038,"区":4646,"千":-2309,"午":-783,"協":-1006,"口":483,"右":1233,"各":3588,"合":-241,"同":3906,"和":-837,"員":4513,"国":642,"型":1389,"場":1219,"外":-241,"妻":2016,"学":-1356,"安":-423,"実":-1008,"家":1078,"小":-513,"少":-3102,"州":1155,"市":3197,"平":-1804,"年":2416,"広":-1030,"府":1605,"度":1452,"建":-2352,"当":-3885,"得":1905,"思":-1291,"性":1822,"戸":-488,"指":-3973,"政":-2013,"教":-1479,"数":3222,"文":-1489,"新":1764,"日":2099,"旧":5792,"昨":-661,"時":-1248,"曜":-951,"最":-937,"月":4125,"期":360,"李":3094,"村":364,"東":-805,"核":5156,"森":2438,"業":484,"氏":2613,"民":-1694,"決":-1073,"法":1868,"海":-495,"無":979,"物":461,"特":-3850,"生":-273,"用":914,"町":1215,"的":7313,"直":-1835,"省":792,"県":6293,"知":-1528,"私":4231,"税":401,"立":-960,"第":1201,"米":7767,"系":3066,"約":3663,"級":1384,"統":-4229,"総":1163,"線":1255,"者":6457,"能":725,"自":-2869,"英":785,"見":1044,"調":-562,"財":-733,"費":1777,"車":1835,"軍":1375,"込":-1504,"通":-1136,"選":-681,"郎":1026,"郡":4404,"部":1200,"金":2163,"長":421,"開":-1432,"間":1302,"関":-1282,"雨":2009,"電":-1045,"非":2066,"駅":1620,"１":-800,"｣":2670,"･":-3794,"ｯ":-1350,"ｱ":551,"ｸﾞ":1319,"ｽ":874,"ﾄ":521,"ﾑ":1109,"ﾙ":1591,"ﾛ":2201,"ﾝ":278};
          this.UW4__ = {",":3930,".":3508,"―":-4841,"、":3930,"。":3508,"〇":4999,"「":1895,"」":3798,"〓":-5156,"あ":4752,"い":-3435,"う":-640,"え":-2514,"お":2405,"か":530,"が":6006,"き":-4482,"ぎ":-3821,"く":-3788,"け":-4376,"げ":-4734,"こ":2255,"ご":1979,"さ":2864,"し":-843,"じ":-2506,"す":-731,"ず":1251,"せ":181,"そ":4091,"た":5034,"だ":5408,"ち":-3654,"っ":-5882,"つ":-1659,"て":3994,"で":7410,"と":4547,"な":5433,"に":6499,"ぬ":1853,"ね":1413,"の":7396,"は":8578,"ば":1940,"ひ":4249,"び":-4134,"ふ":1345,"へ":6665,"べ":-744,"ほ":1464,"ま":1051,"み":-2082,"む":-882,"め":-5046,"も":4169,"ゃ":-2666,"や":2795,"ょ":-1544,"よ":3351,"ら":-2922,"り":-9726,"る":-14896,"れ":-2613,"ろ":-4570,"わ":-1783,"を":13150,"ん":-2352,"カ":2145,"コ":1789,"セ":1287,"ッ":-724,"ト":-403,"メ":-1635,"ラ":-881,"リ":-541,"ル":-856,"ン":-3637,"・":-4371,"ー":-11870,"一":-2069,"中":2210,"予":782,"事":-190,"井":-1768,"人":1036,"以":544,"会":950,"体":-1286,"作":530,"側":4292,"先":601,"党":-2006,"共":-1212,"内":584,"円":788,"初":1347,"前":1623,"副":3879,"力":-302,"動":-740,"務":-2715,"化":776,"区":4517,"協":1013,"参":1555,"合":-1834,"和":-681,"員":-910,"器":-851,"回":1500,"国":-619,"園":-1200,"地":866,"場":-1410,"塁":-2094,"士":-1413,"多":1067,"大":571,"子":-4802,"学":-1397,"定":-1057,"寺":-809,"小":1910,"屋":-1328,"山":-1500,"島":-2056,"川":-2667,"市":2771,"年":374,"庁":-4556,"後":456,"性":553,"感":916,"所":-1566,"支":856,"改":787,"政":2182,"教":704,"文":522,"方":-856,"日":1798,"時":1829,"最":845,"月":-9066,"木":-485,"来":-442,"校":-360,"業":-1043,"氏":5388,"民":-2716,"気":-910,"沢":-939,"済":-543,"物":-735,"率":672,"球":-1267,"生":-1286,"産":-1101,"田":-2900,"町":1826,"的":2586,"目":922,"省":-3485,"県":2997,"空":-867,"立":-2112,"第":788,"米":2937,"系":786,"約":2171,"経":1146,"統":-1169,"総":940,"線":-994,"署":749,"者":2145,"能":-730,"般":-852,"行":-792,"規":792,"警":-1184,"議":-244,"谷":-1000,"賞":730,"車":-1481,"軍":1158,"輪":-1433,"込":-3370,"近":929,"道":-1291,"選":2596,"郎":-4866,"都":1192,"野":-1100,"銀":-2213,"長":357,"間":-2344,"院":-2297,"際":-2604,"電":-878,"領":-1659,"題":-792,"館":-1984,"首":1749,"高":2120,"｢":1895,"｣":3798,"･":-4371,"ｯ":-724,"ｰ":-11870,"ｶ":2145,"ｺ":1789,"ｾ":1287,"ﾄ":-403,"ﾒ":-1635,"ﾗ":-881,"ﾘ":-541,"ﾙ":-856,"ﾝ":-3637};
          this.UW5__ = {",":465,".":-299,"1":-514,"E2":-32768,"]":-2762,"、":465,"。":-299,"「":363,"あ":1655,"い":331,"う":-503,"え":1199,"お":527,"か":647,"が":-421,"き":1624,"ぎ":1971,"く":312,"げ":-983,"さ":-1537,"し":-1371,"す":-852,"だ":-1186,"ち":1093,"っ":52,"つ":921,"て":-18,"で":-850,"と":-127,"ど":1682,"な":-787,"に":-1224,"の":-635,"は":-578,"べ":1001,"み":502,"め":865,"ゃ":3350,"ょ":854,"り":-208,"る":429,"れ":504,"わ":419,"を":-1264,"ん":327,"イ":241,"ル":451,"ン":-343,"中":-871,"京":722,"会":-1153,"党":-654,"務":3519,"区":-901,"告":848,"員":2104,"大":-1296,"学":-548,"定":1785,"嵐":-1304,"市":-2991,"席":921,"年":1763,"思":872,"所":-814,"挙":1618,"新":-1682,"日":218,"月":-4353,"査":932,"格":1356,"機":-1508,"氏":-1347,"田":240,"町":-3912,"的":-3149,"相":1319,"省":-1052,"県":-4003,"研":-997,"社":-278,"空":-813,"統":1955,"者":-2233,"表":663,"語":-1073,"議":1219,"選":-1018,"郎":-368,"長":786,"間":1191,"題":2368,"館":-689,"１":-514,"Ｅ２":-32768,"｢":363,"ｲ":241,"ﾙ":451,"ﾝ":-343};
          this.UW6__ = {",":227,".":808,"1":-270,"E1":306,"、":227,"。":808,"あ":-307,"う":189,"か":241,"が":-73,"く":-121,"こ":-200,"じ":1782,"す":383,"た":-428,"っ":573,"て":-1014,"で":101,"と":-105,"な":-253,"に":-149,"の":-417,"は":-236,"も":-206,"り":187,"る":-135,"を":195,"ル":-673,"ン":-496,"一":-277,"中":201,"件":-800,"会":624,"前":302,"区":1792,"員":-1212,"委":798,"学":-960,"市":887,"広":-695,"後":535,"業":-697,"相":753,"社":-507,"福":974,"空":-822,"者":1811,"連":463,"郎":1082,"１":-270,"Ｅ１":306,"ﾙ":-673,"ﾝ":-496};
          
          return this;
        }
        TinySegmenter.prototype.ctype_ = function(str) {
          for (var i in this.chartype_) {
            if (str.match(this.chartype_[i][0])) {
              return this.chartype_[i][1];
            }
          }
          return "O";
        }

        TinySegmenter.prototype.ts_ = function(v) {
          if (v) { return v; }
          return 0;
        }

        TinySegmenter.prototype.segment = function(input) {
          if (input == null || input == undefined || input == "") {
            return [];
          }
          var result = [];
          var seg = ["B3","B2","B1"];
          var ctype = ["O","O","O"];
          var o = input.split("");
          for (i = 0; i < o.length; ++i) {
            seg.push(o[i]);
            ctype.push(this.ctype_(o[i]))
          }
          seg.push("E1");
          seg.push("E2");
          seg.push("E3");
          ctype.push("O");
          ctype.push("O");
          ctype.push("O");
          var word = seg[3];
          var p1 = "U";
          var p2 = "U";
          var p3 = "U";
          for (var i = 4; i < seg.length - 3; ++i) {
            var score = this.BIAS__;
            var w1 = seg[i-3];
            var w2 = seg[i-2];
            var w3 = seg[i-1];
            var w4 = seg[i];
            var w5 = seg[i+1];
            var w6 = seg[i+2];
            var c1 = ctype[i-3];
            var c2 = ctype[i-2];
            var c3 = ctype[i-1];
            var c4 = ctype[i];
            var c5 = ctype[i+1];
            var c6 = ctype[i+2];
            score += this.ts_(this.UP1__[p1]);
            score += this.ts_(this.UP2__[p2]);
            score += this.ts_(this.UP3__[p3]);
            score += this.ts_(this.BP1__[p1 + p2]);
            score += this.ts_(this.BP2__[p2 + p3]);
            score += this.ts_(this.UW1__[w1]);
            score += this.ts_(this.UW2__[w2]);
            score += this.ts_(this.UW3__[w3]);
            score += this.ts_(this.UW4__[w4]);
            score += this.ts_(this.UW5__[w5]);
            score += this.ts_(this.UW6__[w6]);
            score += this.ts_(this.BW1__[w2 + w3]);
            score += this.ts_(this.BW2__[w3 + w4]);
            score += this.ts_(this.BW3__[w4 + w5]);
            score += this.ts_(this.TW1__[w1 + w2 + w3]);
            score += this.ts_(this.TW2__[w2 + w3 + w4]);
            score += this.ts_(this.TW3__[w3 + w4 + w5]);
            score += this.ts_(this.TW4__[w4 + w5 + w6]);
            score += this.ts_(this.UC1__[c1]);
            score += this.ts_(this.UC2__[c2]);
            score += this.ts_(this.UC3__[c3]);
            score += this.ts_(this.UC4__[c4]);
            score += this.ts_(this.UC5__[c5]);
            score += this.ts_(this.UC6__[c6]);
            score += this.ts_(this.BC1__[c2 + c3]);
            score += this.ts_(this.BC2__[c3 + c4]);
            score += this.ts_(this.BC3__[c4 + c5]);
            score += this.ts_(this.TC1__[c1 + c2 + c3]);
            score += this.ts_(this.TC2__[c2 + c3 + c4]);
            score += this.ts_(this.TC3__[c3 + c4 + c5]);
            score += this.ts_(this.TC4__[c4 + c5 + c6]);
        //  score += this.ts_(this.TC5__[c4 + c5 + c6]);    
            score += this.ts_(this.UQ1__[p1 + c1]);
            score += this.ts_(this.UQ2__[p2 + c2]);
            score += this.ts_(this.UQ3__[p3 + c3]);
            score += this.ts_(this.BQ1__[p2 + c2 + c3]);
            score += this.ts_(this.BQ2__[p2 + c3 + c4]);
            score += this.ts_(this.BQ3__[p3 + c2 + c3]);
            score += this.ts_(this.BQ4__[p3 + c3 + c4]);
            score += this.ts_(this.TQ1__[p2 + c1 + c2 + c3]);
            score += this.ts_(this.TQ2__[p2 + c2 + c3 + c4]);
            score += this.ts_(this.TQ3__[p3 + c1 + c2 + c3]);
            score += this.ts_(this.TQ4__[p3 + c2 + c3 + c4]);
            var p = "O";
            if (score > 0) {
              result.push(word);
              word = "";
              p = "B";
            }
            p1 = p2;
            p2 = p3;
            p3 = p;
            word += seg[i];
          }
          result.push(word);

          return result;
        }

        lunr.TinySegmenter = TinySegmenter;
    };

}));/*!
 * Lunr languages, `German` language
 * https://github.com/MihaiValentin/lunr-languages
 *
 * Copyright 2014, Mihai Valentin
 * http://www.mozilla.org/MPL/
 */
/*!
 * based on
 * Snowball JavaScript Library v0.3
 * http://code.google.com/p/urim/
 * http://snowball.tartarus.org/
 *
 * Copyright 2010, Oleg Mazko
 * http://www.mozilla.org/MPL/
 */

/**
 * export the module via AMD, CommonJS or as a browser global
 * Export code from https://github.com/umdjs/umd/blob/master/returnExports.js
 */
;
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory)
  } else if (typeof exports === 'object') {
    /**
     * Node. Does not work with strict CommonJS, but
     * only CommonJS-like environments that support module.exports,
     * like Node.
     */
    module.exports = factory()
  } else {
    // Browser globals (root is window)
    factory()(root.lunr);
  }
}(this, function() {
  /**
   * Just return a value to define the module export.
   * This example returns an object, but the module
   * can return a function as the exported value.
   */
  return function(lunr) {
    /* throw error if lunr is not yet included */
    if ('undefined' === typeof lunr) {
      throw new Error('Lunr is not present. Please include / require Lunr before this script.');
    }

    /* throw error if lunr stemmer support is not yet included */
    if ('undefined' === typeof lunr.stemmerSupport) {
      throw new Error('Lunr stemmer support is not present. Please include / require Lunr stemmer support before this script.');
    }

    /* register specific locale function */
    lunr.de = function() {
      this.pipeline.reset();
      this.pipeline.add(
        lunr.de.trimmer,
        lunr.de.stopWordFilter,
        lunr.de.stemmer
      );

      // for lunr version 2
      // this is necessary so that every searched word is also stemmed before
      // in lunr <= 1 this is not needed, as it is done using the normal pipeline
      if (this.searchPipeline) {
        this.searchPipeline.reset();
        this.searchPipeline.add(lunr.de.stemmer)
      }
    };

    /* lunr trimmer function */
    lunr.de.wordCharacters = "A-Za-z\xAA\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02B8\u02E0-\u02E4\u1D00-\u1D25\u1D2C-\u1D5C\u1D62-\u1D65\u1D6B-\u1D77\u1D79-\u1DBE\u1E00-\u1EFF\u2071\u207F\u2090-\u209C\u212A\u212B\u2132\u214E\u2160-\u2188\u2C60-\u2C7F\uA722-\uA787\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA7FF\uAB30-\uAB5A\uAB5C-\uAB64\uFB00-\uFB06\uFF21-\uFF3A\uFF41-\uFF5A";
    lunr.de.trimmer = lunr.trimmerSupport.generateTrimmer(lunr.de.wordCharacters);

    lunr.Pipeline.registerFunction(lunr.de.trimmer, 'trimmer-de');

    /* lunr stemmer function */
    lunr.de.stemmer = (function() {
      /* create the wrapped stemmer object */
      var Among = lunr.stemmerSupport.Among,
        SnowballProgram = lunr.stemmerSupport.SnowballProgram,
        st = new function GermanStemmer() {
          var a_0 = [new Among("", -1, 6), new Among("U", 0, 2),
              new Among("Y", 0, 1), new Among("\u00E4", 0, 3),
              new Among("\u00F6", 0, 4), new Among("\u00FC", 0, 5)
            ],
            a_1 = [
              new Among("e", -1, 2), new Among("em", -1, 1),
              new Among("en", -1, 2), new Among("ern", -1, 1),
              new Among("er", -1, 1), new Among("s", -1, 3),
              new Among("es", 5, 2)
            ],
            a_2 = [new Among("en", -1, 1),
              new Among("er", -1, 1), new Among("st", -1, 2),
              new Among("est", 2, 1)
            ],
            a_3 = [new Among("ig", -1, 1),
              new Among("lich", -1, 1)
            ],
            a_4 = [new Among("end", -1, 1),
              new Among("ig", -1, 2), new Among("ung", -1, 1),
              new Among("lich", -1, 3), new Among("isch", -1, 2),
              new Among("ik", -1, 2), new Among("heit", -1, 3),
              new Among("keit", -1, 4)
            ],
            g_v = [17, 65, 16, 1, 0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0, 8, 0, 32, 8
            ],
            g_s_ending = [117, 30, 5],
            g_st_ending = [
              117, 30, 4
            ],
            I_x, I_p2, I_p1, sbp = new SnowballProgram();
          this.setCurrent = function(word) {
            sbp.setCurrent(word);
          };
          this.getCurrent = function() {
            return sbp.getCurrent();
          };

          function habr1(c1, c2, v_1) {
            if (sbp.eq_s(1, c1)) {
              sbp.ket = sbp.cursor;
              if (sbp.in_grouping(g_v, 97, 252)) {
                sbp.slice_from(c2);
                sbp.cursor = v_1;
                return true;
              }
            }
            return false;
          }

          function r_prelude() {
            var v_1 = sbp.cursor,
              v_2, v_3, v_4, v_5;
            while (true) {
              v_2 = sbp.cursor;
              sbp.bra = v_2;
              if (sbp.eq_s(1, "\u00DF")) {
                sbp.ket = sbp.cursor;
                sbp.slice_from("ss");
              } else {
                if (v_2 >= sbp.limit)
                  break;
                sbp.cursor = v_2 + 1;
              }
            }
            sbp.cursor = v_1;
            while (true) {
              v_3 = sbp.cursor;
              while (true) {
                v_4 = sbp.cursor;
                if (sbp.in_grouping(g_v, 97, 252)) {
                  v_5 = sbp.cursor;
                  sbp.bra = v_5;
                  if (habr1("u", "U", v_4))
                    break;
                  sbp.cursor = v_5;
                  if (habr1("y", "Y", v_4))
                    break;
                }
                if (v_4 >= sbp.limit) {
                  sbp.cursor = v_3;
                  return;
                }
                sbp.cursor = v_4 + 1;
              }
            }
          }

          function habr2() {
            while (!sbp.in_grouping(g_v, 97, 252)) {
              if (sbp.cursor >= sbp.limit)
                return true;
              sbp.cursor++;
            }
            while (!sbp.out_grouping(g_v, 97, 252)) {
              if (sbp.cursor >= sbp.limit)
                return true;
              sbp.cursor++;
            }
            return false;
          }

          function r_mark_regions() {
            I_p1 = sbp.limit;
            I_p2 = I_p1;
            var c = sbp.cursor + 3;
            if (0 <= c && c <= sbp.limit) {
              I_x = c;
              if (!habr2()) {
                I_p1 = sbp.cursor;
                if (I_p1 < I_x)
                  I_p1 = I_x;
                if (!habr2())
                  I_p2 = sbp.cursor;
              }
            }
          }

          function r_postlude() {
            var among_var, v_1;
            while (true) {
              v_1 = sbp.cursor;
              sbp.bra = v_1;
              among_var = sbp.find_among(a_0, 6);
              if (!among_var)
                return;
              sbp.ket = sbp.cursor;
              switch (among_var) {
                case 1:
                  sbp.slice_from("y");
                  break;
                case 2:
                case 5:
                  sbp.slice_from("u");
                  break;
                case 3:
                  sbp.slice_from("a");
                  break;
                case 4:
                  sbp.slice_from("o");
                  break;
                case 6:
                  if (sbp.cursor >= sbp.limit)
                    return;
                  sbp.cursor++;
                  break;
              }
            }
          }

          function r_R1() {
            return I_p1 <= sbp.cursor;
          }

          function r_R2() {
            return I_p2 <= sbp.cursor;
          }

          function r_standard_suffix() {
            var among_var, v_1 = sbp.limit - sbp.cursor,
              v_2, v_3, v_4;
            sbp.ket = sbp.cursor;
            among_var = sbp.find_among_b(a_1, 7);
            if (among_var) {
              sbp.bra = sbp.cursor;
              if (r_R1()) {
                switch (among_var) {
                  case 1:
                    sbp.slice_del();
                    break;
                  case 2:
                    sbp.slice_del();
                    sbp.ket = sbp.cursor;
                    if (sbp.eq_s_b(1, "s")) {
                      sbp.bra = sbp.cursor;
                      if (sbp.eq_s_b(3, "nis"))
                        sbp.slice_del();
                    }
                    break;
                  case 3:
                    if (sbp.in_grouping_b(g_s_ending, 98, 116))
                      sbp.slice_del();
                    break;
                }
              }
            }
            sbp.cursor = sbp.limit - v_1;
            sbp.ket = sbp.cursor;
            among_var = sbp.find_among_b(a_2, 4);
            if (among_var) {
              sbp.bra = sbp.cursor;
              if (r_R1()) {
                switch (among_var) {
                  case 1:
                    sbp.slice_del();
                    break;
                  case 2:
                    if (sbp.in_grouping_b(g_st_ending, 98, 116)) {
                      var c = sbp.cursor - 3;
                      if (sbp.limit_backward <= c && c <= sbp.limit) {
                        sbp.cursor = c;
                        sbp.slice_del();
                      }
                    }
                    break;
                }
              }
            }
            sbp.cursor = sbp.limit - v_1;
            sbp.ket = sbp.cursor;
            among_var = sbp.find_among_b(a_4, 8);
            if (among_var) {
              sbp.bra = sbp.cursor;
              if (r_R2()) {
                switch (among_var) {
                  case 1:
                    sbp.slice_del();
                    sbp.ket = sbp.cursor;
                    if (sbp.eq_s_b(2, "ig")) {
                      sbp.bra = sbp.cursor;
                      v_2 = sbp.limit - sbp.cursor;
                      if (!sbp.eq_s_b(1, "e")) {
                        sbp.cursor = sbp.limit - v_2;
                        if (r_R2())
                          sbp.slice_del();
                      }
                    }
                    break;
                  case 2:
                    v_3 = sbp.limit - sbp.cursor;
                    if (!sbp.eq_s_b(1, "e")) {
                      sbp.cursor = sbp.limit - v_3;
                      sbp.slice_del();
                    }
                    break;
                  case 3:
                    sbp.slice_del();
                    sbp.ket = sbp.cursor;
                    v_4 = sbp.limit - sbp.cursor;
                    if (!sbp.eq_s_b(2, "er")) {
                      sbp.cursor = sbp.limit - v_4;
                      if (!sbp.eq_s_b(2, "en"))
                        break;
                    }
                    sbp.bra = sbp.cursor;
                    if (r_R1())
                      sbp.slice_del();
                    break;
                  case 4:
                    sbp.slice_del();
                    sbp.ket = sbp.cursor;
                    among_var = sbp.find_among_b(a_3, 2);
                    if (among_var) {
                      sbp.bra = sbp.cursor;
                      if (r_R2() && among_var == 1)
                        sbp.slice_del();
                    }
                    break;
                }
              }
            }
          }
          this.stem = function() {
            var v_1 = sbp.cursor;
            r_prelude();
            sbp.cursor = v_1;
            r_mark_regions();
            sbp.limit_backward = v_1;
            sbp.cursor = sbp.limit;
            r_standard_suffix();
            sbp.cursor = sbp.limit_backward;
            r_postlude();
            return true;
          }
        };

      /* and return a function that stems a word for the current locale */
      return function(token) {
        // for lunr version 2
        if (typeof token.update === "function") {
          return token.update(function(word) {
            st.setCurrent(word);
            st.stem();
            return st.getCurrent();
          })
        } else { // for lunr version <= 1
          st.setCurrent(token);
          st.stem();
          return st.getCurrent();
        }
      }
    })();

    lunr.Pipeline.registerFunction(lunr.de.stemmer, 'stemmer-de');

    lunr.de.stopWordFilter = lunr.generateStopWordFilter('aber alle allem allen aller alles als also am an ander andere anderem anderen anderer anderes anderm andern anderr anders auch auf aus bei bin bis bist da damit dann das dasselbe dazu daß dein deine deinem deinen deiner deines dem demselben den denn denselben der derer derselbe derselben des desselben dessen dich die dies diese dieselbe dieselben diesem diesen dieser dieses dir doch dort du durch ein eine einem einen einer eines einig einige einigem einigen einiger einiges einmal er es etwas euch euer eure eurem euren eurer eures für gegen gewesen hab habe haben hat hatte hatten hier hin hinter ich ihm ihn ihnen ihr ihre ihrem ihren ihrer ihres im in indem ins ist jede jedem jeden jeder jedes jene jenem jenen jener jenes jetzt kann kein keine keinem keinen keiner keines können könnte machen man manche manchem manchen mancher manches mein meine meinem meinen meiner meines mich mir mit muss musste nach nicht nichts noch nun nur ob oder ohne sehr sein seine seinem seinen seiner seines selbst sich sie sind so solche solchem solchen solcher solches soll sollte sondern sonst um und uns unse unsem unsen unser unses unter viel vom von vor war waren warst was weg weil weiter welche welchem welchen welcher welches wenn werde werden wie wieder will wir wird wirst wo wollen wollte während würde würden zu zum zur zwar zwischen über'.split(' '));

    lunr.Pipeline.registerFunction(lunr.de.stopWordFilter, 'stopWordFilter-de');
  };
}))/*!
 * Lunr languages, `Spanish` language
 * https://github.com/MihaiValentin/lunr-languages
 *
 * Copyright 2014, Mihai Valentin
 * http://www.mozilla.org/MPL/
 */
/*!
 * based on
 * Snowball JavaScript Library v0.3
 * http://code.google.com/p/urim/
 * http://snowball.tartarus.org/
 *
 * Copyright 2010, Oleg Mazko
 * http://www.mozilla.org/MPL/
 */

/**
 * export the module via AMD, CommonJS or as a browser global
 * Export code from https://github.com/umdjs/umd/blob/master/returnExports.js
 */
;
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory)
  } else if (typeof exports === 'object') {
    /**
     * Node. Does not work with strict CommonJS, but
     * only CommonJS-like environments that support module.exports,
     * like Node.
     */
    module.exports = factory()
  } else {
    // Browser globals (root is window)
    factory()(root.lunr);
  }
}(this, function() {
  /**
   * Just return a value to define the module export.
   * This example returns an object, but the module
   * can return a function as the exported value.
   */
  return function(lunr) {
    /* throw error if lunr is not yet included */
    if ('undefined' === typeof lunr) {
      throw new Error('Lunr is not present. Please include / require Lunr before this script.');
    }

    /* throw error if lunr stemmer support is not yet included */
    if ('undefined' === typeof lunr.stemmerSupport) {
      throw new Error('Lunr stemmer support is not present. Please include / require Lunr stemmer support before this script.');
    }

    /* register specific locale function */
    lunr.es = function() {
      this.pipeline.reset();
      this.pipeline.add(
        lunr.es.trimmer,
        lunr.es.stopWordFilter,
        lunr.es.stemmer
      );

      // for lunr version 2
      // this is necessary so that every searched word is also stemmed before
      // in lunr <= 1 this is not needed, as it is done using the normal pipeline
      if (this.searchPipeline) {
        this.searchPipeline.reset();
        this.searchPipeline.add(lunr.es.stemmer)
      }
    };

    /* lunr trimmer function */
    lunr.es.wordCharacters = "A-Za-z\xAA\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02B8\u02E0-\u02E4\u1D00-\u1D25\u1D2C-\u1D5C\u1D62-\u1D65\u1D6B-\u1D77\u1D79-\u1DBE\u1E00-\u1EFF\u2071\u207F\u2090-\u209C\u212A\u212B\u2132\u214E\u2160-\u2188\u2C60-\u2C7F\uA722-\uA787\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA7FF\uAB30-\uAB5A\uAB5C-\uAB64\uFB00-\uFB06\uFF21-\uFF3A\uFF41-\uFF5A";
    lunr.es.trimmer = lunr.trimmerSupport.generateTrimmer(lunr.es.wordCharacters);

    lunr.Pipeline.registerFunction(lunr.es.trimmer, 'trimmer-es');

    /* lunr stemmer function */
    lunr.es.stemmer = (function() {
      /* create the wrapped stemmer object */
      var Among = lunr.stemmerSupport.Among,
        SnowballProgram = lunr.stemmerSupport.SnowballProgram,
        st = new function SpanishStemmer() {
          var a_0 = [new Among("", -1, 6), new Among("\u00E1", 0, 1),
              new Among("\u00E9", 0, 2), new Among("\u00ED", 0, 3),
              new Among("\u00F3", 0, 4), new Among("\u00FA", 0, 5)
            ],
            a_1 = [
              new Among("la", -1, -1), new Among("sela", 0, -1),
              new Among("le", -1, -1), new Among("me", -1, -1),
              new Among("se", -1, -1), new Among("lo", -1, -1),
              new Among("selo", 5, -1), new Among("las", -1, -1),
              new Among("selas", 7, -1), new Among("les", -1, -1),
              new Among("los", -1, -1), new Among("selos", 10, -1),
              new Among("nos", -1, -1)
            ],
            a_2 = [new Among("ando", -1, 6),
              new Among("iendo", -1, 6), new Among("yendo", -1, 7),
              new Among("\u00E1ndo", -1, 2), new Among("i\u00E9ndo", -1, 1),
              new Among("ar", -1, 6), new Among("er", -1, 6),
              new Among("ir", -1, 6), new Among("\u00E1r", -1, 3),
              new Among("\u00E9r", -1, 4), new Among("\u00EDr", -1, 5)
            ],
            a_3 = [
              new Among("ic", -1, -1), new Among("ad", -1, -1),
              new Among("os", -1, -1), new Among("iv", -1, 1)
            ],
            a_4 = [
              new Among("able", -1, 1), new Among("ible", -1, 1),
              new Among("ante", -1, 1)
            ],
            a_5 = [new Among("ic", -1, 1),
              new Among("abil", -1, 1), new Among("iv", -1, 1)
            ],
            a_6 = [
              new Among("ica", -1, 1), new Among("ancia", -1, 2),
              new Among("encia", -1, 5), new Among("adora", -1, 2),
              new Among("osa", -1, 1), new Among("ista", -1, 1),
              new Among("iva", -1, 9), new Among("anza", -1, 1),
              new Among("log\u00EDa", -1, 3), new Among("idad", -1, 8),
              new Among("able", -1, 1), new Among("ible", -1, 1),
              new Among("ante", -1, 2), new Among("mente", -1, 7),
              new Among("amente", 13, 6), new Among("aci\u00F3n", -1, 2),
              new Among("uci\u00F3n", -1, 4), new Among("ico", -1, 1),
              new Among("ismo", -1, 1), new Among("oso", -1, 1),
              new Among("amiento", -1, 1), new Among("imiento", -1, 1),
              new Among("ivo", -1, 9), new Among("ador", -1, 2),
              new Among("icas", -1, 1), new Among("ancias", -1, 2),
              new Among("encias", -1, 5), new Among("adoras", -1, 2),
              new Among("osas", -1, 1), new Among("istas", -1, 1),
              new Among("ivas", -1, 9), new Among("anzas", -1, 1),
              new Among("log\u00EDas", -1, 3), new Among("idades", -1, 8),
              new Among("ables", -1, 1), new Among("ibles", -1, 1),
              new Among("aciones", -1, 2), new Among("uciones", -1, 4),
              new Among("adores", -1, 2), new Among("antes", -1, 2),
              new Among("icos", -1, 1), new Among("ismos", -1, 1),
              new Among("osos", -1, 1), new Among("amientos", -1, 1),
              new Among("imientos", -1, 1), new Among("ivos", -1, 9)
            ],
            a_7 = [
              new Among("ya", -1, 1), new Among("ye", -1, 1),
              new Among("yan", -1, 1), new Among("yen", -1, 1),
              new Among("yeron", -1, 1), new Among("yendo", -1, 1),
              new Among("yo", -1, 1), new Among("yas", -1, 1),
              new Among("yes", -1, 1), new Among("yais", -1, 1),
              new Among("yamos", -1, 1), new Among("y\u00F3", -1, 1)
            ],
            a_8 = [
              new Among("aba", -1, 2), new Among("ada", -1, 2),
              new Among("ida", -1, 2), new Among("ara", -1, 2),
              new Among("iera", -1, 2), new Among("\u00EDa", -1, 2),
              new Among("ar\u00EDa", 5, 2), new Among("er\u00EDa", 5, 2),
              new Among("ir\u00EDa", 5, 2), new Among("ad", -1, 2),
              new Among("ed", -1, 2), new Among("id", -1, 2),
              new Among("ase", -1, 2), new Among("iese", -1, 2),
              new Among("aste", -1, 2), new Among("iste", -1, 2),
              new Among("an", -1, 2), new Among("aban", 16, 2),
              new Among("aran", 16, 2), new Among("ieran", 16, 2),
              new Among("\u00EDan", 16, 2), new Among("ar\u00EDan", 20, 2),
              new Among("er\u00EDan", 20, 2), new Among("ir\u00EDan", 20, 2),
              new Among("en", -1, 1), new Among("asen", 24, 2),
              new Among("iesen", 24, 2), new Among("aron", -1, 2),
              new Among("ieron", -1, 2), new Among("ar\u00E1n", -1, 2),
              new Among("er\u00E1n", -1, 2), new Among("ir\u00E1n", -1, 2),
              new Among("ado", -1, 2), new Among("ido", -1, 2),
              new Among("ando", -1, 2), new Among("iendo", -1, 2),
              new Among("ar", -1, 2), new Among("er", -1, 2),
              new Among("ir", -1, 2), new Among("as", -1, 2),
              new Among("abas", 39, 2), new Among("adas", 39, 2),
              new Among("idas", 39, 2), new Among("aras", 39, 2),
              new Among("ieras", 39, 2), new Among("\u00EDas", 39, 2),
              new Among("ar\u00EDas", 45, 2), new Among("er\u00EDas", 45, 2),
              new Among("ir\u00EDas", 45, 2), new Among("es", -1, 1),
              new Among("ases", 49, 2), new Among("ieses", 49, 2),
              new Among("abais", -1, 2), new Among("arais", -1, 2),
              new Among("ierais", -1, 2), new Among("\u00EDais", -1, 2),
              new Among("ar\u00EDais", 55, 2), new Among("er\u00EDais", 55, 2),
              new Among("ir\u00EDais", 55, 2), new Among("aseis", -1, 2),
              new Among("ieseis", -1, 2), new Among("asteis", -1, 2),
              new Among("isteis", -1, 2), new Among("\u00E1is", -1, 2),
              new Among("\u00E9is", -1, 1), new Among("ar\u00E9is", 64, 2),
              new Among("er\u00E9is", 64, 2), new Among("ir\u00E9is", 64, 2),
              new Among("ados", -1, 2), new Among("idos", -1, 2),
              new Among("amos", -1, 2), new Among("\u00E1bamos", 70, 2),
              new Among("\u00E1ramos", 70, 2), new Among("i\u00E9ramos", 70, 2),
              new Among("\u00EDamos", 70, 2), new Among("ar\u00EDamos", 74, 2),
              new Among("er\u00EDamos", 74, 2), new Among("ir\u00EDamos", 74, 2),
              new Among("emos", -1, 1), new Among("aremos", 78, 2),
              new Among("eremos", 78, 2), new Among("iremos", 78, 2),
              new Among("\u00E1semos", 78, 2), new Among("i\u00E9semos", 78, 2),
              new Among("imos", -1, 2), new Among("ar\u00E1s", -1, 2),
              new Among("er\u00E1s", -1, 2), new Among("ir\u00E1s", -1, 2),
              new Among("\u00EDs", -1, 2), new Among("ar\u00E1", -1, 2),
              new Among("er\u00E1", -1, 2), new Among("ir\u00E1", -1, 2),
              new Among("ar\u00E9", -1, 2), new Among("er\u00E9", -1, 2),
              new Among("ir\u00E9", -1, 2), new Among("i\u00F3", -1, 2)
            ],
            a_9 = [
              new Among("a", -1, 1), new Among("e", -1, 2),
              new Among("o", -1, 1), new Among("os", -1, 1),
              new Among("\u00E1", -1, 1), new Among("\u00E9", -1, 2),
              new Among("\u00ED", -1, 1), new Among("\u00F3", -1, 1)
            ],
            g_v = [17,
              65, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 17, 4, 10
            ],
            I_p2, I_p1, I_pV, sbp = new SnowballProgram();
          this.setCurrent = function(word) {
            sbp.setCurrent(word);
          };
          this.getCurrent = function() {
            return sbp.getCurrent();
          };

          function habr1() {
            if (sbp.out_grouping(g_v, 97, 252)) {
              while (!sbp.in_grouping(g_v, 97, 252)) {
                if (sbp.cursor >= sbp.limit)
                  return true;
                sbp.cursor++;
              }
              return false;
            }
            return true;
          }

          function habr2() {
            if (sbp.in_grouping(g_v, 97, 252)) {
              var v_1 = sbp.cursor;
              if (habr1()) {
                sbp.cursor = v_1;
                if (!sbp.in_grouping(g_v, 97, 252))
                  return true;
                while (!sbp.out_grouping(g_v, 97, 252)) {
                  if (sbp.cursor >= sbp.limit)
                    return true;
                  sbp.cursor++;
                }
              }
              return false;
            }
            return true;
          }

          function habr3() {
            var v_1 = sbp.cursor,
              v_2;
            if (habr2()) {
              sbp.cursor = v_1;
              if (!sbp.out_grouping(g_v, 97, 252))
                return;
              v_2 = sbp.cursor;
              if (habr1()) {
                sbp.cursor = v_2;
                if (!sbp.in_grouping(g_v, 97, 252) || sbp.cursor >= sbp.limit)
                  return;
                sbp.cursor++;
              }
            }
            I_pV = sbp.cursor;
          }

          function habr4() {
            while (!sbp.in_grouping(g_v, 97, 252)) {
              if (sbp.cursor >= sbp.limit)
                return false;
              sbp.cursor++;
            }
            while (!sbp.out_grouping(g_v, 97, 252)) {
              if (sbp.cursor >= sbp.limit)
                return false;
              sbp.cursor++;
            }
            return true;
          }

          function r_mark_regions() {
            var v_1 = sbp.cursor;
            I_pV = sbp.limit;
            I_p1 = I_pV;
            I_p2 = I_pV;
            habr3();
            sbp.cursor = v_1;
            if (habr4()) {
              I_p1 = sbp.cursor;
              if (habr4())
                I_p2 = sbp.cursor;
            }
          }

          function r_postlude() {
            var among_var;
            while (true) {
              sbp.bra = sbp.cursor;
              among_var = sbp.find_among(a_0, 6);
              if (among_var) {
                sbp.ket = sbp.cursor;
                switch (among_var) {
                  case 1:
                    sbp.slice_from("a");
                    continue;
                  case 2:
                    sbp.slice_from("e");
                    continue;
                  case 3:
                    sbp.slice_from("i");
                    continue;
                  case 4:
                    sbp.slice_from("o");
                    continue;
                  case 5:
                    sbp.slice_from("u");
                    continue;
                  case 6:
                    if (sbp.cursor >= sbp.limit)
                      break;
                    sbp.cursor++;
                    continue;
                }
              }
              break;
            }
          }

          function r_RV() {
            return I_pV <= sbp.cursor;
          }

          function r_R1() {
            return I_p1 <= sbp.cursor;
          }

          function r_R2() {
            return I_p2 <= sbp.cursor;
          }

          function r_attached_pronoun() {
            var among_var;
            sbp.ket = sbp.cursor;
            if (sbp.find_among_b(a_1, 13)) {
              sbp.bra = sbp.cursor;
              among_var = sbp.find_among_b(a_2, 11);
              if (among_var && r_RV())
                switch (among_var) {
                  case 1:
                    sbp.bra = sbp.cursor;
                    sbp.slice_from("iendo");
                    break;
                  case 2:
                    sbp.bra = sbp.cursor;
                    sbp.slice_from("ando");
                    break;
                  case 3:
                    sbp.bra = sbp.cursor;
                    sbp.slice_from("ar");
                    break;
                  case 4:
                    sbp.bra = sbp.cursor;
                    sbp.slice_from("er");
                    break;
                  case 5:
                    sbp.bra = sbp.cursor;
                    sbp.slice_from("ir");
                    break;
                  case 6:
                    sbp.slice_del();
                    break;
                  case 7:
                    if (sbp.eq_s_b(1, "u"))
                      sbp.slice_del();
                    break;
                }
            }
          }

          function habr5(a, n) {
            if (!r_R2())
              return true;
            sbp.slice_del();
            sbp.ket = sbp.cursor;
            var among_var = sbp.find_among_b(a, n);
            if (among_var) {
              sbp.bra = sbp.cursor;
              if (among_var == 1 && r_R2())
                sbp.slice_del();
            }
            return false;
          }

          function habr6(c1) {
            if (!r_R2())
              return true;
            sbp.slice_del();
            sbp.ket = sbp.cursor;
            if (sbp.eq_s_b(2, c1)) {
              sbp.bra = sbp.cursor;
              if (r_R2())
                sbp.slice_del();
            }
            return false;
          }

          function r_standard_suffix() {
            var among_var;
            sbp.ket = sbp.cursor;
            among_var = sbp.find_among_b(a_6, 46);
            if (among_var) {
              sbp.bra = sbp.cursor;
              switch (among_var) {
                case 1:
                  if (!r_R2())
                    return false;
                  sbp.slice_del();
                  break;
                case 2:
                  if (habr6("ic"))
                    return false;
                  break;
                case 3:
                  if (!r_R2())
                    return false;
                  sbp.slice_from("log");
                  break;
                case 4:
                  if (!r_R2())
                    return false;
                  sbp.slice_from("u");
                  break;
                case 5:
                  if (!r_R2())
                    return false;
                  sbp.slice_from("ente");
                  break;
                case 6:
                  if (!r_R1())
                    return false;
                  sbp.slice_del();
                  sbp.ket = sbp.cursor;
                  among_var = sbp.find_among_b(a_3, 4);
                  if (among_var) {
                    sbp.bra = sbp.cursor;
                    if (r_R2()) {
                      sbp.slice_del();
                      if (among_var == 1) {
                        sbp.ket = sbp.cursor;
                        if (sbp.eq_s_b(2, "at")) {
                          sbp.bra = sbp.cursor;
                          if (r_R2())
                            sbp.slice_del();
                        }
                      }
                    }
                  }
                  break;
                case 7:
                  if (habr5(a_4, 3))
                    return false;
                  break;
                case 8:
                  if (habr5(a_5, 3))
                    return false;
                  break;
                case 9:
                  if (habr6("at"))
                    return false;
                  break;
              }
              return true;
            }
            return false;
          }

          function r_y_verb_suffix() {
            var among_var, v_1;
            if (sbp.cursor >= I_pV) {
              v_1 = sbp.limit_backward;
              sbp.limit_backward = I_pV;
              sbp.ket = sbp.cursor;
              among_var = sbp.find_among_b(a_7, 12);
              sbp.limit_backward = v_1;
              if (among_var) {
                sbp.bra = sbp.cursor;
                if (among_var == 1) {
                  if (!sbp.eq_s_b(1, "u"))
                    return false;
                  sbp.slice_del();
                }
                return true;
              }
            }
            return false;
          }

          function r_verb_suffix() {
            var among_var, v_1, v_2, v_3;
            if (sbp.cursor >= I_pV) {
              v_1 = sbp.limit_backward;
              sbp.limit_backward = I_pV;
              sbp.ket = sbp.cursor;
              among_var = sbp.find_among_b(a_8, 96);
              sbp.limit_backward = v_1;
              if (among_var) {
                sbp.bra = sbp.cursor;
                switch (among_var) {
                  case 1:
                    v_2 = sbp.limit - sbp.cursor;
                    if (sbp.eq_s_b(1, "u")) {
                      v_3 = sbp.limit - sbp.cursor;
                      if (sbp.eq_s_b(1, "g"))
                        sbp.cursor = sbp.limit - v_3;
                      else
                        sbp.cursor = sbp.limit - v_2;
                    } else
                      sbp.cursor = sbp.limit - v_2;
                    sbp.bra = sbp.cursor;
                  case 2:
                    sbp.slice_del();
                    break;
                }
              }
            }
          }

          function r_residual_suffix() {
            var among_var, v_1;
            sbp.ket = sbp.cursor;
            among_var = sbp.find_among_b(a_9, 8);
            if (among_var) {
              sbp.bra = sbp.cursor;
              switch (among_var) {
                case 1:
                  if (r_RV())
                    sbp.slice_del();
                  break;
                case 2:
                  if (r_RV()) {
                    sbp.slice_del();
                    sbp.ket = sbp.cursor;
                    if (sbp.eq_s_b(1, "u")) {
                      sbp.bra = sbp.cursor;
                      v_1 = sbp.limit - sbp.cursor;
                      if (sbp.eq_s_b(1, "g")) {
                        sbp.cursor = sbp.limit - v_1;
                        if (r_RV())
                          sbp.slice_del();
                      }
                    }
                  }
                  break;
              }
            }
          }
          this.stem = function() {
            var v_1 = sbp.cursor;
            r_mark_regions();
            sbp.limit_backward = v_1;
            sbp.cursor = sbp.limit;
            r_attached_pronoun();
            sbp.cursor = sbp.limit;
            if (!r_standard_suffix()) {
              sbp.cursor = sbp.limit;
              if (!r_y_verb_suffix()) {
                sbp.cursor = sbp.limit;
                r_verb_suffix();
              }
            }
            sbp.cursor = sbp.limit;
            r_residual_suffix();
            sbp.cursor = sbp.limit_backward;
            r_postlude();
            return true;
          }
        };

      /* and return a function that stems a word for the current locale */
      return function(token) {
        // for lunr version 2
        if (typeof token.update === "function") {
          return token.update(function(word) {
            st.setCurrent(word);
            st.stem();
            return st.getCurrent();
          })
        } else { // for lunr version <= 1
          st.setCurrent(token);
          st.stem();
          return st.getCurrent();
        }
      }
    })();

    lunr.Pipeline.registerFunction(lunr.es.stemmer, 'stemmer-es');

    lunr.es.stopWordFilter = lunr.generateStopWordFilter('a al algo algunas algunos ante antes como con contra cual cuando de del desde donde durante e el ella ellas ellos en entre era erais eran eras eres es esa esas ese eso esos esta estaba estabais estaban estabas estad estada estadas estado estados estamos estando estar estaremos estará estarán estarás estaré estaréis estaría estaríais estaríamos estarían estarías estas este estemos esto estos estoy estuve estuviera estuvierais estuvieran estuvieras estuvieron estuviese estuvieseis estuviesen estuvieses estuvimos estuviste estuvisteis estuviéramos estuviésemos estuvo está estábamos estáis están estás esté estéis estén estés fue fuera fuerais fueran fueras fueron fuese fueseis fuesen fueses fui fuimos fuiste fuisteis fuéramos fuésemos ha habida habidas habido habidos habiendo habremos habrá habrán habrás habré habréis habría habríais habríamos habrían habrías habéis había habíais habíamos habían habías han has hasta hay haya hayamos hayan hayas hayáis he hemos hube hubiera hubierais hubieran hubieras hubieron hubiese hubieseis hubiesen hubieses hubimos hubiste hubisteis hubiéramos hubiésemos hubo la las le les lo los me mi mis mucho muchos muy más mí mía mías mío míos nada ni no nos nosotras nosotros nuestra nuestras nuestro nuestros o os otra otras otro otros para pero poco por porque que quien quienes qué se sea seamos sean seas seremos será serán serás seré seréis sería seríais seríamos serían serías seáis sido siendo sin sobre sois somos son soy su sus suya suyas suyo suyos sí también tanto te tendremos tendrá tendrán tendrás tendré tendréis tendría tendríais tendríamos tendrían tendrías tened tenemos tenga tengamos tengan tengas tengo tengáis tenida tenidas tenido tenidos teniendo tenéis tenía teníais teníamos tenían tenías ti tiene tienen tienes todo todos tu tus tuve tuviera tuvierais tuvieran tuvieras tuvieron tuviese tuvieseis tuviesen tuvieses tuvimos tuviste tuvisteis tuviéramos tuviésemos tuvo tuya tuyas tuyo tuyos tú un una uno unos vosotras vosotros vuestra vuestras vuestro vuestros y ya yo él éramos'.split(' '));

    lunr.Pipeline.registerFunction(lunr.es.stopWordFilter, 'stopWordFilter-es');
  };
}))/*!
 * Lunr languages, `French` language
 * https://github.com/MihaiValentin/lunr-languages
 *
 * Copyright 2014, Mihai Valentin
 * http://www.mozilla.org/MPL/
 */
/*!
 * based on
 * Snowball JavaScript Library v0.3
 * http://code.google.com/p/urim/
 * http://snowball.tartarus.org/
 *
 * Copyright 2010, Oleg Mazko
 * http://www.mozilla.org/MPL/
 */

/**
 * export the module via AMD, CommonJS or as a browser global
 * Export code from https://github.com/umdjs/umd/blob/master/returnExports.js
 */
;
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory)
  } else if (typeof exports === 'object') {
    /**
     * Node. Does not work with strict CommonJS, but
     * only CommonJS-like environments that support module.exports,
     * like Node.
     */
    module.exports = factory()
  } else {
    // Browser globals (root is window)
    factory()(root.lunr);
  }
}(this, function() {
  /**
   * Just return a value to define the module export.
   * This example returns an object, but the module
   * can return a function as the exported value.
   */
  return function(lunr) {
    /* throw error if lunr is not yet included */
    if ('undefined' === typeof lunr) {
      throw new Error('Lunr is not present. Please include / require Lunr before this script.');
    }

    /* throw error if lunr stemmer support is not yet included */
    if ('undefined' === typeof lunr.stemmerSupport) {
      throw new Error('Lunr stemmer support is not present. Please include / require Lunr stemmer support before this script.');
    }

    /* register specific locale function */
    lunr.fr = function() {
      this.pipeline.reset();
      this.pipeline.add(
        lunr.fr.trimmer,
        lunr.fr.stopWordFilter,
        lunr.fr.stemmer
      );

      // for lunr version 2
      // this is necessary so that every searched word is also stemmed before
      // in lunr <= 1 this is not needed, as it is done using the normal pipeline
      if (this.searchPipeline) {
        this.searchPipeline.reset();
        this.searchPipeline.add(lunr.fr.stemmer)
      }
    };

    /* lunr trimmer function */
    lunr.fr.wordCharacters = "A-Za-z\xAA\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02B8\u02E0-\u02E4\u1D00-\u1D25\u1D2C-\u1D5C\u1D62-\u1D65\u1D6B-\u1D77\u1D79-\u1DBE\u1E00-\u1EFF\u2071\u207F\u2090-\u209C\u212A\u212B\u2132\u214E\u2160-\u2188\u2C60-\u2C7F\uA722-\uA787\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA7FF\uAB30-\uAB5A\uAB5C-\uAB64\uFB00-\uFB06\uFF21-\uFF3A\uFF41-\uFF5A";
    lunr.fr.trimmer = lunr.trimmerSupport.generateTrimmer(lunr.fr.wordCharacters);

    lunr.Pipeline.registerFunction(lunr.fr.trimmer, 'trimmer-fr');

    /* lunr stemmer function */
    lunr.fr.stemmer = (function() {
      /* create the wrapped stemmer object */
      var Among = lunr.stemmerSupport.Among,
        SnowballProgram = lunr.stemmerSupport.SnowballProgram,
        st = new function FrenchStemmer() {
          var a_0 = [new Among("col", -1, -1), new Among("par", -1, -1),
              new Among("tap", -1, -1)
            ],
            a_1 = [new Among("", -1, 4),
              new Among("I", 0, 1), new Among("U", 0, 2), new Among("Y", 0, 3)
            ],
            a_2 = [
              new Among("iqU", -1, 3), new Among("abl", -1, 3),
              new Among("I\u00E8r", -1, 4), new Among("i\u00E8r", -1, 4),
              new Among("eus", -1, 2), new Among("iv", -1, 1)
            ],
            a_3 = [
              new Among("ic", -1, 2), new Among("abil", -1, 1),
              new Among("iv", -1, 3)
            ],
            a_4 = [new Among("iqUe", -1, 1),
              new Among("atrice", -1, 2), new Among("ance", -1, 1),
              new Among("ence", -1, 5), new Among("logie", -1, 3),
              new Among("able", -1, 1), new Among("isme", -1, 1),
              new Among("euse", -1, 11), new Among("iste", -1, 1),
              new Among("ive", -1, 8), new Among("if", -1, 8),
              new Among("usion", -1, 4), new Among("ation", -1, 2),
              new Among("ution", -1, 4), new Among("ateur", -1, 2),
              new Among("iqUes", -1, 1), new Among("atrices", -1, 2),
              new Among("ances", -1, 1), new Among("ences", -1, 5),
              new Among("logies", -1, 3), new Among("ables", -1, 1),
              new Among("ismes", -1, 1), new Among("euses", -1, 11),
              new Among("istes", -1, 1), new Among("ives", -1, 8),
              new Among("ifs", -1, 8), new Among("usions", -1, 4),
              new Among("ations", -1, 2), new Among("utions", -1, 4),
              new Among("ateurs", -1, 2), new Among("ments", -1, 15),
              new Among("ements", 30, 6), new Among("issements", 31, 12),
              new Among("it\u00E9s", -1, 7), new Among("ment", -1, 15),
              new Among("ement", 34, 6), new Among("issement", 35, 12),
              new Among("amment", 34, 13), new Among("emment", 34, 14),
              new Among("aux", -1, 10), new Among("eaux", 39, 9),
              new Among("eux", -1, 1), new Among("it\u00E9", -1, 7)
            ],
            a_5 = [
              new Among("ira", -1, 1), new Among("ie", -1, 1),
              new Among("isse", -1, 1), new Among("issante", -1, 1),
              new Among("i", -1, 1), new Among("irai", 4, 1),
              new Among("ir", -1, 1), new Among("iras", -1, 1),
              new Among("ies", -1, 1), new Among("\u00EEmes", -1, 1),
              new Among("isses", -1, 1), new Among("issantes", -1, 1),
              new Among("\u00EEtes", -1, 1), new Among("is", -1, 1),
              new Among("irais", 13, 1), new Among("issais", 13, 1),
              new Among("irions", -1, 1), new Among("issions", -1, 1),
              new Among("irons", -1, 1), new Among("issons", -1, 1),
              new Among("issants", -1, 1), new Among("it", -1, 1),
              new Among("irait", 21, 1), new Among("issait", 21, 1),
              new Among("issant", -1, 1), new Among("iraIent", -1, 1),
              new Among("issaIent", -1, 1), new Among("irent", -1, 1),
              new Among("issent", -1, 1), new Among("iront", -1, 1),
              new Among("\u00EEt", -1, 1), new Among("iriez", -1, 1),
              new Among("issiez", -1, 1), new Among("irez", -1, 1),
              new Among("issez", -1, 1)
            ],
            a_6 = [new Among("a", -1, 3),
              new Among("era", 0, 2), new Among("asse", -1, 3),
              new Among("ante", -1, 3), new Among("\u00E9e", -1, 2),
              new Among("ai", -1, 3), new Among("erai", 5, 2),
              new Among("er", -1, 2), new Among("as", -1, 3),
              new Among("eras", 8, 2), new Among("\u00E2mes", -1, 3),
              new Among("asses", -1, 3), new Among("antes", -1, 3),
              new Among("\u00E2tes", -1, 3), new Among("\u00E9es", -1, 2),
              new Among("ais", -1, 3), new Among("erais", 15, 2),
              new Among("ions", -1, 1), new Among("erions", 17, 2),
              new Among("assions", 17, 3), new Among("erons", -1, 2),
              new Among("ants", -1, 3), new Among("\u00E9s", -1, 2),
              new Among("ait", -1, 3), new Among("erait", 23, 2),
              new Among("ant", -1, 3), new Among("aIent", -1, 3),
              new Among("eraIent", 26, 2), new Among("\u00E8rent", -1, 2),
              new Among("assent", -1, 3), new Among("eront", -1, 2),
              new Among("\u00E2t", -1, 3), new Among("ez", -1, 2),
              new Among("iez", 32, 2), new Among("eriez", 33, 2),
              new Among("assiez", 33, 3), new Among("erez", 32, 2),
              new Among("\u00E9", -1, 2)
            ],
            a_7 = [new Among("e", -1, 3),
              new Among("I\u00E8re", 0, 2), new Among("i\u00E8re", 0, 2),
              new Among("ion", -1, 1), new Among("Ier", -1, 2),
              new Among("ier", -1, 2), new Among("\u00EB", -1, 4)
            ],
            a_8 = [
              new Among("ell", -1, -1), new Among("eill", -1, -1),
              new Among("enn", -1, -1), new Among("onn", -1, -1),
              new Among("ett", -1, -1)
            ],
            g_v = [17, 65, 16, 1, 0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 128, 130, 103, 8, 5
            ],
            g_keep_with_s = [1, 65, 20, 0,
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128
            ],
            I_p2, I_p1, I_pV, sbp = new SnowballProgram();
          this.setCurrent = function(word) {
            sbp.setCurrent(word);
          };
          this.getCurrent = function() {
            return sbp.getCurrent();
          };

          function habr1(c1, c2, v_1) {
            if (sbp.eq_s(1, c1)) {
              sbp.ket = sbp.cursor;
              if (sbp.in_grouping(g_v, 97, 251)) {
                sbp.slice_from(c2);
                sbp.cursor = v_1;
                return true;
              }
            }
            return false;
          }

          function habr2(c1, c2, v_1) {
            if (sbp.eq_s(1, c1)) {
              sbp.ket = sbp.cursor;
              sbp.slice_from(c2);
              sbp.cursor = v_1;
              return true;
            }
            return false;
          }

          function r_prelude() {
            var v_1, v_2;
            while (true) {
              v_1 = sbp.cursor;
              if (sbp.in_grouping(g_v, 97, 251)) {
                sbp.bra = sbp.cursor;
                v_2 = sbp.cursor;
                if (habr1("u", "U", v_1))
                  continue;
                sbp.cursor = v_2;
                if (habr1("i", "I", v_1))
                  continue;
                sbp.cursor = v_2;
                if (habr2("y", "Y", v_1))
                  continue;
              }
              sbp.cursor = v_1;
              sbp.bra = v_1;
              if (!habr1("y", "Y", v_1)) {
                sbp.cursor = v_1;
                if (sbp.eq_s(1, "q")) {
                  sbp.bra = sbp.cursor;
                  if (habr2("u", "U", v_1))
                    continue;
                }
                sbp.cursor = v_1;
                if (v_1 >= sbp.limit)
                  return;
                sbp.cursor++;
              }
            }
          }

          function habr3() {
            while (!sbp.in_grouping(g_v, 97, 251)) {
              if (sbp.cursor >= sbp.limit)
                return true;
              sbp.cursor++;
            }
            while (!sbp.out_grouping(g_v, 97, 251)) {
              if (sbp.cursor >= sbp.limit)
                return true;
              sbp.cursor++;
            }
            return false;
          }

          function r_mark_regions() {
            var v_1 = sbp.cursor;
            I_pV = sbp.limit;
            I_p1 = I_pV;
            I_p2 = I_pV;
            if (sbp.in_grouping(g_v, 97, 251) && sbp.in_grouping(g_v, 97, 251) &&
              sbp.cursor < sbp.limit)
              sbp.cursor++;
            else {
              sbp.cursor = v_1;
              if (!sbp.find_among(a_0, 3)) {
                sbp.cursor = v_1;
                do {
                  if (sbp.cursor >= sbp.limit) {
                    sbp.cursor = I_pV;
                    break;
                  }
                  sbp.cursor++;
                } while (!sbp.in_grouping(g_v, 97, 251));
              }
            }
            I_pV = sbp.cursor;
            sbp.cursor = v_1;
            if (!habr3()) {
              I_p1 = sbp.cursor;
              if (!habr3())
                I_p2 = sbp.cursor;
            }
          }

          function r_postlude() {
            var among_var, v_1;
            while (true) {
              v_1 = sbp.cursor;
              sbp.bra = v_1;
              among_var = sbp.find_among(a_1, 4);
              if (!among_var)
                break;
              sbp.ket = sbp.cursor;
              switch (among_var) {
                case 1:
                  sbp.slice_from("i");
                  break;
                case 2:
                  sbp.slice_from("u");
                  break;
                case 3:
                  sbp.slice_from("y");
                  break;
                case 4:
                  if (sbp.cursor >= sbp.limit)
                    return;
                  sbp.cursor++;
                  break;
              }
            }
          }

          function r_RV() {
            return I_pV <= sbp.cursor;
          }

          function r_R1() {
            return I_p1 <= sbp.cursor;
          }

          function r_R2() {
            return I_p2 <= sbp.cursor;
          }

          function r_standard_suffix() {
            var among_var, v_1;
            sbp.ket = sbp.cursor;
            among_var = sbp.find_among_b(a_4, 43);
            if (among_var) {
              sbp.bra = sbp.cursor;
              switch (among_var) {
                case 1:
                  if (!r_R2())
                    return false;
                  sbp.slice_del();
                  break;
                case 2:
                  if (!r_R2())
                    return false;
                  sbp.slice_del();
                  sbp.ket = sbp.cursor;
                  if (sbp.eq_s_b(2, "ic")) {
                    sbp.bra = sbp.cursor;
                    if (!r_R2())
                      sbp.slice_from("iqU");
                    else
                      sbp.slice_del();
                  }
                  break;
                case 3:
                  if (!r_R2())
                    return false;
                  sbp.slice_from("log");
                  break;
                case 4:
                  if (!r_R2())
                    return false;
                  sbp.slice_from("u");
                  break;
                case 5:
                  if (!r_R2())
                    return false;
                  sbp.slice_from("ent");
                  break;
                case 6:
                  if (!r_RV())
                    return false;
                  sbp.slice_del();
                  sbp.ket = sbp.cursor;
                  among_var = sbp.find_among_b(a_2, 6);
                  if (among_var) {
                    sbp.bra = sbp.cursor;
                    switch (among_var) {
                      case 1:
                        if (r_R2()) {
                          sbp.slice_del();
                          sbp.ket = sbp.cursor;
                          if (sbp.eq_s_b(2, "at")) {
                            sbp.bra = sbp.cursor;
                            if (r_R2())
                              sbp.slice_del();
                          }
                        }
                        break;
                      case 2:
                        if (r_R2())
                          sbp.slice_del();
                        else if (r_R1())
                          sbp.slice_from("eux");
                        break;
                      case 3:
                        if (r_R2())
                          sbp.slice_del();
                        break;
                      case 4:
                        if (r_RV())
                          sbp.slice_from("i");
                        break;
                    }
                  }
                  break;
                case 7:
                  if (!r_R2())
                    return false;
                  sbp.slice_del();
                  sbp.ket = sbp.cursor;
                  among_var = sbp.find_among_b(a_3, 3);
                  if (among_var) {
                    sbp.bra = sbp.cursor;
                    switch (among_var) {
                      case 1:
                        if (r_R2())
                          sbp.slice_del();
                        else
                          sbp.slice_from("abl");
                        break;
                      case 2:
                        if (r_R2())
                          sbp.slice_del();
                        else
                          sbp.slice_from("iqU");
                        break;
                      case 3:
                        if (r_R2())
                          sbp.slice_del();
                        break;
                    }
                  }
                  break;
                case 8:
                  if (!r_R2())
                    return false;
                  sbp.slice_del();
                  sbp.ket = sbp.cursor;
                  if (sbp.eq_s_b(2, "at")) {
                    sbp.bra = sbp.cursor;
                    if (r_R2()) {
                      sbp.slice_del();
                      sbp.ket = sbp.cursor;
                      if (sbp.eq_s_b(2, "ic")) {
                        sbp.bra = sbp.cursor;
                        if (r_R2())
                          sbp.slice_del();
                        else
                          sbp.slice_from("iqU");
                        break;
                      }
                    }
                  }
                  break;
                case 9:
                  sbp.slice_from("eau");
                  break;
                case 10:
                  if (!r_R1())
                    return false;
                  sbp.slice_from("al");
                  break;
                case 11:
                  if (r_R2())
                    sbp.slice_del();
                  else if (!r_R1())
                    return false;
                  else
                    sbp.slice_from("eux");
                  break;
                case 12:
                  if (!r_R1() || !sbp.out_grouping_b(g_v, 97, 251))
                    return false;
                  sbp.slice_del();
                  break;
                case 13:
                  if (r_RV())
                    sbp.slice_from("ant");
                  return false;
                case 14:
                  if (r_RV())
                    sbp.slice_from("ent");
                  return false;
                case 15:
                  v_1 = sbp.limit - sbp.cursor;
                  if (sbp.in_grouping_b(g_v, 97, 251) && r_RV()) {
                    sbp.cursor = sbp.limit - v_1;
                    sbp.slice_del();
                  }
                  return false;
              }
              return true;
            }
            return false;
          }

          function r_i_verb_suffix() {
            var among_var, v_1;
            if (sbp.cursor < I_pV)
              return false;
            v_1 = sbp.limit_backward;
            sbp.limit_backward = I_pV;
            sbp.ket = sbp.cursor;
            among_var = sbp.find_among_b(a_5, 35);
            if (!among_var) {
              sbp.limit_backward = v_1;
              return false;
            }
            sbp.bra = sbp.cursor;
            if (among_var == 1) {
              if (!sbp.out_grouping_b(g_v, 97, 251)) {
                sbp.limit_backward = v_1;
                return false;
              }
              sbp.slice_del();
            }
            sbp.limit_backward = v_1;
            return true;
          }

          function r_verb_suffix() {
            var among_var, v_2, v_3;
            if (sbp.cursor < I_pV)
              return false;
            v_2 = sbp.limit_backward;
            sbp.limit_backward = I_pV;
            sbp.ket = sbp.cursor;
            among_var = sbp.find_among_b(a_6, 38);
            if (!among_var) {
              sbp.limit_backward = v_2;
              return false;
            }
            sbp.bra = sbp.cursor;
            switch (among_var) {
              case 1:
                if (!r_R2()) {
                  sbp.limit_backward = v_2;
                  return false;
                }
                sbp.slice_del();
                break;
              case 2:
                sbp.slice_del();
                break;
              case 3:
                sbp.slice_del();
                v_3 = sbp.limit - sbp.cursor;
                sbp.ket = sbp.cursor;
                if (sbp.eq_s_b(1, "e")) {
                  sbp.bra = sbp.cursor;
                  sbp.slice_del();
                } else
                  sbp.cursor = sbp.limit - v_3;
                break;
            }
            sbp.limit_backward = v_2;
            return true;
          }

          function r_residual_suffix() {
            var among_var, v_1 = sbp.limit - sbp.cursor,
              v_2, v_4, v_5;
            sbp.ket = sbp.cursor;
            if (sbp.eq_s_b(1, "s")) {
              sbp.bra = sbp.cursor;
              v_2 = sbp.limit - sbp.cursor;
              if (sbp.out_grouping_b(g_keep_with_s, 97, 232)) {
                sbp.cursor = sbp.limit - v_2;
                sbp.slice_del();
              } else
                sbp.cursor = sbp.limit - v_1;
            } else
              sbp.cursor = sbp.limit - v_1;
            if (sbp.cursor >= I_pV) {
              v_4 = sbp.limit_backward;
              sbp.limit_backward = I_pV;
              sbp.ket = sbp.cursor;
              among_var = sbp.find_among_b(a_7, 7);
              if (among_var) {
                sbp.bra = sbp.cursor;
                switch (among_var) {
                  case 1:
                    if (r_R2()) {
                      v_5 = sbp.limit - sbp.cursor;
                      if (!sbp.eq_s_b(1, "s")) {
                        sbp.cursor = sbp.limit - v_5;
                        if (!sbp.eq_s_b(1, "t"))
                          break;
                      }
                      sbp.slice_del();
                    }
                    break;
                  case 2:
                    sbp.slice_from("i");
                    break;
                  case 3:
                    sbp.slice_del();
                    break;
                  case 4:
                    if (sbp.eq_s_b(2, "gu"))
                      sbp.slice_del();
                    break;
                }
              }
              sbp.limit_backward = v_4;
            }
          }

          function r_un_double() {
            var v_1 = sbp.limit - sbp.cursor;
            if (sbp.find_among_b(a_8, 5)) {
              sbp.cursor = sbp.limit - v_1;
              sbp.ket = sbp.cursor;
              if (sbp.cursor > sbp.limit_backward) {
                sbp.cursor--;
                sbp.bra = sbp.cursor;
                sbp.slice_del();
              }
            }
          }

          function r_un_accent() {
            var v_1, v_2 = 1;
            while (sbp.out_grouping_b(g_v, 97, 251))
              v_2--;
            if (v_2 <= 0) {
              sbp.ket = sbp.cursor;
              v_1 = sbp.limit - sbp.cursor;
              if (!sbp.eq_s_b(1, "\u00E9")) {
                sbp.cursor = sbp.limit - v_1;
                if (!sbp.eq_s_b(1, "\u00E8"))
                  return;
              }
              sbp.bra = sbp.cursor;
              sbp.slice_from("e");
            }
          }

          function habr5() {
            if (!r_standard_suffix()) {
              sbp.cursor = sbp.limit;
              if (!r_i_verb_suffix()) {
                sbp.cursor = sbp.limit;
                if (!r_verb_suffix()) {
                  sbp.cursor = sbp.limit;
                  r_residual_suffix();
                  return;
                }
              }
            }
            sbp.cursor = sbp.limit;
            sbp.ket = sbp.cursor;
            if (sbp.eq_s_b(1, "Y")) {
              sbp.bra = sbp.cursor;
              sbp.slice_from("i");
            } else {
              sbp.cursor = sbp.limit;
              if (sbp.eq_s_b(1, "\u00E7")) {
                sbp.bra = sbp.cursor;
                sbp.slice_from("c");
              }
            }
          }
          this.stem = function() {
            var v_1 = sbp.cursor;
            r_prelude();
            sbp.cursor = v_1;
            r_mark_regions();
            sbp.limit_backward = v_1;
            sbp.cursor = sbp.limit;
            habr5();
            sbp.cursor = sbp.limit;
            r_un_double();
            sbp.cursor = sbp.limit;
            r_un_accent();
            sbp.cursor = sbp.limit_backward;
            r_postlude();
            return true;
          }
        };

      /* and return a function that stems a word for the current locale */
      return function(token) {
        // for lunr version 2
        if (typeof token.update === "function") {
          return token.update(function(word) {
            st.setCurrent(word);
            st.stem();
            return st.getCurrent();
          })
        } else { // for lunr version <= 1
          st.setCurrent(token);
          st.stem();
          return st.getCurrent();
        }
      }
    })();

    lunr.Pipeline.registerFunction(lunr.fr.stemmer, 'stemmer-fr');

    lunr.fr.stopWordFilter = lunr.generateStopWordFilter('ai aie aient aies ait as au aura aurai auraient aurais aurait auras aurez auriez aurions aurons auront aux avaient avais avait avec avez aviez avions avons ayant ayez ayons c ce ceci celà ces cet cette d dans de des du elle en es est et eu eue eues eurent eus eusse eussent eusses eussiez eussions eut eux eûmes eût eûtes furent fus fusse fussent fusses fussiez fussions fut fûmes fût fûtes ici il ils j je l la le les leur leurs lui m ma mais me mes moi mon même n ne nos notre nous on ont ou par pas pour qu que quel quelle quelles quels qui s sa sans se sera serai seraient serais serait seras serez seriez serions serons seront ses soi soient sois soit sommes son sont soyez soyons suis sur t ta te tes toi ton tu un une vos votre vous y à étaient étais était étant étiez étions été étée étées étés êtes'.split(' '));

    lunr.Pipeline.registerFunction(lunr.fr.stopWordFilter, 'stopWordFilter-fr');
  };
}))/*!
 * Lunr languages, `Japanese` language
 * https://github.com/MihaiValentin/lunr-languages
 *
 * Copyright 2014, Chad Liu
 * http://www.mozilla.org/MPL/
 */
/*!
 * based on
 * Snowball JavaScript Library v0.3
 * http://code.google.com/p/urim/
 * http://snowball.tartarus.org/
 *
 * Copyright 2010, Oleg Mazko
 * http://www.mozilla.org/MPL/
 */

/**
 * export the module via AMD, CommonJS or as a browser global
 * Export code from https://github.com/umdjs/umd/blob/master/returnExports.js
 */
;
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory)
  } else if (typeof exports === 'object') {
    /**
     * Node. Does not work with strict CommonJS, but
     * only CommonJS-like environments that support module.exports,
     * like Node.
     */
    module.exports = factory()
  } else {
    // Browser globals (root is window)
    factory()(root.lunr);
  }
}(this, function() {
  /**
   * Just return a value to define the module export.
   * This example returns an object, but the module
   * can return a function as the exported value.
   */
  return function(lunr) {
    /* throw error if lunr is not yet included */
    if ('undefined' === typeof lunr) {
      throw new Error('Lunr is not present. Please include / require Lunr before this script.');
    }

    /* throw error if lunr stemmer support is not yet included */
    if ('undefined' === typeof lunr.stemmerSupport) {
      throw new Error('Lunr stemmer support is not present. Please include / require Lunr stemmer support before this script.');
    }

    /*
    Japanese tokenization is trickier, since it does not
    take into account spaces.
    Since the tokenization function is represented different
    internally for each of the Lunr versions, this had to be done
    in order to try to try to pick the best way of doing this based
    on the Lunr version
     */
    var isLunr2 = lunr.version[0] == "2";

    /* register specific locale function */
    lunr.ja = function() {
      this.pipeline.reset();
      this.pipeline.add(
        lunr.ja.trimmer,
        lunr.ja.stopWordFilter,
        lunr.ja.stemmer
      );

      // change the tokenizer for japanese one
      if (isLunr2) { // for lunr version 2.0.0
        this.tokenizer = lunr.ja.tokenizer;
      } else {
        if (lunr.tokenizer) { // for lunr version 0.6.0
          lunr.tokenizer = lunr.ja.tokenizer;
        }
        if (this.tokenizerFn) { // for lunr version 0.7.0 -> 1.0.0
          this.tokenizerFn = lunr.ja.tokenizer;
        }
      }
    };
    var segmenter = new lunr.TinySegmenter(); // インスタンス生成

    lunr.ja.tokenizer = function(obj) {
      var i;
      var str;
      var len;
      var segs;
      var tokens;
      var char;
      var sliceLength;
      var sliceStart;
      var sliceEnd;
      var segStart;

      if (!arguments.length || obj == null || obj == undefined)
        return [];

      if (Array.isArray(obj)) {
        return obj.map(
          function(t) {
            return isLunr2 ? new lunr.Token(t.toLowerCase()) : t.toLowerCase();
          }
        );
      }

      str = obj.toString().toLowerCase().replace(/^\s+/, '');
      for (i = str.length - 1; i >= 0; i--) {
        if (/\S/.test(str.charAt(i))) {
          str = str.substring(0, i + 1);
          break;
        }
      }

      tokens = [];
      len = str.length;
      for (sliceEnd = 0, sliceStart = 0; sliceEnd <= len; sliceEnd++) {
        char = str.charAt(sliceEnd);
        sliceLength = sliceEnd - sliceStart;

        if ((char.match(/\s/) || sliceEnd == len)) {
          if (sliceLength > 0) {
            segs = segmenter.segment(str.slice(sliceStart, sliceEnd)).filter(
              function(token) {
                return !!token;
              }
            );

            segStart = sliceStart;
            for (i = 0; i < segs.length; i++) {
              if (isLunr2) {
                tokens.push(
                  new lunr.Token(
                    segs[i], {
                      position: [segStart, segs[i].length],
                      index: tokens.length
                    }
                  )
                );
              } else {
                tokens.push(segs[i]);
              }
              segStart += segs[i].length;
            }
          }

          sliceStart = sliceEnd + 1;
        }
      }

      return tokens;
    }

    /* lunr stemmer function */
    lunr.ja.stemmer = (function() {

      /* TODO japanese stemmer  */
      return function(word) {
        return word;
      }
    })();
    lunr.Pipeline.registerFunction(lunr.ja.stemmer, 'stemmer-ja');

    /* lunr trimmer function */
    lunr.ja.wordCharacters = "一二三四五六七八九十百千万億兆一-龠々〆ヵヶぁ-んァ-ヴーｱ-ﾝﾞa-zA-Zａ-ｚＡ-Ｚ0-9０-９";
    lunr.ja.trimmer = lunr.trimmerSupport.generateTrimmer(lunr.ja.wordCharacters);
    lunr.Pipeline.registerFunction(lunr.ja.trimmer, 'trimmer-ja');

    /* lunr stop word filter. see http://www.ranks.nl/stopwords/japanese */
    lunr.ja.stopWordFilter = lunr.generateStopWordFilter(
      'これ それ あれ この その あの ここ そこ あそこ こちら どこ だれ なに なん 何 私 貴方 貴方方 我々 私達 あの人 あのかた 彼女 彼 です あります おります います は が の に を で え から まで より も どの と し それで しかし'.split(' '));
    lunr.Pipeline.registerFunction(lunr.ja.stopWordFilter, 'stopWordFilter-ja');

    // alias ja => jp for backward-compatibility.
    // jp is the country code, while ja is the language code
    // a new lunr.ja.js has been created, but in order to
    // keep the backward compatibility, we'll leave the lunr.jp.js
    // here for a while, and just make it use the new lunr.ja.js
    lunr.jp = lunr.ja;
    lunr.Pipeline.registerFunction(lunr.jp.stemmer, 'stemmer-jp');
    lunr.Pipeline.registerFunction(lunr.jp.trimmer, 'trimmer-jp');
    lunr.Pipeline.registerFunction(lunr.jp.stopWordFilter, 'stopWordFilter-jp');
  };
}))/*!
 * Lunr languages, `Portuguese` language
 * https://github.com/MihaiValentin/lunr-languages
 *
 * Copyright 2014, Mihai Valentin
 * http://www.mozilla.org/MPL/
 */
/*!
 * based on
 * Snowball JavaScript Library v0.3
 * http://code.google.com/p/urim/
 * http://snowball.tartarus.org/
 *
 * Copyright 2010, Oleg Mazko
 * http://www.mozilla.org/MPL/
 */

/**
 * export the module via AMD, CommonJS or as a browser global
 * Export code from https://github.com/umdjs/umd/blob/master/returnExports.js
 */
;
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory)
  } else if (typeof exports === 'object') {
    /**
     * Node. Does not work with strict CommonJS, but
     * only CommonJS-like environments that support module.exports,
     * like Node.
     */
    module.exports = factory()
  } else {
    // Browser globals (root is window)
    factory()(root.lunr);
  }
}(this, function() {
  /**
   * Just return a value to define the module export.
   * This example returns an object, but the module
   * can return a function as the exported value.
   */
  return function(lunr) {
    /* throw error if lunr is not yet included */
    if ('undefined' === typeof lunr) {
      throw new Error('Lunr is not present. Please include / require Lunr before this script.');
    }

    /* throw error if lunr stemmer support is not yet included */
    if ('undefined' === typeof lunr.stemmerSupport) {
      throw new Error('Lunr stemmer support is not present. Please include / require Lunr stemmer support before this script.');
    }

    /* register specific locale function */
    lunr.pt = function() {
      this.pipeline.reset();
      this.pipeline.add(
        lunr.pt.trimmer,
        lunr.pt.stopWordFilter,
        lunr.pt.stemmer
      );

      // for lunr version 2
      // this is necessary so that every searched word is also stemmed before
      // in lunr <= 1 this is not needed, as it is done using the normal pipeline
      if (this.searchPipeline) {
        this.searchPipeline.reset();
        this.searchPipeline.add(lunr.pt.stemmer)
      }
    };

    /* lunr trimmer function */
    lunr.pt.wordCharacters = "A-Za-z\xAA\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02B8\u02E0-\u02E4\u1D00-\u1D25\u1D2C-\u1D5C\u1D62-\u1D65\u1D6B-\u1D77\u1D79-\u1DBE\u1E00-\u1EFF\u2071\u207F\u2090-\u209C\u212A\u212B\u2132\u214E\u2160-\u2188\u2C60-\u2C7F\uA722-\uA787\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA7FF\uAB30-\uAB5A\uAB5C-\uAB64\uFB00-\uFB06\uFF21-\uFF3A\uFF41-\uFF5A";
    lunr.pt.trimmer = lunr.trimmerSupport.generateTrimmer(lunr.pt.wordCharacters);

    lunr.Pipeline.registerFunction(lunr.pt.trimmer, 'trimmer-pt');

    /* lunr stemmer function */
    lunr.pt.stemmer = (function() {
      /* create the wrapped stemmer object */
      var Among = lunr.stemmerSupport.Among,
        SnowballProgram = lunr.stemmerSupport.SnowballProgram,
        st = new function PortugueseStemmer() {
          var a_0 = [new Among("", -1, 3), new Among("\u00E3", 0, 1),
              new Among("\u00F5", 0, 2)
            ],
            a_1 = [new Among("", -1, 3),
              new Among("a~", 0, 1), new Among("o~", 0, 2)
            ],
            a_2 = [
              new Among("ic", -1, -1), new Among("ad", -1, -1),
              new Among("os", -1, -1), new Among("iv", -1, 1)
            ],
            a_3 = [
              new Among("ante", -1, 1), new Among("avel", -1, 1),
              new Among("\u00EDvel", -1, 1)
            ],
            a_4 = [new Among("ic", -1, 1),
              new Among("abil", -1, 1), new Among("iv", -1, 1)
            ],
            a_5 = [
              new Among("ica", -1, 1), new Among("\u00E2ncia", -1, 1),
              new Among("\u00EAncia", -1, 4), new Among("ira", -1, 9),
              new Among("adora", -1, 1), new Among("osa", -1, 1),
              new Among("ista", -1, 1), new Among("iva", -1, 8),
              new Among("eza", -1, 1), new Among("log\u00EDa", -1, 2),
              new Among("idade", -1, 7), new Among("ante", -1, 1),
              new Among("mente", -1, 6), new Among("amente", 12, 5),
              new Among("\u00E1vel", -1, 1), new Among("\u00EDvel", -1, 1),
              new Among("uci\u00F3n", -1, 3), new Among("ico", -1, 1),
              new Among("ismo", -1, 1), new Among("oso", -1, 1),
              new Among("amento", -1, 1), new Among("imento", -1, 1),
              new Among("ivo", -1, 8), new Among("a\u00E7a~o", -1, 1),
              new Among("ador", -1, 1), new Among("icas", -1, 1),
              new Among("\u00EAncias", -1, 4), new Among("iras", -1, 9),
              new Among("adoras", -1, 1), new Among("osas", -1, 1),
              new Among("istas", -1, 1), new Among("ivas", -1, 8),
              new Among("ezas", -1, 1), new Among("log\u00EDas", -1, 2),
              new Among("idades", -1, 7), new Among("uciones", -1, 3),
              new Among("adores", -1, 1), new Among("antes", -1, 1),
              new Among("a\u00E7o~es", -1, 1), new Among("icos", -1, 1),
              new Among("ismos", -1, 1), new Among("osos", -1, 1),
              new Among("amentos", -1, 1), new Among("imentos", -1, 1),
              new Among("ivos", -1, 8)
            ],
            a_6 = [new Among("ada", -1, 1),
              new Among("ida", -1, 1), new Among("ia", -1, 1),
              new Among("aria", 2, 1), new Among("eria", 2, 1),
              new Among("iria", 2, 1), new Among("ara", -1, 1),
              new Among("era", -1, 1), new Among("ira", -1, 1),
              new Among("ava", -1, 1), new Among("asse", -1, 1),
              new Among("esse", -1, 1), new Among("isse", -1, 1),
              new Among("aste", -1, 1), new Among("este", -1, 1),
              new Among("iste", -1, 1), new Among("ei", -1, 1),
              new Among("arei", 16, 1), new Among("erei", 16, 1),
              new Among("irei", 16, 1), new Among("am", -1, 1),
              new Among("iam", 20, 1), new Among("ariam", 21, 1),
              new Among("eriam", 21, 1), new Among("iriam", 21, 1),
              new Among("aram", 20, 1), new Among("eram", 20, 1),
              new Among("iram", 20, 1), new Among("avam", 20, 1),
              new Among("em", -1, 1), new Among("arem", 29, 1),
              new Among("erem", 29, 1), new Among("irem", 29, 1),
              new Among("assem", 29, 1), new Among("essem", 29, 1),
              new Among("issem", 29, 1), new Among("ado", -1, 1),
              new Among("ido", -1, 1), new Among("ando", -1, 1),
              new Among("endo", -1, 1), new Among("indo", -1, 1),
              new Among("ara~o", -1, 1), new Among("era~o", -1, 1),
              new Among("ira~o", -1, 1), new Among("ar", -1, 1),
              new Among("er", -1, 1), new Among("ir", -1, 1),
              new Among("as", -1, 1), new Among("adas", 47, 1),
              new Among("idas", 47, 1), new Among("ias", 47, 1),
              new Among("arias", 50, 1), new Among("erias", 50, 1),
              new Among("irias", 50, 1), new Among("aras", 47, 1),
              new Among("eras", 47, 1), new Among("iras", 47, 1),
              new Among("avas", 47, 1), new Among("es", -1, 1),
              new Among("ardes", 58, 1), new Among("erdes", 58, 1),
              new Among("irdes", 58, 1), new Among("ares", 58, 1),
              new Among("eres", 58, 1), new Among("ires", 58, 1),
              new Among("asses", 58, 1), new Among("esses", 58, 1),
              new Among("isses", 58, 1), new Among("astes", 58, 1),
              new Among("estes", 58, 1), new Among("istes", 58, 1),
              new Among("is", -1, 1), new Among("ais", 71, 1),
              new Among("eis", 71, 1), new Among("areis", 73, 1),
              new Among("ereis", 73, 1), new Among("ireis", 73, 1),
              new Among("\u00E1reis", 73, 1), new Among("\u00E9reis", 73, 1),
              new Among("\u00EDreis", 73, 1), new Among("\u00E1sseis", 73, 1),
              new Among("\u00E9sseis", 73, 1), new Among("\u00EDsseis", 73, 1),
              new Among("\u00E1veis", 73, 1), new Among("\u00EDeis", 73, 1),
              new Among("ar\u00EDeis", 84, 1), new Among("er\u00EDeis", 84, 1),
              new Among("ir\u00EDeis", 84, 1), new Among("ados", -1, 1),
              new Among("idos", -1, 1), new Among("amos", -1, 1),
              new Among("\u00E1ramos", 90, 1), new Among("\u00E9ramos", 90, 1),
              new Among("\u00EDramos", 90, 1), new Among("\u00E1vamos", 90, 1),
              new Among("\u00EDamos", 90, 1), new Among("ar\u00EDamos", 95, 1),
              new Among("er\u00EDamos", 95, 1), new Among("ir\u00EDamos", 95, 1),
              new Among("emos", -1, 1), new Among("aremos", 99, 1),
              new Among("eremos", 99, 1), new Among("iremos", 99, 1),
              new Among("\u00E1ssemos", 99, 1), new Among("\u00EAssemos", 99, 1),
              new Among("\u00EDssemos", 99, 1), new Among("imos", -1, 1),
              new Among("armos", -1, 1), new Among("ermos", -1, 1),
              new Among("irmos", -1, 1), new Among("\u00E1mos", -1, 1),
              new Among("ar\u00E1s", -1, 1), new Among("er\u00E1s", -1, 1),
              new Among("ir\u00E1s", -1, 1), new Among("eu", -1, 1),
              new Among("iu", -1, 1), new Among("ou", -1, 1),
              new Among("ar\u00E1", -1, 1), new Among("er\u00E1", -1, 1),
              new Among("ir\u00E1", -1, 1)
            ],
            a_7 = [new Among("a", -1, 1),
              new Among("i", -1, 1), new Among("o", -1, 1),
              new Among("os", -1, 1), new Among("\u00E1", -1, 1),
              new Among("\u00ED", -1, 1), new Among("\u00F3", -1, 1)
            ],
            a_8 = [
              new Among("e", -1, 1), new Among("\u00E7", -1, 2),
              new Among("\u00E9", -1, 1), new Among("\u00EA", -1, 1)
            ],
            g_v = [17,
              65, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 19, 12, 2
            ],
            I_p2, I_p1, I_pV, sbp = new SnowballProgram();
          this.setCurrent = function(word) {
            sbp.setCurrent(word);
          };
          this.getCurrent = function() {
            return sbp.getCurrent();
          };

          function r_prelude() {
            var among_var;
            while (true) {
              sbp.bra = sbp.cursor;
              among_var = sbp.find_among(a_0, 3);
              if (among_var) {
                sbp.ket = sbp.cursor;
                switch (among_var) {
                  case 1:
                    sbp.slice_from("a~");
                    continue;
                  case 2:
                    sbp.slice_from("o~");
                    continue;
                  case 3:
                    if (sbp.cursor >= sbp.limit)
                      break;
                    sbp.cursor++;
                    continue;
                }
              }
              break;
            }
          }

          function habr2() {
            if (sbp.out_grouping(g_v, 97, 250)) {
              while (!sbp.in_grouping(g_v, 97, 250)) {
                if (sbp.cursor >= sbp.limit)
                  return true;
                sbp.cursor++;
              }
              return false;
            }
            return true;
          }

          function habr3() {
            if (sbp.in_grouping(g_v, 97, 250)) {
              while (!sbp.out_grouping(g_v, 97, 250)) {
                if (sbp.cursor >= sbp.limit)
                  return false;
                sbp.cursor++;
              }
            }
            I_pV = sbp.cursor;
            return true;
          }

          function habr4() {
            var v_1 = sbp.cursor,
              v_2, v_3;
            if (sbp.in_grouping(g_v, 97, 250)) {
              v_2 = sbp.cursor;
              if (habr2()) {
                sbp.cursor = v_2;
                if (habr3())
                  return;
              } else
                I_pV = sbp.cursor;
            }
            sbp.cursor = v_1;
            if (sbp.out_grouping(g_v, 97, 250)) {
              v_3 = sbp.cursor;
              if (habr2()) {
                sbp.cursor = v_3;
                if (!sbp.in_grouping(g_v, 97, 250) || sbp.cursor >= sbp.limit)
                  return;
                sbp.cursor++;
              }
              I_pV = sbp.cursor;
            }
          }

          function habr5() {
            while (!sbp.in_grouping(g_v, 97, 250)) {
              if (sbp.cursor >= sbp.limit)
                return false;
              sbp.cursor++;
            }
            while (!sbp.out_grouping(g_v, 97, 250)) {
              if (sbp.cursor >= sbp.limit)
                return false;
              sbp.cursor++;
            }
            return true;
          }

          function r_mark_regions() {
            var v_1 = sbp.cursor;
            I_pV = sbp.limit;
            I_p1 = I_pV;
            I_p2 = I_pV;
            habr4();
            sbp.cursor = v_1;
            if (habr5()) {
              I_p1 = sbp.cursor;
              if (habr5())
                I_p2 = sbp.cursor;
            }
          }

          function r_postlude() {
            var among_var;
            while (true) {
              sbp.bra = sbp.cursor;
              among_var = sbp.find_among(a_1, 3);
              if (among_var) {
                sbp.ket = sbp.cursor;
                switch (among_var) {
                  case 1:
                    sbp.slice_from("\u00E3");
                    continue;
                  case 2:
                    sbp.slice_from("\u00F5");
                    continue;
                  case 3:
                    if (sbp.cursor >= sbp.limit)
                      break;
                    sbp.cursor++;
                    continue;
                }
              }
              break;
            }
          }

          function r_RV() {
            return I_pV <= sbp.cursor;
          }

          function r_R1() {
            return I_p1 <= sbp.cursor;
          }

          function r_R2() {
            return I_p2 <= sbp.cursor;
          }

          function r_standard_suffix() {
            var among_var;
            sbp.ket = sbp.cursor;
            among_var = sbp.find_among_b(a_5, 45);
            if (!among_var)
              return false;
            sbp.bra = sbp.cursor;
            switch (among_var) {
              case 1:
                if (!r_R2())
                  return false;
                sbp.slice_del();
                break;
              case 2:
                if (!r_R2())
                  return false;
                sbp.slice_from("log");
                break;
              case 3:
                if (!r_R2())
                  return false;
                sbp.slice_from("u");
                break;
              case 4:
                if (!r_R2())
                  return false;
                sbp.slice_from("ente");
                break;
              case 5:
                if (!r_R1())
                  return false;
                sbp.slice_del();
                sbp.ket = sbp.cursor;
                among_var = sbp.find_among_b(a_2, 4);
                if (among_var) {
                  sbp.bra = sbp.cursor;
                  if (r_R2()) {
                    sbp.slice_del();
                    if (among_var == 1) {
                      sbp.ket = sbp.cursor;
                      if (sbp.eq_s_b(2, "at")) {
                        sbp.bra = sbp.cursor;
                        if (r_R2())
                          sbp.slice_del();
                      }
                    }
                  }
                }
                break;
              case 6:
                if (!r_R2())
                  return false;
                sbp.slice_del();
                sbp.ket = sbp.cursor;
                among_var = sbp.find_among_b(a_3, 3);
                if (among_var) {
                  sbp.bra = sbp.cursor;
                  if (among_var == 1)
                    if (r_R2())
                      sbp.slice_del();
                }
                break;
              case 7:
                if (!r_R2())
                  return false;
                sbp.slice_del();
                sbp.ket = sbp.cursor;
                among_var = sbp.find_among_b(a_4, 3);
                if (among_var) {
                  sbp.bra = sbp.cursor;
                  if (among_var == 1)
                    if (r_R2())
                      sbp.slice_del();
                }
                break;
              case 8:
                if (!r_R2())
                  return false;
                sbp.slice_del();
                sbp.ket = sbp.cursor;
                if (sbp.eq_s_b(2, "at")) {
                  sbp.bra = sbp.cursor;
                  if (r_R2())
                    sbp.slice_del();
                }
                break;
              case 9:
                if (!r_RV() || !sbp.eq_s_b(1, "e"))
                  return false;
                sbp.slice_from("ir");
                break;
            }
            return true;
          }

          function r_verb_suffix() {
            var among_var, v_1;
            if (sbp.cursor >= I_pV) {
              v_1 = sbp.limit_backward;
              sbp.limit_backward = I_pV;
              sbp.ket = sbp.cursor;
              among_var = sbp.find_among_b(a_6, 120);
              if (among_var) {
                sbp.bra = sbp.cursor;
                if (among_var == 1)
                  sbp.slice_del();
                sbp.limit_backward = v_1;
                return true;
              }
              sbp.limit_backward = v_1;
            }
            return false;
          }

          function r_residual_suffix() {
            var among_var;
            sbp.ket = sbp.cursor;
            among_var = sbp.find_among_b(a_7, 7);
            if (among_var) {
              sbp.bra = sbp.cursor;
              if (among_var == 1)
                if (r_RV())
                  sbp.slice_del();
            }
          }

          function habr6(c1, c2) {
            if (sbp.eq_s_b(1, c1)) {
              sbp.bra = sbp.cursor;
              var v_1 = sbp.limit - sbp.cursor;
              if (sbp.eq_s_b(1, c2)) {
                sbp.cursor = sbp.limit - v_1;
                if (r_RV())
                  sbp.slice_del();
                return false;
              }
            }
            return true;
          }

          function r_residual_form() {
            var among_var, v_1, v_2, v_3;
            sbp.ket = sbp.cursor;
            among_var = sbp.find_among_b(a_8, 4);
            if (among_var) {
              sbp.bra = sbp.cursor;
              switch (among_var) {
                case 1:
                  if (r_RV()) {
                    sbp.slice_del();
                    sbp.ket = sbp.cursor;
                    v_1 = sbp.limit - sbp.cursor;
                    if (habr6("u", "g"))
                      habr6("i", "c")
                  }
                  break;
                case 2:
                  sbp.slice_from("c");
                  break;
              }
            }
          }

          function habr1() {
            if (!r_standard_suffix()) {
              sbp.cursor = sbp.limit;
              if (!r_verb_suffix()) {
                sbp.cursor = sbp.limit;
                r_residual_suffix();
                return;
              }
            }
            sbp.cursor = sbp.limit;
            sbp.ket = sbp.cursor;
            if (sbp.eq_s_b(1, "i")) {
              sbp.bra = sbp.cursor;
              if (sbp.eq_s_b(1, "c")) {
                sbp.cursor = sbp.limit;
                if (r_RV())
                  sbp.slice_del();
              }
            }
          }
          this.stem = function() {
            var v_1 = sbp.cursor;
            r_prelude();
            sbp.cursor = v_1;
            r_mark_regions();
            sbp.limit_backward = v_1;
            sbp.cursor = sbp.limit;
            habr1();
            sbp.cursor = sbp.limit;
            r_residual_form();
            sbp.cursor = sbp.limit_backward;
            r_postlude();
            return true;
          }
        };

      /* and return a function that stems a word for the current locale */
      return function(token) {
        // for lunr version 2
        if (typeof token.update === "function") {
          return token.update(function(word) {
            st.setCurrent(word);
            st.stem();
            return st.getCurrent();
          })
        } else { // for lunr version <= 1
          st.setCurrent(token);
          st.stem();
          return st.getCurrent();
        }
      }
    })();

    lunr.Pipeline.registerFunction(lunr.pt.stemmer, 'stemmer-pt');

    lunr.pt.stopWordFilter = lunr.generateStopWordFilter('a ao aos aquela aquelas aquele aqueles aquilo as até com como da das de dela delas dele deles depois do dos e ela elas ele eles em entre era eram essa essas esse esses esta estamos estas estava estavam este esteja estejam estejamos estes esteve estive estivemos estiver estivera estiveram estiverem estivermos estivesse estivessem estivéramos estivéssemos estou está estávamos estão eu foi fomos for fora foram forem formos fosse fossem fui fôramos fôssemos haja hajam hajamos havemos hei houve houvemos houver houvera houveram houverei houverem houveremos houveria houveriam houvermos houverá houverão houveríamos houvesse houvessem houvéramos houvéssemos há hão isso isto já lhe lhes mais mas me mesmo meu meus minha minhas muito na nas nem no nos nossa nossas nosso nossos num numa não nós o os ou para pela pelas pelo pelos por qual quando que quem se seja sejam sejamos sem serei seremos seria seriam será serão seríamos seu seus somos sou sua suas são só também te tem temos tenha tenham tenhamos tenho terei teremos teria teriam terá terão teríamos teu teus teve tinha tinham tive tivemos tiver tivera tiveram tiverem tivermos tivesse tivessem tivéramos tivéssemos tu tua tuas tém tínhamos um uma você vocês vos à às éramos'.split(' '));

    lunr.Pipeline.registerFunction(lunr.pt.stopWordFilter, 'stopWordFilter-pt');
  };
}))/*!
 * Lunr languages, `Chinese` language
 * https://github.com/MihaiValentin/lunr-languages
 *
 * Copyright 2019, Felix Lian (repairearth)
 * http://www.mozilla.org/MPL/
 */
/*!
 * based on
 * Snowball zhvaScript Library v0.3
 * http://code.google.com/p/urim/
 * http://snowball.tartarus.org/
 *
 * Copyright 2010, Oleg Mazko
 * http://www.mozilla.org/MPL/
 */

/**
 * export the module via AMD, CommonJS or as a browser global
 * Export code from https://github.com/umdjs/umd/blob/master/returnExports.js
 */
;
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory)
  } else if (typeof exports === 'object') {
    /**
     * Node. Does not work with strict CommonJS, but
     * only CommonJS-like environments that support module.exports,
     * like Node.
     */
    module.exports = factory(require('@node-rs/jieba'))
  } else {
    // Browser globals (root is window)
    factory()(root.lunr);
  }
}(this, function(nodejieba) {
  /**
   * Just return a value to define the module export.
   * This example returns an object, but the module
   * can return a function as the exported value.
   */
  return function(lunr, nodejiebaDictJson) {
    /* throw error if lunr is not yet included */
    if ('undefined' === typeof lunr) {
      throw new Error('Lunr is not present. Please include / require Lunr before this script.');
    }

    /* throw error if lunr stemmer support is not yet included */
    if ('undefined' === typeof lunr.stemmerSupport) {
      throw new Error('Lunr stemmer support is not present. Please include / require Lunr stemmer support before this script.');
    }

    /*
    Chinese tokenization is trickier, since it does not
    take into account spaces.
    Since the tokenization function is represented different
    internally for each of the Lunr versions, this had to be done
    in order to try to try to pick the best way of doing this based
    on the Lunr version
     */
    var isLunr2 = lunr.version[0] == "2";

    /* register specific locale function */
    lunr.zh = function() {
      this.pipeline.reset();
      this.pipeline.add(
        lunr.zh.trimmer,
        lunr.zh.stopWordFilter,
        lunr.zh.stemmer
      );

      // change the tokenizer for Chinese one
      if (isLunr2) { // for lunr version 2.0.0
        this.tokenizer = lunr.zh.tokenizer;
      } else {
        if (lunr.tokenizer) { // for lunr version 0.6.0
          lunr.tokenizer = lunr.zh.tokenizer;
        }
        if (this.tokenizerFn) { // for lunr version 0.7.0 -> 1.0.0
          this.tokenizerFn = lunr.zh.tokenizer;
        }
      }
    };

    lunr.zh.tokenizer = function(obj) {
      if (!arguments.length || obj == null || obj == undefined) return []
      if (Array.isArray(obj)) return obj.map(function(t) {
        return isLunr2 ? new lunr.Token(t.toLowerCase()) : t.toLowerCase()
      })

      nodejiebaDictJson && nodejieba.load(nodejiebaDictJson)

      var str = obj.toString().trim().toLowerCase();
      var tokens = [];

      nodejieba.cut(str, true).forEach(function(seg) {
        tokens = tokens.concat(seg.split(' '))
      })

      tokens = tokens.filter(function(token) {
        return !!token;
      });

      var fromIndex = 0

      return tokens.map(function(token, index) {
        if (isLunr2) {
          var start = str.indexOf(token, fromIndex)

          var tokenMetadata = {}
          tokenMetadata["position"] = [start, token.length]
          tokenMetadata["index"] = index

          fromIndex = start

          return new lunr.Token(token, tokenMetadata);
        } else {
          return token
        }
      });
    }

    /* lunr trimmer function */
    lunr.zh.wordCharacters = "\\w\u4e00-\u9fa5";
    lunr.zh.trimmer = lunr.trimmerSupport.generateTrimmer(lunr.zh.wordCharacters);
    lunr.Pipeline.registerFunction(lunr.zh.trimmer, 'trimmer-zh');

    /* lunr stemmer function */
    lunr.zh.stemmer = (function() {

      /* TODO Chinese stemmer  */
      return function(word) {
        return word;
      }
    })();
    lunr.Pipeline.registerFunction(lunr.zh.stemmer, 'stemmer-zh');

    /* lunr stop word filter. see https://www.ranks.nl/stopwords/chinese-stopwords */
    lunr.zh.stopWordFilter = lunr.generateStopWordFilter(
      '的 一 不 在 人 有 是 为 以 于 上 他 而 后 之 来 及 了 因 下 可 到 由 这 与 也 此 但 并 个 其 已 无 小 我 们 起 最 再 今 去 好 只 又 或 很 亦 某 把 那 你 乃 它 吧 被 比 别 趁 当 从 到 得 打 凡 儿 尔 该 各 给 跟 和 何 还 即 几 既 看 据 距 靠 啦 了 另 么 每 们 嘛 拿 哪 那 您 凭 且 却 让 仍 啥 如 若 使 谁 虽 随 同 所 她 哇 嗡 往 哪 些 向 沿 哟 用 于 咱 则 怎 曾 至 致 着 诸 自'.split(' '));
    lunr.Pipeline.registerFunction(lunr.zh.stopWordFilter, 'stopWordFilter-zh');
  };
}))/*!
 * Lunr languages, `Korean` language
 * https://github.com/turbobit/lunr-languages
 *
 * Copyright 2021, Manikandan Venkatasubban
 * http://www.mozilla.org/MPL/
 */
/*!
 * based on
 * Snowball JavaScript Library v0.3
 * http://code.google.com/p/urim/
 * http://snowball.tartarus.org/
 *
 * Copyright 2010, Oleg Mazko
 * http://www.mozilla.org/MPL/
 */

/**
 * export the module via AMD, CommonJS or as a browser global
 * Export code from https://github.com/umdjs/umd/blob/master/returnExports.js
 */
;
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory)
  } else if (typeof exports === 'object') {
    /**
     * Node. Does not work with strict CommonJS, but
     * only CommonJS-like environments that support module.exports,
     * like Node.
     */
    module.exports = factory()
  } else {
    // Browser globals (root is window)
    factory()(root.lunr);
  }
}(this, function() {
  /**
   * Just return a value to define the module export.
   * This example returns an object, but the module
   * can return a function as the exported value.
   */
  return function(lunr) {
    /* throw error if lunr is not yet included */
    if ('undefined' === typeof lunr) {
      throw new Error('Lunr is not present. Please include / require Lunr before this script.');
    }

    /* throw error if lunr stemmer support is not yet included */
    if ('undefined' === typeof lunr.stemmerSupport) {
      throw new Error('Lunr stemmer support is not present. Please include / require Lunr stemmer support before this script.');
    }

    /* register specific locale function */
    lunr.ko = function() {
      this.pipeline.reset();
      this.pipeline.add(
        lunr.ko.trimmer,
        lunr.ko.stopWordFilter
      );

      // change the tokenizer for japanese one
      // if (isLunr2) { // for lunr version 2.0.0
      //   this.tokenizer = lunr.ko.tokenizer;
      // } else {
      //   if (lunr.tokenizer) { // for lunr version 0.6.0
      //     lunr.tokenizer = lunr.ko.tokenizer;
      //   }
      //   if (this.tokenizerFn) { // for lunr version 0.7.0 -> 1.0.0
      //     this.tokenizerFn = lunr.ko.tokenizer;
      //   }
      // }
      /*
       if (this.searchPipeline) {
         this.searchPipeline.reset();
         this.searchPipeline.add(lunr.ko.stemmer)
       }
       */
    };

    /* lunr trimmer function */
    lunr.ko.wordCharacters = "[" +
      "A-Za-z" +
      "\uac00-\ud7afa" +
      "]";
    lunr.ko.trimmer = lunr.trimmerSupport.generateTrimmer(lunr.ko.wordCharacters);

    lunr.Pipeline.registerFunction(lunr.ko.trimmer, 'trimmer-ko');


    /* lunr stop word filter */
    //https://www.ranks.nl/stopwords/korean
    lunr.ko.stopWordFilter = lunr.generateStopWordFilter('아 휴 아이구 아이쿠 아이고 어 나 우리 저희 따라 의해 을 를 에 의 가 으로 로 에게 뿐이다 의거하여 근거하여 입각하여 기준으로 예하면 예를 들면 예를 들자면 저 소인 소생 저희 지말고 하지마 하지마라 다른 물론 또한 그리고 비길수 없다 해서는 안된다 뿐만 아니라 만이 아니다 만은 아니다 막론하고 관계없이 그치지 않다 그러나 그런데 하지만 든간에 논하지 않다 따지지 않다 설사 비록 더라도 아니면 만 못하다 하는 편이 낫다 불문하고 향하여 향해서 향하다 쪽으로 틈타 이용하여 타다 오르다 제외하고 이 외에 이 밖에 하여야 비로소 한다면 몰라도 외에도 이곳 여기 부터 기점으로 따라서 할 생각이다 하려고하다 이리하여 그리하여 그렇게 함으로써 하지만 일때 할때 앞에서 중에서 보는데서 으로써 로써 까지 해야한다 일것이다 반드시 할줄알다 할수있다 할수있어 임에 틀림없다 한다면 등 등등 제 겨우 단지 다만 할뿐 딩동 댕그 대해서 대하여 대하면 훨씬 얼마나 얼마만큼 얼마큼 남짓 여 얼마간 약간 다소 좀 조금 다수 몇 얼마 지만 하물며 또한 그러나 그렇지만 하지만 이외에도 대해 말하자면 뿐이다 다음에 반대로 반대로 말하자면 이와 반대로 바꾸어서 말하면 바꾸어서 한다면 만약 그렇지않으면 까악 툭 딱 삐걱거리다 보드득 비걱거리다 꽈당 응당 해야한다 에 가서 각 각각 여러분 각종 각자 제각기 하도록하다 와 과 그러므로 그래서 고로 한 까닭에 하기 때문에 거니와 이지만 대하여 관하여 관한 과연 실로 아니나다를가 생각한대로 진짜로 한적이있다 하곤하였다 하 하하 허허 아하 거바 와 오 왜 어째서 무엇때문에 어찌 하겠는가 무슨 어디 어느곳 더군다나 하물며 더욱이는 어느때 언제 야 이봐 어이 여보시오 흐흐 흥 휴 헉헉 헐떡헐떡 영차 여차 어기여차 끙끙 아야 앗 아야 콸콸 졸졸 좍좍 뚝뚝 주룩주룩 솨 우르르 그래도 또 그리고 바꾸어말하면 바꾸어말하자면 혹은 혹시 답다 및 그에 따르는 때가 되어 즉 지든지 설령 가령 하더라도 할지라도 일지라도 지든지 몇 거의 하마터면 인젠 이젠 된바에야 된이상 만큼	어찌됏든 그위에 게다가 점에서 보아 비추어 보아 고려하면 하게될것이다 일것이다 비교적 좀 보다더 비하면 시키다 하게하다 할만하다 의해서 연이서 이어서 잇따라 뒤따라 뒤이어 결국 의지하여 기대여 통하여 자마자 더욱더 불구하고 얼마든지 마음대로 주저하지 않고 곧 즉시 바로 당장 하자마자 밖에 안된다 하면된다 그래 그렇지 요컨대 다시 말하자면 바꿔 말하면 즉 구체적으로 말하자면 시작하여 시초에 이상 허 헉 허걱 바와같이 해도좋다 해도된다 게다가 더구나 하물며 와르르 팍 퍽 펄렁 동안 이래 하고있었다 이었다 에서 로부터 까지 예하면 했어요 해요 함께 같이 더불어 마저 마저도 양자 모두 습니다 가까스로 하려고하다 즈음하여 다른 다른 방면으로 해봐요 습니까 했어요 말할것도 없고 무릎쓰고 개의치않고 하는것만 못하다 하는것이 낫다 매 매번 들 모 어느것 어느 로써 갖고말하자면 어디 어느쪽 어느것 어느해 어느 년도 라 해도 언젠가 어떤것 어느것 저기 저쪽 저것 그때 그럼 그러면 요만한걸 그래 그때 저것만큼 그저 이르기까지 할 줄 안다 할 힘이 있다 너 너희 당신 어찌 설마 차라리 할지언정 할지라도 할망정 할지언정 구토하다 게우다 토하다 메쓰겁다 옆사람 퉤 쳇 의거하여 근거하여 의해 따라 힘입어 그 다음 버금 두번째로 기타 첫번째로 나머지는 그중에서 견지에서 형식으로 쓰여 입장에서 위해서 단지 의해되다 하도록시키다 뿐만아니라 반대로 전후 전자 앞의것 잠시 잠깐 하면서 그렇지만 다음에 그러한즉 그런즉 남들 아무거나 어찌하든지 같다 비슷하다 예컨대 이럴정도로 어떻게 만약 만일 위에서 서술한바와같이 인 듯하다 하지 않는다면 만약에 무엇 무슨 어느 어떤 아래윗 조차 한데 그럼에도 불구하고 여전히 심지어 까지도 조차도 하지 않도록 않기 위하여 때 시각 무렵 시간 동안 어때 어떠한 하여금 네 예 우선 누구 누가 알겠는가 아무도 줄은모른다 줄은 몰랏다 하는 김에 겸사겸사 하는바 그런 까닭에 한 이유는 그러니 그러니까 때문에 그 너희 그들 너희들 타인 것 것들 너 위하여 공동으로 동시에 하기 위하여 어찌하여 무엇때문에 붕붕 윙윙 나 우리 엉엉 휘익 윙윙 오호 아하 어쨋든 만 못하다	하기보다는 차라리 하는 편이 낫다 흐흐 놀라다 상대적으로 말하자면 마치 아니라면 쉿 그렇지 않으면 그렇지 않다면 안 그러면 아니었다면 하든지 아니면 이라면 좋아 알았어 하는것도 그만이다 어쩔수 없다 하나 일 일반적으로 일단 한켠으로는 오자마자 이렇게되면 이와같다면 전부 한마디 한항목 근거로 하기에 아울러 하지 않도록 않기 위해서 이르기까지 이 되다 로 인하여 까닭으로 이유만으로 이로 인하여 그래서 이 때문에 그러므로 그런 까닭에 알 수 있다 결론을 낼 수 있다 으로 인하여 있다 어떤것 관계가 있다 관련이 있다 연관되다 어떤것들 에 대해 이리하여 그리하여 여부 하기보다는 하느니 하면 할수록 운운 이러이러하다 하구나 하도다 다시말하면 다음으로 에 있다 에 달려 있다 우리 우리들 오히려 하기는한데 어떻게 어떻해 어찌됏어 어때 어째서 본대로 자 이 이쪽 여기 이것 이번 이렇게말하자면 이런 이러한 이와 같은 요만큼 요만한 것 얼마 안 되는 것 이만큼 이 정도의 이렇게 많은 것 이와 같다 이때 이렇구나 것과 같이 끼익 삐걱 따위 와 같은 사람들 부류의 사람들 왜냐하면 중의하나 오직 오로지 에 한하다 하기만 하면 도착하다 까지 미치다 도달하다 정도에 이르다 할 지경이다 결과에 이르다 관해서는 여러분 하고 있다 한 후 혼자 자기 자기집 자신 우에 종합한것과같이 총적으로 보면 총적으로 말하면 총적으로 대로 하다 으로서 참 그만이다 할 따름이다 쿵 탕탕 쾅쾅 둥둥 봐 봐라 아이야 아니 와아 응 아이 참나 년 월 일 령 영 일 이 삼 사 오 육 륙 칠 팔 구 이천육 이천칠 이천팔 이천구 하나 둘 셋 넷 다섯 여섯 일곱 여덟 아홉 령 영'.split(' '));
    lunr.Pipeline.registerFunction(lunr.ko.stopWordFilter, 'stopWordFilter-ko');

    /* lunr stemmer function */
    lunr.ko.stemmer = (function() {

      return function(word) {
        // for lunr version 2
        if (typeof word.update === "function") {
          return word.update(function(word) {
            return word;
          })
        } else { // for lunr version <= 1
          return word;
        }

      }
    })();
    lunr.Pipeline.registerFunction(lunr.ko.stemmer, 'stemmer-ko');
  };
}))