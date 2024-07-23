// ==UserScript==
// @name         Work
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Check the status, and auto reload in 20 second
// @author       SakiKiaya
// @match        http*://www.dgpa.gov.tw/typh/daily/nds.html*
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js
// ==/UserScript==

//Var for Reload
var objInterval;
var nReloadTime = 60;
var nTime = nReloadTime;
var bReloadEnable = true;

// Var for Select
var selTable;
var selNode;
var selCounty;
var selMessage;
var selRows;

// Var for County List
var listCounty = ['臺北市', '新北市', '桃園市', '臺中市', '臺南市', '高雄市',
                 '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義縣',
                 '屏東縣', '宜蘭縣', '花蓮縣', '臺東縣', '澎湖縣', '金門縣',
                 '連江縣', '基隆市', '新竹市', '嘉義市'];
var listCountyOnTable;
var strListOption;
var strOption;
var strOptionHead = "<option value=";
var strOptionTail = "</option>\n";

// Var for Cookie
var WorkID = 0;
var WorkValue = '臺北市';

function AddCSS()
{
    var styles = `
    .alert {display: none; position: fixed;top: 50%;left: 50%;min-width: 300px;max-width: 600px;transform: translate(-50%,-50%);z-index: 99999;font-size: 3rem;text-align: center;padding: 15px;border-radius: 3px;}
    .alert-success {color: #fff;background-color: #198754;border-color: #198754;}
    .alert-warning {color: #8a6d3b;background-color: #F5B85E;border-color: #faebcc;}
    .btn-success:hover {color: #fff;background-color: #157347;border-color: #146c43;}

    .mar {margin:.25rem 0rem .25rem .25rem}
    .btn {display: inline-block;font-weight: 400;line-height: 1.5;color: #212529;text-align: center;text-decoration: none;vertical-align: middle;cursor: pointer;-webkit-user-select: none;-moz-user-select: none;user-select: none;background-color: transparent;border: 1px solid transparent;padding: .375rem .75rem;font-size: 1rem;border-radius: .25rem;transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;}
    .btn:hover {color: #212529;}
    .btn-success {color: #fff;background-color: #198754;border-color: #198754;}
    .btn-success:hover {color: #fff;background-color: #157347;border-color: #146c43;}

    .form-select {display: inline-block;vertical-align: middle;padding: .375rem 2.25rem .375rem .75rem;-moz-padding-start: calc(0.75rem - 3px);font-size: 1rem;font-weight: 400;line-height: 1.5;color: #212529;background-color: #fff;background-image: url(data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e);background-repeat: no-repeat;background-position: right .75rem center;background-size: 16px 12px;border: 1px solid #ced4da;border-radius: .25rem;transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;-webkit-appearance: none;-moz-appearance: none;appearance: none;}
    .form-select-sm {padding-top: .25rem;padding-bottom: .25rem;padding-left: .5rem;font-size: .875rem;}
    `;

    var styleSheet = document.createElement("style")
    styleSheet.type = "text/css"
    styleSheet.innerText = styles
    document.head.appendChild(styleSheet)
};

function delay(s)
{
    return new Promise(function(resolve,reject)
    {
        setTimeout(resolve,s);
    });
};

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
};

async function fadeOut(item)
{
    for(var i = 1.0; i > 0; i -= 0.1)
    {
        await delay(50);//100mS
        item.style.opacity = i;
    }
};

var prompt = async function(message, style, time)
{
    var objMainDiv;
    style = (style === undefined) ? 'alert-success' : style;
    time = (time === undefined) ? 1200 : time;

    // Select alert Div
    objMainDiv = document.querySelector("#judge_work_alert");

    // Setting Message
    objMainDiv.innerHTML = message;

    // Show Div
    objMainDiv.className = 'alert ' + style;
    objMainDiv.style.display = "block";

    // Delay and fadeout
    await delay(time);
    await fadeOut(objMainDiv);
    objMainDiv.style = "";
};

var success_prompt = function(message, time)
{
    prompt(message, 'alert-success', time);
};

