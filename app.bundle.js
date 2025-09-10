(function(){
  'use strict';
  var React = window.React, ReactDOM = window.ReactDOM;
  var h = React.createElement;
  var useState = React.useState, useEffect = React.useEffect, useMemo = React.useMemo;

  var STORAGE_KEY = 'ora-react-umd-1.9.1';
  var WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var DAILY_TARGET = 8;

  function daysInMonth(year, monthIndex0){ return new Date(year, monthIndex0+1, 0).getDate(); }
  function fmt(n){ return (Math.round(n*100)/100).toFixed(2); }
  function isWeekendIndex(wd){ return wd===5 || wd===6; } // Fri+Sat
  function ymKey(y,m){ return y+'-'+String(m+1).padStart(2,'0'); }

  // Charts
  function ProgressRing(props){
    var actual = props.actual || 0, target = props.target || 1;
    var pct = target>0 ? Math.max(0, Math.min(1, actual/target)) : 0;
    var size=100, stroke=10, r=(size-stroke)/2, c=2*Math.PI*r;
    var dash = c*pct;
    return h('svg', {viewBox: '0 0 '+size+' '+size, className:'w-24 h-24'},
      h('circle', {cx:size/2, cy:size/2, r:r, strokeWidth:stroke, className:'fill-none stroke-gray-200'}),
      h('circle', {cx:size/2, cy:size/2, r:r, strokeWidth:stroke, className:'fill-none stroke-indigo-600', strokeLinecap:'round',
                   strokeDasharray: (dash+' '+(c-dash)), transform: 'rotate(-90 '+(size/2)+' '+(size/2)+')'}),
      h('text', {x:'50%', y:'50%', dominantBaseline:'middle', textAnchor:'middle', className:'fill-current text-sm'}, Math.round(pct*100)+'%')
    );
  }
  function LineChart(props){
    var data = props.data || [];
    var w = 420, hgt = 120, pad=24;
    var maxY = 1;
    for (var i=0;i<data.length;i++){ maxY = Math.max(maxY, data[i].a||0, data[i].t||0, data[i].avg||0); }
    var maxX = data.length || 1;
    function sx(x){ return pad + (x-1)/(maxX-1||1)*(w-2*pad); }
    function sy(y){ return hgt-pad - (y/maxY)*(hgt-2*pad); }
    function pathFor(field){
      if(!data.length) return '';
      var d = 'M '+sx(1)+' '+sy(data[0][field]);
      for (var i=2;i<=data.length;i++){ d += ' L '+sx(i)+' '+sy(data[i-1][field]); }
      return d;
    }
    return h('svg', {viewBox:'0 0 '+w+' '+hgt, className:'w-full h-[140px]'},
      h('line', {x1:pad, y1:hgt-pad, x2:w-pad, y2:hgt-pad, className:'stroke-gray-300'}),
      h('line', {x1:pad, y1:pad, x2:pad, y2:hgt-pad, className:'stroke-gray-300'}),
      h('path', {d:pathFor('t'), className:'fill-none', style:{stroke:'#818cf8', strokeDasharray:'4 4', strokeWidth:2}}),
      h('path', {d:pathFor('a'), className:'fill-none', style:{stroke:'#059669', strokeWidth:2}}),
      data[0] && data[0].avg!=null ? h('path', {d:pathFor('avg'), className:'fill-none', style:{stroke:'#6b7280', strokeDasharray:'2 3', strokeWidth:2}}) : null
    );
  }
  function WeeklyStackedBar(props){
    var weeks = props.weeks || []; // [{week, target, actual}]
    var w = 420, hgt = 140, pad=28, barW=24, gap=18;
    var maxY = 1;
    for (var i=0;i<weeks.length;i++){ maxY = Math.max(maxY, weeks[i].target, weeks[i].actual); }
    function sx(i){ return pad + i*(barW+gap); }
    function sy(y){ return hgt-pad - (y/maxY)*(hgt-2*pad); }
    var bars = [];
    for (var i=0;i<weeks.length;i++){
      var wk = weeks[i];
      var x = sx(i);
      var yT = sy(wk.target), hT = (hgt-pad) - yT;
      var yA = sy(wk.actual), hA = (hgt-pad) - yA;
      bars.push(
        h('rect', {key:'t'+i, x:x, y:yT, width:barW, height:hT, fill:'#c7d2fe'}),
        h('rect', {key:'a'+i, x:x, y:yA, width:barW, height:hA, fill:'#34d399', opacity:0.9})
      );
      bars.push(h('text',{key:'lbl'+i, x:x+barW/2, y:hgt-6, textAnchor:'middle', className:'fill-gray-700 text-[10px]'}, 'W'+(i+1)));
    }
    return h('svg', {viewBox:'0 0 '+w+' '+hgt, className:'w-full h-[160px]'}, 
      h('line', {x1:pad, y1:hgt-pad, x2:w-pad, y2:hgt-pad, className:'stroke-gray-300'}),
      h('line', {x1:pad, y1:pad, x2:pad, y2:hgt-pad, className:'stroke-gray-300'}),
      bars
    );
  }

  // Leave helpers
  var LEAVE_NONE = '';
  var LEAVE_AL = 'AL';       // Annual leave
  var LEAVE_SLM = 'SL_MC';   // Sick leave with medical certificate
  var LEAVE_SLN = 'SL_NO';   // Sick leave without medical certificate
  function leaveLabel(code){
    if(code===LEAVE_AL) return 'Annual';
    if(code===LEAVE_SLM) return 'Sick (MC)';
    if(code===LEAVE_SLN) return 'Sick (No MC)';
    return '';
  }

  function App(){
    var _titleInit='ORA', _logoInit='';
    try { _titleInit = localStorage.getItem('wl_title') || 'ORA'; } catch(e){}
    try { _logoInit = localStorage.getItem('wl_logo') || ''; } catch(e){}

    var today = new Date();
    var [appTitle,setAppTitle] = useState(_titleInit);
    var [logoUrl,setLogoUrl] = useState(_logoInit);
    var [year,setYear] = useState(today.getFullYear());
    var [month,setMonth] = useState(today.getMonth());
    var [compact,setCompact] = useState(false);

    var storeInit = {}; try { var raw = localStorage.getItem(STORAGE_KEY); storeInit = raw? JSON.parse(raw) : {}; } catch(e){ storeInit={}; }
    if(!storeInit.meta) storeInit.meta = { annualCarry:{}, autoLeave8:true };
    if(storeInit.meta.autoLeave8===undefined) storeInit.meta.autoLeave8 = true;
    var [store,setStore] = useState(storeInit);
    var ym = ymKey(year, month);
    var monthState = store[ym] || { hoursByDay:{}, holidays:{}, longDay:0, holidayNames:{}, notesByDay:{}, leavesByDay:{} };
    var [hoursByDay,setHoursByDay] = useState(monthState.hoursByDay || {});
    var [holidays,setHolidays] = useState(monthState.holidays || {}); // bool map
    var [holidayNames,setHolidayNames] = useState(monthState.holidayNames || {}); // name map
    var [longDay,setLongDay] = useState(typeof monthState.longDay==='number' ? monthState.longDay : 0);
    var [notesByDay,setNotesByDay] = useState(monthState.notesByDay || {});
    var [leavesByDay,setLeavesByDay] = useState(monthState.leavesByDay || {});
    var annualCarryInit = (store.meta && store.meta.annualCarry && (store.meta.annualCarry[String(year)] || 0)) || 0;
    var [annualCarry,setAnnualCarry] = useState(annualCarryInit);
    var [autoLeave8,setAutoLeave8] = useState(!!(store.meta && store.meta.autoLeave8));

    useEffect(function(){
      var next = {}; for (var k in store) next[k]=store[k];
      if(!next.meta) next.meta = { annualCarry:{}, autoLeave8:autoLeave8 };
      next[ym] = { hoursByDay:hoursByDay, holidays:holidays, longDay:longDay, holidayNames:holidayNames, notesByDay:notesByDay, leavesByDay:leavesByDay };
      next.meta.annualCarry[String(year)] = Number(annualCarry)||0;
      next.meta.autoLeave8 = !!autoLeave8;
      setStore(next);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch(e){}
      document.body.classList.toggle('compact', !!compact);
    }, [ym, hoursByDay, holidays, longDay, holidayNames, notesByDay, leavesByDay, compact, annualCarry, autoLeave8]);

    var totalDays = daysInMonth(year, month);
    function buildRows(){
      var out=[], cur=[null,null,null,null,null,null,null];
      for (var d=1; d<=totalDays; d++){
        var wd = new Date(year,month,d).getDay();
        if (isWeekendIndex(wd)) continue;
        if (wd===0 && cur.some(function(c){return c!==null;})){ out.push(cur); cur=[null,null,null,null,null,null,null]; }
        cur[wd]=d;
        var next = new Date(year,month,d+1);
        var newWeek = next.getDay()===0 || d===totalDays;
        if (newWeek){ out.push(cur); cur=[null,null,null,null,null,null,null]; }
      }
      if (cur.some(function(c){return c!==null;})) out.push(cur);
      return out.map(function(r){ return [r[0],r[1],r[2],r[3],r[4]]; });
    }
    var rows = useMemo(buildRows, [year,month,totalDays]);
    var workingDays = useMemo(function(){ return rows.reduce(function(a,r){ return a + r.filter(Boolean).length; },0); }, [rows]);
    var targetMonthlyHours = workingDays*DAILY_TARGET;
    var actualMonthlyHours = useMemo(function(){
      var s=0; Object.keys(hoursByDay).forEach(function(k){ s += Number(hoursByDay[k])||0; }); return s;
    }, [hoursByDay]);
    var diff = actualMonthlyHours - targetMonthlyHours;
    var monthLabel = useMemo(function(){ return new Date(year,month,1).toLocaleDateString(undefined,{month:'long',year:'numeric'}); }, [year,month]);

    // Weekly summaries
    var weekly = useMemo(function(){
      var out=[];
      rows.forEach(function(r, i){
        var days = r.filter(Boolean);
        var sum = days.reduce(function(s,d){ return s + (Number(hoursByDay[d])||0); }, 0);
        var target = days.length * DAILY_TARGET;
        out.push({week:i+1, actual:sum, target:target, avg: days.length? sum/days.length : 0});
      });
      return out;
    }, [rows, hoursByDay]);

    // Rolling average (5-day) & cumulative
    var enteredDayList = useMemo(function(){
      var arr=[]; rows.forEach(function(r){ r.forEach(function(d){ if(d) arr.push(d); }); }); return arr;
    }, [rows]);
    var cumulative = [];
    var cum=0, targetCum=0, cIdx=0;
    var roll = []; // last 5 days
    enteredDayList.forEach(function(d){
      cIdx++;
      var val = Number(hoursByDay[d])||0;
      cum += val; targetCum += DAILY_TARGET;
      roll.push(val); if(roll.length>5) roll.shift();
      var avg = roll.length? (roll.reduce(function(a,b){return a+b;},0)/roll.length) : 0;
      cumulative.push({x:cIdx, a:cum, t:targetCum, avg:avg});
    });

    // Overtime tracker
    var overtimeTotal = useMemo(function(){
      var s=0; Object.keys(hoursByDay).forEach(function(k){ var v=Number(hoursByDay[k])||0; s+= Math.max(0, v-DAILY_TARGET); }); return s;
    }, [hoursByDay]);

    // Year-wide leave usage: scan store for the same year
    function computeYearLeaveUsage(y){
      var usedAL=0, usedSLM=0, usedSLN=0;
      for (var key in store){
        if(!/^\d{4}-\d{2}$/.test(key)) continue;
        var parts = key.split('-'); var yy = Number(parts[0]);
        if (yy!==y) continue;
        var ms = store[key];
        if(ms && ms.leavesByDay){
          for(var d in ms.leavesByDay){
            var code = ms.leavesByDay[d];
            if(code===LEAVE_AL) usedAL++;
            else if(code===LEAVE_SLM) usedSLM++;
            else if(code===LEAVE_SLN) usedSLN++;
          }
        }
      }
      return { usedAL:usedAL, usedSLM:usedSLM, usedSLN:usedSLN };
    }
    var leaveYTD = computeYearLeaveUsage(year);

    // Balances & rules
    var annualEntitlement = 30 + (Number(annualCarry)||0);
    var annualUsed = leaveYTD.usedAL;
    var annualRemaining = Math.max(0, annualEntitlement - annualUsed);
    var sickTotalEnt = 10;
    var sickUsedTotal = leaveYTD.usedSLM + leaveYTD.usedSLN;
    var sickRemainingTotal = Math.max(0, sickTotalEnt - sickUsedTotal);
    var sickNoMCLimit = 3;
    var sickNoMCRemaining = Math.max(0, sickNoMCLimit - leaveYTD.usedSLN);

    // Actions
    function setHoliday(d){
      var name = holidayNames[d];
      // toggle
      var nowOn = !holidays[d];
      setHolidays(function(prev){ var n={}; for (var k in prev) n[k]=prev[k]; if(prev[d]) delete n[d]; else n[d]=true; return n; });
      setHolidayNames(function(prev){
        var n={}; for (var k in prev) n[k]=prev[k];
        if (nowOn){
          var newName = (name && name.trim()) || prompt('Holiday name (optional)', name||'');
          if (newName) n[d]=newName;
        } else {
          delete n[d];
        }
        return n;
      });
      // holidays do not auto-set hours here; independent from leave rule
    }

    function cycleLeave(d){
      var cur = leavesByDay[d] || LEAVE_NONE;
      var next = LEAVE_NONE;
      if(cur===LEAVE_NONE) next = LEAVE_AL;
      else if(cur===LEAVE_AL) next = LEAVE_SLM;
      else if(cur===LEAVE_SLM) next = LEAVE_SLN;
      else next = LEAVE_NONE;
      setLeavesByDay(function(prev){ var n={}; for (var k in prev) n[k]=prev[k]; if(next) n[d]=next; else delete n[d]; return n; });
      if(next!==LEAVE_NONE && autoLeave8){
        setHoursByDay(function(prev){ var n={}; for (var k in prev) n[k]=prev[k]; n[d]=DAILY_TARGET; return n; });
      }
    }

    function fillAll(){
      var next={}; for (var k in hoursByDay) next[k]=hoursByDay[k];
      rows.forEach(function(row){
        row.forEach(function(d,j){
          if(!d) return;
          var base = (j===longDay)? 9.5 : DAILY_TARGET;
          next[d] = holidays[d] ? DAILY_TARGET : base;
          if(leavesByDay[d] && autoLeave8) next[d] = DAILY_TARGET; // leave overrides to 8h when toggle on
        });
      });
      setHoursByDay(next);
    }
    function clearAll(){ setHoursByDay({}); }

    function exportCSV(){
      var lines = ["day,weekday,hours,holiday,holiday_name,leave"];
      for (var d=1; d<=daysInMonth(year,month); d++){
        var wd = new Date(year,month,d).getDay(); if (isWeekendIndex(wd)) continue;
        var wk = WEEKDAYS[wd];
        var v = hoursByDay[d]; v = (v===undefined || v===null)? '' : v;
        var hol = holidays[d] ? 'yes' : '';
        var nm = holidayNames[d] || '';
        var lv = leavesByDay[d] || '';
        lines.push(d + "," + wk + "," + v + "," + hol + "," + nm + "," + lv);
      }
      var blob = new Blob([lines.join(String.fromCharCode(10))], { type:'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href = url; a.download = "ora_timesheet_" + ymKey(year,month) + ".csv";
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }
    function exportExcelXLS(){
      var html = '<table border=\"1\"><tr><th>Day</th><th>Weekday</th><th>Hours</th><th>Holiday</th><th>Holiday name</th><th>Leave</th></tr>';
      for (var d=1; d<=daysInMonth(year,month); d++){
        var wd = new Date(year,month,d).getDay(); if (isWeekendIndex(wd)) continue;
        var wk = WEEKDAYS[wd];
        var v = hoursByDay[d]; v = (v===undefined || v===null)? '' : Number(v).toFixed(2);
        var hol = holidays[d] ? 'Yes' : '';
        var nm = holidayNames[d] || '';
        var lv = leavesByDay[d] || '';
        html += '<tr><td>'+d+'</td><td>'+wk+'</td><td>'+v+'</td><td>'+hol+'</td><td>'+nm+'</td><td>'+lv+'</td></tr>';
      }
      html += '</table>';
      var blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href=url; a.download='ora_timesheet_'+ymKey(year,month)+'.xls';
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }
    function exportJSON(){
      var payload = { store: store, exportedAt: new Date().toISOString(), version: '1.9.1-react-umd' };
      var blob = new Blob([JSON.stringify(payload,null,2)], { type:'application/json;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href = url; a.download = "ora_backup_" + ymKey(year,month) + ".json";
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }
    function exportPDF(){
      var w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700'); if(!w) return;
      var style = 'body{font-family:sans-serif;margin:24px;color:#111}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px;font-size:12px;text-align:right}th:first-child,td:first-child{text-align:left}.muted{color:#666}';
      var monthName = new Date(year,month,1).toLocaleDateString(undefined,{month:'long', year:'numeric'});
      var rowsHtml = '';
      for (var d=1; d<=daysInMonth(year,month); d++){
        var wd = new Date(year,month,d).getDay(); if (isWeekendIndex(wd)) continue;
        var wk = WEEKDAYS[wd]; var v = hoursByDay[d]; v = (v===undefined || v===null)? '' : v;
        var hol = holidays[d] ? (holidayNames[d]||'Holiday') : '';
        var lv = leavesByDay[d] ? leaveLabel(leavesByDay[d]) : '';
        rowsHtml += '<tr><td>'+wk+' '+d+'</td><td>'+(v!==''?Number(v).toFixed(2):'')+'</td><td>'+hol+'</td><td>'+lv+'</td></tr>';
      }
      var summary = '<table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>'
        + '<tr><td>Daily target</td><td>'+ (DAILY_TARGET).toFixed(2) + ' h</td></tr>'
        + '<tr><td>Target hours</td><td>'+ (workingDays*DAILY_TARGET).toFixed(2) + ' h</td></tr>'
        + '<tr><td>Actual hours</td><td>'+ (actualMonthlyHours).toFixed(2) + ' h</td></tr>'
        + '<tr><td>'+(diff>=0?'Exceed':'Shortage')+'</td><td>'+ Math.abs(diff).toFixed(2) + ' h</td></tr>'
        + '</tbody></table>';

      var leaveSummary = '<table style=\"margin-top:16px\"><thead><tr><th>Leave</th><th>Used</th><th>Remaining</th></tr></thead><tbody>'
        + '<tr><td>Annual (30 + carry-in '+(Number(annualCarry)||0)+')</td><td>'+ (annualUsed) +'</td><td>'+ (annualRemaining) +'</td></tr>'
        + '<tr><td>Sick (MC)</td><td>'+ (leaveYTD.usedSLM) +'</td><td class=\"muted\">—</td></tr>'
        + '<tr><td>Sick (No MC) (max 3)</td><td>'+ (leaveYTD.usedSLN) +'</td><td>'+ (sickNoMCRemaining) +'</td></tr>'
        + '<tr><td>Sick Total (max 10)</td><td>'+ (sickUsedTotal) +'</td><td>'+ (sickRemainingTotal) +'</td></tr>'
        + '</tbody></table>';

      var printScript = '<scr'+'ipt>window.onload=()=>window.print()<\\/scr'+'ipt>';
      var html = '<!doctype html><html><head><meta charset="utf-8"><title>ORA Report</title><style>'+style+'</style></head>'
        + '<body><h1>ORA — '+monthName+'</h1>'+summary+leaveSummary
        + '<h2>Daily entries (Sun–Thu)</h2><table><thead><tr><th>Day</th><th>Hours</th><th>Holiday</th><th>Leave</th></tr></thead><tbody>'+rowsHtml+'</tbody></table>'
        + printScript + '</body></html>';
      w.document.open(); w.document.write(html); w.document.close();
    }

    // Simple Q&A (local heuristics)
    function answerQuery(q){
      q = String(q||'').toLowerCase().trim();
      if(!q) return 'Type a question like "overtime?", "shortage?", "total?", "target?", "forecast?".';
      if(q.includes('overtime')) return 'Overtime (sum above 8h days): '+fmt(overtimeTotal)+'h';
      if(q.includes('shortage')) return (diff<0? 'Shortage: ':'No shortage. Exceed: ') + fmt(Math.abs(diff)) + 'h';
      if(q.includes('total')) return 'Actual total: '+fmt(actualMonthlyHours)+'h';
      if(q.includes('target')) return 'Target total: '+fmt(targetMonthlyHours)+'h';
      if(q.includes('forecast') || q.includes('remaining')){
        var blanks=0; rows.forEach(function(r){ r.forEach(function(d){ if(d && (hoursByDay[d]==null)) blanks++; }); });
        var need = Math.max(0, targetMonthlyHours - actualMonthlyHours);
        var per = blanks? need/blanks : 0;
        return 'Need '+fmt(need)+'h more ('+fmt(per)+'h/day on '+blanks+' blank days).';
      }
      if(q.includes('best') && q.includes('weekday')){
        var sums=[0,0,0,0,0], counts=[0,0,0,0,0];
        rows.forEach(function(r){ r.forEach(function(d,j){ if(d && hoursByDay[d]!=null){ sums[j]+=Number(hoursByDay[d])||0; counts[j]++; } }); });
        var best=0, bestAvg=-1; for(var i=0;i<5;i++){ var avg=counts[i]?sums[i]/counts[i]:0; if(avg>bestAvg){bestAvg=avg; best=i;} }
        return 'Best weekday so far: '+WEEKDAYS[best]+' ('+fmt(bestAvg)+'h avg)';
      }
      return 'I can answer: overtime, shortage, total, target, forecast, remaining, best weekday.';
    }
    function reachDateFor(x){
      x = Number(x)||0;
      var blanks=[]; rows.forEach(function(r){ r.forEach(function(d){ if(d && (hoursByDay[d]==null)) blanks.push(d); }); });
      var need = Math.max(0, targetMonthlyHours - actualMonthlyHours);
      var accum=0, reach='Not this month';
      for(var i=0;i<blanks.length;i++){ accum += x; if(accum>=need){ reach = WEEKDAYS[new Date(year,month,blanks[i]).getDay()]+' '+blanks[i]; break; } }
      return reach;
    }

    // Keyboard shortcuts: F fill, C clear, H toggle holiday today
    useEffect(function(){
      function onKey(e){
        if (e.target && (e.target.tagName==='INPUT' || e.target.tagName==='TEXTAREA')) return;
        var k = e.key.toLowerCase();
        if (k==='f'){ fillAll(); }
        if (k==='c'){ clearAll(); }
        if (k==='h'){
          var td = new Date().getDate();
          var tm = new Date().getMonth(), ty = new Date().getFullYear();
          if (tm===month && ty===year && td){ setHoliday(td); }
        }
      }
      window.addEventListener('keydown', onKey);
      return function(){ window.removeEventListener('keydown', onKey); };
    }, [year, month, holidays, holidayNames, hoursByDay]);

    // UI
    return h('div', {className:'min-h-screen w-full'},
      h('div', {className:'max-w-7xl mx-auto p-6'},

        // Header
        h('header', {className:'mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'},
          h('div', {className:'flex items-center gap-2'},
            logoUrl ? h('img', {src:logoUrl, alt:'', className:'w-8 h-8 object-contain rounded hidden sm:block'}) : null,
            h('input', {value:appTitle, onChange:function(e){setAppTitle(e.target.value);}, className:'text-2xl font-bold bg-transparent w-[320px]'})
          ),
          h('div', {className:'flex flex-wrap gap-2 items-center'},
            h('button', {onClick:function(){setYear(function(y){return y-1;});}, className:'px-2 py-1 rounded-lg bg-gray-200'}, '« Year'),
            h('button', {onClick:function(){ var m=month-1; if(m<0){setMonth(11); setYear(function(y){return y-1;});} else setMonth(m); }, className:'px-2 py-1 rounded-lg bg-gray-200'}, '◀'),
            h('h1', {className:'text-xl font-semibold min-w-[180px] text-center'}, monthLabel),
            h('button', {onClick:function(){ var m=month+1; if(m>11){setMonth(0); setYear(function(y){return y+1;});} else setMonth(m); }, className:'px-2 py-1 rounded-lg bg-gray-200'}, '▶'),
            h('button', {onClick:function(){setYear(function(y){return y+1;});}, className:'px-2 py-1 rounded-lg bg-gray-200'}, 'Year »'),
            h('label', {className:'text-sm ml-2'}, 'Jump',
              h('select', {value:ym, onChange:function(e){ var parts=e.target.value.split('-'); setYear(Number(parts[0])); setMonth(Number(parts[1])-1); }, className:'ml-2 rounded-lg border px-2 py-1 bg-white'},
                (function(){ var arr=[]; var now=new Date(); for (var k=-24;k<12;k++){ var dt=new Date(now.getFullYear(), now.getMonth()+k, 1); var val=dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); arr.push(h('option',{key:k,value:val}, dt.toLocaleDateString(undefined,{month:'long',year:'numeric'}))); } return arr; })()
              )
            ),
            h('label', {className:'text-sm ml-2'}, 'Long day',
              h('select', {value:String(longDay), onChange:function(e){ setLongDay(Number(e.target.value)); }, className:'ml-2 rounded-lg border px-2 py-1 bg-white'},
                [0,1,2,3,4].map(function(i){ return h('option', {key:i, value:String(i)}, WEEKDAYS[i]); })
              ),
              h('span', {className:'ml-2 chip'}, '9.5h')
            ),
            h('button', {onClick:function(){ var n=new Date(); setYear(n.getFullYear()); setMonth(n.getMonth()); }, className:'px-2 py-1 rounded-lg bg-gray-200'}, 'Reset'),
            h('label', {className:'text-sm ml-2 flex items-center gap-2'},
              h('input', {type:'checkbox', checked:compact, onChange:function(e){ setCompact(e.target.checked); }}),
              'Compact mode'
            ),
            h('label', {className:'text-sm ml-2 flex items-center gap-2'},
              h('input', {type:'checkbox', checked:!!autoLeave8, onChange:function(e){ setAutoLeave8(e.target.checked); }}),
              'Leave sets 8h'
            )
          )
        ),

        // Actions
        h('div', {className:'flex flex-wrap gap-2 mb-3'},
          h('button', {onClick:fillAll, className:'px-3 py-2 rounded-xl bg-gray-900 text-white hover:opacity-90'}, 'Fill all'),
          h('button', {onClick:clearAll, className:'px-3 py-2 rounded-xl bg-gray-200 hover:bg-gray-300'}, 'Clear all'),
          h('button', {onClick:exportCSV, className:'px-3 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700'}, 'Export CSV'),
          h('button', {onClick:exportPDF, className:'px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700'}, 'Export PDF'),
          h('button', {onClick:exportExcelXLS, className:'px-3 py-2 rounded-xl bg-emerald-700 text-white hover:opacity-90'}, 'Export Excel'),
          h('button', {onClick:exportJSON, className:'px-3 py-2 rounded-xl bg-slate-700 text-white hover:opacity-90'}, 'Backup JSON'),
          h('span', {className:'text-xs text-gray-500 ml-2'}, 'Shortcuts: ', h('span',{className:'kbd'},'F'), ' Fill · ', h('span',{className:'kbd'},'C'), ' Clear · ', h('span',{className:'kbd'},'H'), ' Toggle today holiday')
        ),

        // Leave balances panel
        h('div', {className:'grid md:grid-cols-2 gap-3 mb-4'},
          h('div', {className:'bg-white rounded-xl p-3'},
            h('div', {className:'flex items-center justify-between mb-2'},
              h('h3',{className:'font-semibold'}, 'Leave Balances — ', year),
              h('label', {className:'text-xs flex items-center gap-2'},
                'Annual carry-in (max 10)',
                h('input', {type:'number', min:'0', max:'10', step:'1', value:String(annualCarry),
                  onChange:function(e){ var v=Math.max(0,Math.min(10, Number(e.target.value)||0)); setAnnualCarry(v); },
                  className:'w-16 rounded border px-2 py-1'})
              )
            ),
            h('div', {className:'grid sm:grid-cols-3 gap-2 text-sm'},
              h('div', {className:'bg-indigo-50 rounded p-2'},
                h('div', {className:'text-gray-600'}, 'Annual'),
                h('div', {className:'text-lg font-bold'}, annualUsed, ' / ', annualEntitlement),
                h('div', {className:'text-xs text-gray-500'}, 'Remaining: ', annualRemaining)
              ),
              h('div', {className:'bg-emerald-50 rounded p-2'},
                h('div', {className:'text-gray-600'}, 'Sick (total 10)'),
                h('div', {className:'text-lg font-bold'}, sickUsedTotal, ' / 10'),
                h('div', {className:'text-xs text-gray-500'}, 'Remaining: ', sickRemainingTotal)
              ),
              h('div', {className:'bg-amber-50 rounded p-2'},
                h('div', {className:'text-gray-600'}, 'Sick (No MC max 3)'),
                h('div', {className:'text-lg font-bold'}, leaveYTD.usedSLN, ' / 3'),
                h('div', {className:'text-xs text-gray-500'}, 'Remaining: ', sickNoMCRemaining)
              )
            ),
            (sickNoMCRemaining===0 && leaveYTD.usedSLN>0) ? h('div',{className:'text-xs text-amber-700 mt-2'},'Note: You have reached the limit for Sick (No MC).') : null
          ),
          h('div', {className:'bg-white rounded-xl p-3'},
            h('div', {className:'text-sm text-gray-600 mb-1'}, 'How to use'),
            h('ul', {className:'list-disc pl-5 text-sm text-gray-700 space-y-1'},
              h('li', null, 'Click ', h('span',{className:'badge',style:{background:'#e5e7eb'}},'H'), ' to toggle a holiday (sets name optionally).'),
              h('li', null, 'Click ', h('span',{className:'badge',style:{background:'#fef9c3'}},'Leave'), ' to cycle: None → Annual → Sick (MC) → Sick (No MC).'),
              h('li', null, 'Toggle "', h('b',null,'Leave sets 8h'), '" in the header to auto-set daily hours to 8 when a leave is applied.'),
              h('li', null, 'Exports include leave type and holiday name.')
            )
          )
        ),

        // Summary cards + progress
        h('div', {className:'grid lg:grid-cols-3 gap-3 mb-4 items-stretch'},
          h('div', {className:'bg-white rounded-xl p-3'},
            h('div', {className:'text-sm text-gray-600'}, 'Target hours'),
            h('div', {className:'text-xl font-bold'}, fmt(targetMonthlyHours)),
            h('div', {className:'text-xs text-gray-500 mt-1'}, 'Working days × ', fmt(DAILY_TARGET), ' h')
          ),
          h('div', {className:'bg-white rounded-xl p-3'},
            h('div', {className:'text-sm text-gray-600'}, 'Actual hours'),
            h('div', {className:'text-xl font-bold'}, fmt(actualMonthlyHours)),
            h('div', {className:'text-xs text-gray-500 mt-1'}, 'Overtime total: ', fmt(overtimeTotal), ' h')
          ),
          h('div', {className:'rounded-xl p-3 bg-white flex items-center gap-3'},
            h('div', {className:'shrink-0'}, h(ProgressRing, {actual:actualMonthlyHours, target:targetMonthlyHours})),
            h('div', null,
              h('div', {className:'text-sm font-semibold'}, diff>=0? 'Exceed by':'Shortage of'),
              h('div', {className:'text-xl font-bold'}, fmt(Math.abs(diff)), ' h')
            )
          )
        ),

        // Weekly summary cards
        h('div', {className:'grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4'},
          weekly.map(function(w){ 
            return h('div',{key:w.week, className:'bg-white rounded-xl p-3'},
              h('div',{className:'text-xs text-gray-500 mb-1'}, 'Week ', w.week),
              h('div', null,
                h('div',{className:'text-sm'}, 'Actual: ', h('b',null,fmt(w.actual)), ' h'),
                h('div',{className:'text-sm'}, 'Target: ', h('b',null,fmt(w.target)), ' h'),
                h('div',{className:'text-xs text-gray-500 mt-1'}, 'Avg/day: ', fmt(w.avg))
              )
            );
          })
        ),

        // Daily grid
        h('div', {className:'bg-white rounded-2xl shadow p-4'},
          h('div', {className:'flex items-center justify-between mb-3'},
            h('h3', {className:'font-semibold'}, 'Daily entries (Sun–Thu)'),
            h('div', {className:'text-xs text-gray-500'}, 'H = holiday (optional name). Leave button cycles AL / Sick(MC) / Sick(No MC).')
          ),
          h('div', {className:'grid gap-3'},
            rows.map(function(row, ri){
              var weekDaysCount = row.filter(Boolean).length || 1;
              var weekSum = row.reduce(function(s,d){ return s + (d ? (Number(hoursByDay[d])||0) : 0); }, 0);
              var weekAvg = weekSum / weekDaysCount;
              return h('div', {key:'row'+ri, className:'border rounded-xl p-2'},
                h('div', {className:'flex items-center justify-between mb-2'},
                  h('div', {className:'text-sm'}, 'Week ', (ri+1), ' — Subtotal ', h('b', null, fmt(weekSum)),'h · Avg ', h('b', null, fmt(weekAvg)), 'h/day')
                ),
                h('div', {className:'grid gap-2', style:{gridTemplateColumns:'repeat('+row.length+', minmax(0,1fr))'}},
                  row.map(function(dayNum, j){
                    var isLongCol = (j===longDay);
                    var isToday = (new Date().getFullYear()===year && new Date().getMonth()===month && new Date().getDate()===dayNum);
                    var holiday = !!holidays[dayNum];
                    var leave = leavesByDay[dayNum] || LEAVE_NONE;
                    var cellCls = 'rounded-xl border p-2 ' + (isLongCol?'bg-indigo-50 ':'') + (isToday?'cell-today':'');
                    return h('div', {key:'c'+j, className:cellCls},
                      dayNum ? h('div', null,
                        h('div', {className:'flex items-center justify-between mb-2'},
                          h('span', {className:'text-xs text-gray-500'}, WEEKDAYS[j], ' ', dayNum),
                          h('div', {className:'flex items-center gap-1'},
                            holiday && holidayNames[dayNum] ? h('span',{className:'chip', title:'Holiday name'}, holidayNames[dayNum]) : null,
                            leave ? h('span', {className:'chip', title:'Leave'}, leaveLabel(leave)) : null,
                            isLongCol ? h('span', {className:'chip', title:'Long day'}, '9.5h') : null,
                            h('button', {title:'Toggle holiday / set name', className:'text-[10px] px-1.5 py-0.5 rounded '+(holiday?'bg-amber-200 text-amber-900':'bg-gray-100'),
                              onClick:function(){ setHoliday(dayNum); }}, 'H'),
                            h('button', {title:'Cycle leave type', className:'text-[10px] px-1.5 py-0.5 rounded bg-yellow-100',
                              onClick:function(){ cycleLeave(dayNum); }}, 'Leave')
                          )
                        ),
                        h('input', {type:'number', step:'0.25', min:'0', className:'w-full rounded-lg border px-2 py-1',
                          value: (hoursByDay[dayNum]===undefined || hoursByDay[dayNum]===null)? '' : hoursByDay[dayNum],
                          onChange:function(e){
                            var v = e.target.value==='' ? NaN : Number(e.target.value);
                            setHoursByDay(function(prev){
                              var n={}; for (var k in prev) n[k]=prev[k];
                              if (isNaN(v)) delete n[dayNum]; else n[dayNum]=v; return n;
                            });
                          }
                        })
                      ) : h('div', {className:'h-7 sm:h-10'})
                    );
                  })
                )
              );
            })
          )
        ),

        // Advanced charts
        h('div', {className:'bg-white rounded-2xl shadow p-4 mt-4 mb-4'},
          h('h3', {className:'font-semibold mb-2'}, 'Weekly Target vs Actual (stacked)'),
          h(WeeklyStackedBar, {weeks: weekly})
        ),
        h('div', {className:'bg-white rounded-2xl shadow p-4 mb-4'},
          h('h3', {className:'font-semibold mb-2'}, 'Cumulative vs Target (with 5-day rolling average)'),
          h(LineChart, {data:cumulative})
        ),

        // Heatmap
        (function HeatmapComp(){
          var days = enteredDayList, getVal = function(d){ var v=hoursByDay[d]; return v==null? null : Number(v); };
          var cols = 7, cell=16, gap=4, pad=6;
          var rowsHM = Math.ceil(days.length/cols);
          var w = cols*cell + (cols-1)*gap + pad*2;
          var hgt = rowsHM*cell + (rowsHM-1)*gap + pad*2;
          function color(v){ if(v==null) return '#e5e7eb'; var p=Math.max(0,Math.min(1,v/8)); var g=Math.round(255*(1-p)), r=Math.round(255*(1-p*0.2)); return 'rgb('+r+','+g+','+200+')'; }
          var rects=[]; for (var i=0;i<days.length;i++){ var d=days[i]; var row=Math.floor(i/cols), col=i%cols; rects.push(h('rect',{key:i,x:pad+col*(cell+gap),y:pad+row*(cell+gap),width:cell,height:cell,rx:3,ry:3, fill:color(getVal(d))})); }
          return h('div',{className:'bg-white rounded-2xl shadow p-4 mb-4'}, [
            h('h3',{key:'h',className:'font-semibold mb-2'},'Heatmap — Daily hours (Sun–Thu)'),
            h('svg',{key:'s',viewBox:'0 0 '+w+' '+hgt, className:'w-full h-[120px]'}, rects)
          ]);
        })(),

        // AI + Insights + Goal Projection
        h('div', {className:'grid lg:grid-cols-3 gap-4 mt-4'},
          h('div', {className:'bg-white rounded-2xl shadow p-4 lg:col-span-1'},
            h('h3', {className:'font-semibold mb-2'}, 'AI Q&A (local)'),
            h('div', {className:'text-xs text-gray-500 mb-2'}, 'Try: "overtime?", "shortage?", "total?", "target?", "forecast?", "remaining?", "best weekday?"'),
            h('input', {id:'qa', className:'rounded border px-2 py-1 w-full mb-2', placeholder:'Ask a question...',
              onKeyDown:function(e){ if(e.key==='Enter'){ var ans = answerQuery(e.target.value); var el = document.getElementById('qa_out'); if(el) el.textContent = ans; } } }),
            h('div', {id:'qa_out', className:'text-sm bg-gray-50 rounded p-2 min-h-[36px]'})
          ),
          h('div', {className:'bg-white rounded-2xl shadow p-4 lg:col-span-2'},
            h('h3', {className:'font-semibold mb-2'}, 'Insights & Projection'),
            h('div', {className:'text-xs text-gray-500 mb-2'}, 'You worked ', fmt(actualMonthlyHours), 'h out of ', fmt(targetMonthlyHours), 'h.'),
            h('div', {className:'text-xs text-gray-500 mb-2'}, 'Overtime (sum over 8h days): ', fmt(overtimeTotal), 'h.'),
            h('div', {className:'text-xs text-gray-500 mb-3'}, '5-day rolling avg helps visualize momentum in the cumulative chart.'),
            h('div', {className:'flex flex-wrap items-end gap-3'},
              h('label', {className:'text-sm'}, 'If I work (h/day)',
                h('input', {type:'number', step:'0.25', min:'0', defaultValue:'8', id:'projX', className:'ml-2 rounded border px-2 py-1 w-24'})
              ),
              h('button', {className:'px-2 py-1 rounded bg-gray-200', onClick:function(){
                var el = document.getElementById('projX'); var x = Number(el && el.value || 0);
                var ans = reachDateFor(x);
                var out = document.getElementById('proj_out'); if(out) out.textContent = 'Reach target by: ' + ans;
              }}, 'Project'),
              h('div', {id:'proj_out', className:'text-sm text-gray-700'})
            )
          )
        ),

        // Footer + mobile totals
        h('footer', {className:'text-xs text-gray-500 mt-6 text-center'}, 'ORA V1.9.1 (React UMD) · Fri+Sat weekend · Daily target 8h · Weekly summaries · Stacked bars · Rolling avg · Editable holidays · Leave tracking (toggle sets 8h) · Overtime · Compact mode · Shortcuts'),
        h('div', {id:'totalsBar', className:'sm:hidden mt-3'},
          h('div', {className:'text-xs'}, 'Target: ', h('b', null, fmt(targetMonthlyHours)), 'h'),
          h('div', {className:'text-xs'}, 'Actual: ', h('b', null, fmt(actualMonthlyHours)), 'h'),
          h('div', {className:'text-xs'}, (diff>=0?'Exceed':'Shortage'), ': ', h('b', null, fmt(Math.abs(diff))), 'h')
        )
      )
    );
  }

  var mount = document.getElementById('root');
  try{
    var root = ReactDOM.createRoot(mount);
    root.render(h(App));
  }catch(err){
    console.error('Render error:', err);
    mount.innerHTML = '<div style="padding:1rem;background:#fee2e2;color:#7f1d1d;border-radius:.5rem;">App failed to load. Open the console and share the error message.</div>';
  }
})();