// ==UserScript==
// @name         Work
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Auto reload in 20 second
// @author       SakiKiaya
// @match        https://www.dgpa.gov.tw/typh/daily/nds.html?uid=31
// @grant        none
// ==/UserScript==

var selMessage = document.querySelector("#Table > tbody.Table_Body > tr:nth-child(7) > td:nth-child(2) > font:nth-child(3)");

if(selMessage != null){
    alert(selMessage.innerText);
}else
{
    console.log("Not yet");
}
setTimeout(function(){ location.reload(); }, 20*1000);
