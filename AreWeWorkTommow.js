// ==UserScript==
// @name         Work
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Auto reload in 20 second
// @author       SakiKiaya
// @match        https://www.dgpa.gov.tw/typh/daily/nds.html?uid=31
// @grant        none
// ==/UserScript==

var selNode = document.querySelector("#Table > tbody.Table_Body > tr:nth-child(7)");
var selCounty= selNode.firstChild.innerText;
var selMessage = "";

if(selNode != null){
    selMessage = selNode.lastChild.lastChild.innerText;
    if(selMessage.search("明天") != -1){
        console.log(selMessage);
        if(selMessage.search("照常") == -1){
            console.log(selMessage);
            alert(selCounty + " " + selMessage);
        }else{
            console.log(selMessage);
            alert(selCounty + " 請乖乖上班, 上課");
        }
    }
    else{
        console.log(selCounty + " Not yet");
    }
}
setTimeout(function(){ location.reload(); }, 20*1000);