var warning_prompt = function(message, time)
{
    prompt(message, 'alert-warning', time);
}


var rmNotNeed = function(str)
{
    // remove new line sand space
    str = str.replace(/\r\n|\n|\s+/g, "");
    return str;
};

function GetKeyword(obj)
{
    if (obj === undefined){
        return null;
    } else{
        return obj == null? null : obj.innerText;
    }
};

function FindObjByKeyword(obj, value)
{
   var list = document.querySelectorAll(obj), i;
   var sItem = "", nMatchIndex=-1;
   for (i = 0; i < list.length; ++i) {
       if (GetKeyword(list[i]) == null) continue;
       sItem = GetKeyword(list[i]);
       console.log(list[i]);
       if (sItem.match(value))
       {
           console.log("[Match] " + list[i]);
           nMatchIndex = i;
       }
   }
   return nMatchIndex == -1 ? null: list[nMatchIndex];
};

function genSelectItem(element, index)
{
    return strOptionHead + "'" + index + "'>" + element + strOptionTail;
};

function genCountyList()
{
    var strCountyOptionList = "";
    for (let i=0; i<listCounty.length; i++) {
        strCountyOptionList += genSelectItem(listCounty[i], i);
    };
    console.log(strCountyOptionList);
    return strCountyOptionList;
};

var getCountyList = function(selTable)
{
    var strCountyOptionList = "";
    var strCounty;
    selRows = selTable.rows;
    for (var i = 1; i < selRows.length - 1; i++) {
        if(rmNotNeed(selRows[i].firstElementChild.textContent).search("地區") != -1) {
            strCounty = rmNotNeed(selRows[i].cells[1].textContent);
        }
        else {
            strCounty = rmNotNeed(selRows[i].firstElementChild.textContent);
        }
        strCountyOptionList =
                strCountyOptionList + strOptionHead + "'" + i + "'>" +
                strCounty + strOptionTail;
        console.log(strCounty);
    }
    console.log(strCountyOptionList);
    return strCountyOptionList;
};

function addList(str, checkCookie)
{
    var selDiv = document.querySelector('#Content');
    var selContents;
    AddCSS();

    // Add alert Div
    if (document.querySelector("#judge_work_alert") == null)
    {
        selDiv.insertAdjacentHTML('afterbegin', '<div id="judge_work_alert" class="alert alert-success"></div>');
    }

    if (document.querySelector('#judge_work_contents') == null)
    {
        selDiv.insertAdjacentHTML('afterbegin', '<div id="judge_work_contents"></div>');
    }
    selContents = document.querySelector('#judge_work_contents');

    // Add button
    if (document.querySelector("#btnSave") == null)
    {
        selContents.insertAdjacentHTML('afterbegin', '<button name="btnSave" id ="btnSave" class="mar btn btn-success" "> 設定所在地區 </button></br>'); //style="position:absolute;left:74px;
    }

    // Add Selector
    if (document.querySelector("#SelectCounty") == null)
    {
        selContents.insertAdjacentHTML('afterbegin', '<select name="SelectCounty" id ="SelectCounty" class="mar form-select">' + str +'</select>'); //style="position:absolute;left:4px;">

    }

    // Add countdown Div
    if (document.querySelector("#divCountDown") == null)
    {
        selContents.insertAdjacentHTML('afterbegin', '<div id="divCountDown" class="alert-success">倒數: 秒後重新整理，點選文字可暫停倒數</div>');
    }

    var selSelector = document.querySelector('#SelectCounty');
    var btn = document.querySelector("#btnSave");

    // Setting county click Event
	btn.addEventListener('click',function(){
        var id = selSelector.value;
        var countyName = listCounty[id];
        SaveToCookie(selSelector.value, countyName);
        success_prompt("地區設定完成", 200);
        JudgeWork();
	},false);

    selSelector.onchange = function(){
        WorkID = selSelector.value;
        WorkValue = listCounty[WorkID];
        JudgeWork();
    };

    if(checkCookie) selSelector.selectedIndex = WorkID;

    // Pause reload click Event
    btn = document.querySelector("#divCountDown");
    btn.addEventListener('click',function(){
        SwitchReloadInterval();
	},false);
};

