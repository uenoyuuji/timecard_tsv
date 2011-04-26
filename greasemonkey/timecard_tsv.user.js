// ==UserScript==
// @name    timecard tsv (for Cybozu Office 8)
// @version 0.1
// @include http://*
// @include https://*
// ==/UserScript
(function() {
    if(!/^.*\/ag\.(cgi|exe)$/.test(location.pathname)) {
        return;
    }
    var copyright = document.getElementsByClassName("copyright").item(0);
    if(!copyright) {
        return;
    }
    var versionPattern = /^.*サイボウズ\(R\) Office Version ([0-9]+).*$/;
    if(!versionPattern.test(copyright.textContent)) {
        return;
    }
    var version = copyright.textContent.replace(versionPattern, "$1");
    if(version != "8") {
        return;
    }
    var page = location.search.replace(/^.*[&\?]*page=([^&]+).*$/, '$1');
    if(page != "TimeCardIndex") {
        return;
    }

    var Time = function(hour, minute, unit) {
        this.hour = hour;
        this.minute = minute;
        this.unit = unit;
    };
    Time.parse = function(value, unit) {
        if(!/^(([0-1]?[0-9])|(2[0-9])):[0-5]?[0-9]$/.test(value)) {
            return null;
        }
        value = value.split(":");
        if(unit < 1 || 60 < unit) {
            return null;
        }
        return new Time(parseInt(value[0], 10), parseInt(value[1], 10), unit);
    };
    Time.prototype = {
        begin: function() {
            return this.hour + (this.unit * Math.ceil(this.minute / this.unit)) / 60;
        },
        end: function() {
            return this.hour + (this.unit * Math.floor(this.minute / this.unit)) / 60;
        }
    };

    var table = document.getElementsByClassName("borderTable").item(0);
    var timecard = (function(table) {
        var arr = [];
        var trs = table.getElementsByTagName("tr");
        for(var i = 0; i < trs.length; i++) {
            var tds = trs.item(i).getElementsByTagName("td");
            if(tds.length == 6) {
                arr[arr.length] = [tds.item(1).textContent, tds.item(2).textContent];
            }
        }
        return arr;
    })(table);
    var text = (function(timecard, unit) {
        var s = "";
        timecard.forEach(function(t) {
            if(t) {
                var t0 = Time.parse(t[0], unit);
                if(t0) {
                    s += t0.begin();
                    var t1 =  Time.parse(t[1], unit);
                    if(t1) {
                        s += "\t" + t1.end();
                    }
                } else {
                    s += "\t";
                }
            }
            s += "\n";
        });
        return s;
    })(timecard, 30);
    var textarea = document.createElement("textarea");
    textarea.textContent = text;
    textarea.style.lineHeight = 1.0;
    textarea.style.cssFloat = "left";
    textarea.rows = 32;
    textarea.cols = 14;
    textarea.readOnly = true;
    textarea.addEventListener("click", function(event) {
        textarea.select();
    }, true);
    table.style.cssFloat = "left";
    table.parentNode.insertBefore(textarea, table.nextSibling);
})();