function getCookie(name) {
  var arg = escape(name) + "=";
  var nameLen = arg.length;
  var cookieLen = document.cookie.length;
  var i = 0;
  while (i < cookieLen) {
    var j = i + nameLen;
    if (document.cookie.substring(i, j) == arg) return getCookieValueByIndex(j);
    i = document.cookie.indexOf(" ", i) + 1;
    if (i == 0) break;
  }
  return null;
}

function getCookieValueByIndex(startIndex) {
  var endIndex = document.cookie.indexOf(";", startIndex);
  if (endIndex == -1) endIndex = document.cookie.length;
  return unescape(document.cookie.substring(startIndex, endIndex));
}

function SaveToCookie(id, str)
{
    // Var for cookie save
    var strCookieID = "WorkId=" + id + "; expires=Tue, 19 Jan 2038 03:14:07 GMT";
    var strCookieValue = "WorkValue=" + str + "; expires=Tue, 19 Jan 2038 03:14:07 GMT";
    console.log('save\n' + strCookieID + '\n' + strCookieValue);
    document.cookie = strCookieID;
    document.cookie = strCookieValue;
};

function getWorkCookie()
{
    if(document.cookie.indexOf('WorkId=') != -1)
    {
        WorkID = getCookie('WorkId');
        WorkValue = getCookie('WorkValue');
        console.log("Found the save:[" + WorkID + "]" + WorkValue);
        return true;
    }
    else
    {
        console.log("Save is not exist");
        return false;
    }
}

function JudgeWork()
{
    var onDuty = true;
    var res;

    // Select node
    selNode = FindObjByKeyword('tr', WorkValue);

    // Judge
    if(selNode != null){
        selMessage = selNode.cells[selNode.cells.length-1].innerText;

        // Highlight select node
        selNode.cells[0].bgColor = "198754"

        console.log("設定區域:" + WorkValue + "\n找到內容:" + selMessage);
        // Judge the status
        //20230903 找到內容:今天未達停止上班及上課標準。
        //20240723 找到內容:明天停止上班、停止上課。
        if(selMessage.match('停止'))
        {
            if (!selMessage.match('未'))
            {
                onDuty = false;
            }
        }
    }

    // Output Message
    if (onDuty)
    {
        warning_prompt(WorkValue + " 請乖乖上班, 上課");
    }
    else
    {
        res = selMessage.match('(今|明)');
        if (selMessage.match('[:]'))
        {
            success_prompt(WorkValue + res[0] + "天部分放假");
        }
        else
        {
            success_prompt(WorkValue + res[0] + "天全部放假");
        }
    }
}

function showCountDown()
{
    var selDiv = document.querySelector("#divCountDown");

    if (selDiv != null)
    {
        selDiv.innerText = "倒數: " + nTime.toString() + "秒後重新整理，點選文字可暫停倒數";
    }
    if (nTime == 0)
    {
        location.reload();
    }
    else
    {
        nTime = nTime - 1;
    }
}

function SwitchReloadInterval()
{
    if (objInterval != null)
    {
        clearInterval(objInterval);
        objInterval = null;
        var selDiv = document.querySelector("#divCountDown");
        selDiv.innerText = "[暫停]" + selDiv.innerText
    }
    else
    {
        objInterval = setInterval(function(){showCountDown();}, 1000);
    }
}

function Processing(){
    // Main function
    addList(genCountyList(), getWorkCookie());

    selTable = document.querySelector("#Table");

    if(selTable != null){
        // Inital
        selRows = selTable.rows;

        // Find the county
        JudgeWork();
    }
    else
    {
        console.log("table not found");
    }

    // Auto reload in 60 second
    objInterval = setInterval(function(){showCountDown();}, 1000);
}

window.addEventListener('load', (event) => {
    Processing();
});
