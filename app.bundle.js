(function(){
  'use strict';
  var React = window.React, ReactDOM = window.ReactDOM;
  var h = React.createElement;
  var useState = React.useState, useEffect = React.useEffect, useMemo = React.useMemo;

  var STORAGE_KEY = 'timesheet-react-umd-1.8.3';
  var WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var DAILY_TARGET = 8;

  function daysInMonth(year, monthIndex0){ return new Date(year, monthIndex0+1, 0).getDate(); }
  function fmt(n){ return (Math.round(n*100)/100).toFixed(2); }
  function isWeekendIndex(wd){ return wd===5 || wd===6; } // Fri+Sat
  function ymKey(y,m){ return y+'-'+String(m+1).padStart(2,'0'); }

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
    for (var i=0;i<data.length;i++){ maxY = Math.max(maxY, data[i].a, data[i].t); }
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
      h('path', {d:pathFor('a'), className:'fill-none', style:{stroke:'#059669', strokeWidth:2}})
    );
  }

  function Heatmap(props){
    var days = props.days, getVal = props.getVal;
    var cols = 7, cell=16, gap=4, pad=6;
    var rows = Math.ceil(days.length/cols);
    var w = cols*cell + (cols-1)*gap + pad*2;
    var hgt = rows*cell + (rows-1)*gap + pad*2;
    function color(v){
      if(v==null) return '#e5e7eb';
      var p = Math.max(0, Math.min(1, v/8));
      var g = Math.round(255*(1-p)), r = Math.round(255*(1-p*0.2));
      return 'rgb('+r+','+g+','+200+')';
    }
    var rects = [];
    for (var i=0;i<days.length;i++){
      var d = days[i];
      var row = Math.floor(i/cols), col=i%cols;
      rects.push(h('rect', {key:i, x:pad+col*(cell+gap), y:pad+row*(cell+gap), width:cell, height:cell, rx:3, ry:3,
        fill: color(getVal(d)) }));
    }
    return h('svg', {viewBox:'0 0 '+w+' '+hgt, className:'w-full h-[120px]'}, rects);
  }

  function App(){
    var _titleInit='TimeSheet', _logoInit='';
    try { _titleInit = localStorage.getItem('wl_title') || 'TimeSheet'; } catch(e){}
    try { _logoInit = localStorage.getItem('wl_logo') || ''; } catch(e){}

    var today = new Date();
    var [appTitle,setAppTitle] = React.useState(_titleInit);
    var [logoUrl,setLogoUrl] = React.useState(_logoInit);
    var [year,setYear] = React.useState(today.getFullYear());
    var [month,setMonth] = React.useState(today.getMonth());

    var storeInit = {}; try { var raw = localStorage.getItem(STORAGE_KEY); storeInit = raw? JSON.parse(raw) : {}; } catch(e){ storeInit={}; }
    var [store,setStore] = React.useState(storeInit);
    var ym = ymKey(year, month);
    var monthState = store[ym] || { hoursByDay:{}, holidays:{}, longDay:0, notesByDay:{} };
    var [hoursByDay,setHoursByDay] = React.useState(monthState.hoursByDay || {});
    var [holidays,setHolidays] = React.useState(monthState.holidays || {});
    var [longDay,setLongDay] = React.useState(typeof monthState.longDay==='number' ? monthState.longDay : 0);
    var [notesByDay,setNotesByDay] = React.useState(monthState.notesByDay || {});

    React.useEffect(function(){
      var next = {}; for (var k in store) next[k]=store[k];
      next[ym] = { hoursByDay:hoursByDay, holidays:holidays, longDay:longDay, notesByDay:notesByDay };
      setStore(next);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch(e){}
    }, [ym, hoursByDay, holidays, longDay, notesByDay]);

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
    var rows = React.useMemo(buildRows, [year,month,totalDays]);

    var workingDays = React.useMemo(function(){ return rows.reduce(function(a,r){ return a + r.filter(Boolean).length; },0); }, [rows]);
    var targetMonthlyHours = workingDays*DAILY_TARGET;
    var actualMonthlyHours = React.useMemo(function(){
      var s=0; Object.keys(hoursByDay).forEach(function(k){ s += Number(hoursByDay[k])||0; }); return s;
    }, [hoursByDay]);
    var diff = actualMonthlyHours - targetMonthlyHours;
    var pct = targetMonthlyHours>0 ? (actualMonthlyHours/targetMonthlyHours)*100 : 0;
    var monthLabel = React.useMemo(function(){ return new Date(year,month,1).toLocaleDateString(undefined,{month:'long',year:'numeric'}); }, [year,month]);

    var enteredDayList = React.useMemo(function(){
      var arr=[]; rows.forEach(function(r){ r.forEach(function(d){ if(d) arr.push(d); }); }); return arr;
    }, [rows]);
    var enteredDaysCount = enteredDayList.length;
    var avgPerEntered = enteredDaysCount? (actualMonthlyHours/enteredDaysCount) : 0;
    var remainingWorking = workingDays - enteredDaysCount;
    var forecastTotal = actualMonthlyHours + avgPerEntered * remainingWorking;
    var forecastDiff = forecastTotal - targetMonthlyHours;

    var weekdaySums = [0,0,0,0,0], weekdayCounts=[0,0,0,0,0];
    enteredDayList.forEach(function(d){
      var wd = new Date(year,month,d).getDay();
      var idx = wd===0?0:wd;
      var val = Number(hoursByDay[d])||0;
      weekdaySums[idx]+=val; weekdayCounts[idx]+=1;
    });
    var weekdayAvgs = weekdaySums.map(function(s,i){ return weekdayCounts[i]? (s/weekdayCounts[i]) : 0; });

    var cumulative = [];
    var cum=0, targetCum=0, cIdx=0;
    rows.forEach(function(r){
      r.forEach(function(d){
        if(!d) return;
        cIdx++;
        var val = Number(hoursByDay[d])||0;
        cum += val;
        targetCum += DAILY_TARGET;
        cumulative.push({x:cIdx, a:cum, t:targetCum});
      });
    });

    function setHoliday(d){
      setHolidays(function(prev){
        var n={}; for (var k in prev) n[k]=prev[k];
        if(n[d]) delete n[d]; else n[d]=true;
        return n;
      });
      setHoursByDay(function(prev){
        var n={}; for (var k in prev) n[k]=prev[k];
        if(!holidays[d]) n[d] = DAILY_TARGET;
        return n;
      });
    }
    function fillAll(){
      var next={}; for (var k in hoursByDay) next[k]=hoursByDay[k];
      rows.forEach(function(row){
        row.forEach(function(d,j){
          if(!d) return;
          var base = (j===longDay)? 9.5 : DAILY_TARGET;
          next[d] = holidays[d] ? DAILY_TARGET : base;
        });
      });
      setHoursByDay(next);
    }
    function clearAll(){ setHoursByDay({}); }

    function exportCSV(){
      var lines = ["day,weekday,hours,holiday"];
      for (var d=1; d<=daysInMonth(year,month); d++){
        var wd = new Date(year,month,d).getDay(); if (isWeekendIndex(wd)) continue;
        var wk = WEEKDAYS[wd];
        var v = hoursByDay[d]; v = (v===undefined || v===null)? '' : v;
        var hol = holidays[d] ? 'yes' : '';
        lines.push(d + "," + wk + "," + v + "," + hol);
      }
      var blob = new Blob([lines.join(String.fromCharCode(10))], { type:'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href = url; a.download = "timesheet_" + ymKey(year,month) + ".csv";
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }
    function exportJSON(){
      var payload = { store: store, exportedAt: new Date().toISOString(), version: '1.8.3-react-umd' };
      var blob = new Blob([JSON.stringify(payload,null,2)], { type:'application/json;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href = url; a.download = "timesheet_backup_" + ymKey(year,month) + ".json";
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }
    function exportPDF(){
      var w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700'); if(!w) return;
      var style = 'body{font-family:sans-serif;margin:24px;color:#111}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px;font-size:12px;text-align:right}th:first-child,td:first-child{text-align:left}';
      var monthName = new Date(year,month,1).toLocaleDateString(undefined,{month:'long', year:'numeric'});
      var rowsHtml = '';
      for (var d=1; d<=daysInMonth(year,month); d++){
        var wd = new Date(year,month,d).getDay(); if (isWeekendIndex(wd)) continue;
        var wk = WEEKDAYS[wd]; var v = hoursByDay[d]; v = (v===undefined || v===null)? '' : v;
        rowsHtml += '<tr><td>'+wk+' '+d+'</td><td>'+(v!==''?Number(v).toFixed(2):'')+'</td><td>'+(holidays[d]?'Holiday':'')+'</td></tr>';
      }
      var summary = '<table><thead><tr><th>Metric</th><th>Value (h)</th></tr></thead><tbody>'
        + '<tr><td>Daily target</td><td>'+ (DAILY_TARGET).toFixed(2) +'</td></tr>'
        + '<tr><td>Target hours</td><td>'+ (targetMonthlyHours).toFixed(2) +'</td></tr>'
        + '<tr><td>Actual hours</td><td>'+ (actualMonthlyHours).toFixed(2) +'</td></tr>'
        + '<tr><td>'+(diff>=0?'Exceed':'Shortage')+'</td><td>'+ Math.abs(diff).toFixed(2) +'</td></tr>'
        + '</tbody></table>';
      var printScript = '<scr'+'ipt>window.onload=()=>window.print()<\/scr'+'ipt>';
      var html = '<!doctype html><html><head><meta charset="utf-8"><title>TimeSheet Report</title><style>'+style+'</style></head>'
        + '<body><h1>TimeSheet — '+monthName+'</h1>'+summary
        + '<h2>Daily entries (Sun–Thu)</h2><table><thead><tr><th>Day</th><th>Hours</th><th>Note</th></tr></thead><tbody>'+rowsHtml+'</tbody></table>'
        + printScript + '</body></html>';
      w.document.open(); w.document.write(html); w.document.close();
    }

    function monthJumpOptions(){
      var arr = [], now = new Date();
      for (var k=-24;k<12;k++){
        var dt = new Date(now.getFullYear(), now.getMonth()+k, 1);
        var val = dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0');
        arr.push({value: val, label: dt.toLocaleDateString(undefined,{month:'long',year:'numeric'})});
      }
      return arr;
    }
    var jumpOptions = React.useMemo(monthJumpOptions, []);

    function answerQuery(q){
      q = (q||'').toLowerCase();
      if(q.indexOf('overtime')>=0 || q.indexOf('exceed')>=0) return 'Overtime this month: ' + fmt(Math.max(0,diff)) + ' h';
      if(q.indexOf('short')>=0 || q.indexOf('deficit')>=0) return 'Shortage this month: ' + fmt(Math.max(0,-diff)) + ' h';
      if(q.indexOf('total')>=0) return 'Total actual hours: ' + fmt(actualMonthlyHours) + ' h';
      if(q.indexOf('target')>=0) return 'Target hours this month: ' + fmt(targetMonthlyHours) + ' h';
      if(q.indexOf('forecast')>=0 || q.indexOf('predict')>=0) return 'Projected end-of-month: ' + fmt(forecastTotal) + ' h (' + (forecastDiff>=0?'exceed':'shortage') + ' ' + fmt(Math.abs(forecastDiff)) + ' h)';
      return 'Try: "overtime?", "shortage?", "total?", "target?", "forecast?"';
    }

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
                jumpOptions.map(function(opt,i){ return h('option', {key:i, value:opt.value}, opt.label); })
              )
            ),
            h('label', {className:'text-sm ml-2'}, 'Long day',
              h('select', {value:String(longDay), onChange:function(e){ setLongDay(Number(e.target.value)); }, className:'ml-2 rounded-lg border px-2 py-1 bg-white'},
                [0,1,2,3,4].map(function(i){ return h('option', {key:i, value:String(i)}, WEEKDAYS[i]); })
              ),
              h('span', {className:'ml-2 chip'}, '9.5h')
            ),
            h('button', {onClick:function(){ var n=new Date(); setYear(n.getFullYear()); setMonth(n.getMonth()); }, className:'px-2 py-1 rounded-lg bg-gray-200'}, 'Reset')
          )
        ),

        // Actions
        h('div', {className:'flex flex-wrap gap-2 mb-3'},
          h('button', {onClick:fillAll, className:'px-3 py-2 rounded-xl bg-gray-900 text-white hover:opacity-90'}, 'Fill all'),
          h('button', {onClick:clearAll, className:'px-3 py-2 rounded-xl bg-gray-200 hover:bg-gray-300'}, 'Clear all'),
          h('button', {onClick:exportCSV, className:'px-3 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700'}, 'Export CSV'),
          h('button', {onClick:exportPDF, className:'px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700'}, 'Export PDF'),
          h('button', {onClick:exportJSON, className:'px-3 py-2 rounded-xl bg-slate-700 text-white hover:opacity-90'}, 'Backup JSON')
        ),

        // Summary
        h('div', {className:'grid lg:grid-cols-3 gap-3 mb-4 items-stretch'},
          h('div', {className:'bg-white rounded-xl p-3'},
            h('div', {className:'text-sm text-gray-600'}, 'Target hours'),
            h('div', {className:'text-xl font-bold'}, fmt(targetMonthlyHours)),
            h('div', {className:'text-xs text-gray-500 mt-1'}, 'Working days × ', fmt(DAILY_TARGET), ' h')
          ),
          h('div', {className:'bg-white rounded-xl p-3'},
            h('div', {className:'text-sm text-gray-600'}, 'Actual hours'),
            h('div', {className:'text-xl font-bold'}, fmt(actualMonthlyHours)),
            h('div', {className:'text-xs text-gray-500 mt-1'}, 'Completion: ', fmt(pct), '%')
          ),
          h('div', {className:'rounded-xl p-3 bg-white flex items-center gap-3'},
            h('div', {className:'shrink-0'}, h(ProgressRing, {actual:actualMonthlyHours, target:targetMonthlyHours})),
            h('div', null,
              h('div', {className:'text-sm font-semibold'}, diff>=0? 'Exceed by':'Shortage of'),
              h('div', {className:'text-xl font-bold'}, fmt(Math.abs(diff)), ' h'),
              h('div', {className:'text-xs opacity-80 mt-1'}, 'Forecast: ', fmt(forecastTotal), ' h (', (forecastDiff>=0?'exceed':'shortage'), ' ', fmt(Math.abs(forecastDiff)), ' h)')
            )
          )
        ),

        // Grid (Daily entries)
        h('div', {className:'bg-white rounded-2xl shadow p-4'},
          h('div', {className:'flex items-center justify-between mb-3'},
            h('h3', {className:'font-semibold'}, 'Daily entries (Sun–Thu)'),
            h('div', {className:'text-xs text-gray-500'}, 'Toggle H = holiday (sets ', fmt(DAILY_TARGET), 'h). Long day shows 9.5h.')
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
                    var cellCls = 'rounded-xl border p-2 ' + (isLongCol?'bg-indigo-50 ':'') + (isToday?'cell-today':'');
                    return h('div', {key:'c'+j, className:cellCls},
                      dayNum ? h('div', null,
                        h('div', {className:'flex items-center justify-between mb-2'},
                          h('span', {className:'text-xs text-gray-500'}, WEEKDAYS[j], ' ', dayNum),
                          h('div', {className:'flex items-center gap-1'},
                            isLongCol ? h('span', {className:'chip', title:'Long day'}, '9.5h') : null,
                            h('button', {title:'Toggle holiday', className:'text-[10px] px-1.5 py-0.5 rounded '+(holiday?'bg-amber-200 text-amber-900':'bg-gray-100'),
                              onClick:function(){ setHoliday(dayNum); }}, 'H')
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

        // Moved below Daily entries: charts & heatmap
        h('div', {className:'bg-white rounded-2xl shadow p-4 mt-4 mb-4'},
          h('h3', {className:'font-semibold mb-2'}, 'Cumulative vs Target'),
          h(LineChart, {data:cumulative})
        ),
        h('div', {className:'bg-white rounded-2xl shadow p-4 mb-4'},
          h('h3', {className:'font-semibold mb-2'}, 'Heatmap — Daily hours (Sun–Thu)'),
          h(Heatmap, {days: enteredDayList, getVal: function(d){ var v=hoursByDay[d]; return v==null? null : Number(v); }})
        ),

        // AI + Insights (unchanged)
        h('div', {className:'grid lg:grid-cols-2 gap-4 mt-4'},
          h('div', {className:'bg-white rounded-2xl shadow p-4'},
            h('h3', {className:'font-semibold mb-2'}, 'AI Q&A (local)'),
            h('div', {className:'text-xs text-gray-500 mb-2'}, 'Try: "overtime?", "shortage?", "total?", "target?", "forecast?"'),
            h('input', {id:'qa', className:'rounded border px-2 py-1 w-full mb-2', placeholder:'Ask a question...',
              onKeyDown:function(e){ if(e.key==='Enter'){ var ans = answerQuery(e.target.value); var el = document.getElementById('qa_out'); if(el) el.textContent = ans; } } }),
            h('div', {id:'qa_out', className:'text-sm bg-gray-50 rounded p-2 min-h-[36px]'})
          ),
          h('div', {className:'bg-white rounded-2xl shadow p-4'},
            h('h3', {className:'font-semibold mb-2'}, 'Insights'),
            h('div', {className:'text-xs text-gray-500 mb-2'}, 'Monthly summary: You worked ', fmt(actualMonthlyHours), 'h out of ', fmt(targetMonthlyHours), 'h. Forecast indicates ', (forecastDiff>=0?'exceed':'shortage'), ' by ', fmt(Math.abs(forecastDiff)), 'h.'),
            h('div', {className:'text-xs text-gray-500'}, 'Productivity by weekday (avg h): ',
              WEEKDAYS.slice(0,5).map(function(wk,i){ return h('span', {key:i, className:'mr-2'}, wk, ': ', fmt(weekdayAvgs[i]||0)); })
            )
          )
        ),

        // Footer + mobile totals
        h('footer', {className:'text-xs text-gray-500 mt-6 text-center'}, 'V1.8.3 (React UMD) · Fri+Sat weekend · Daily target fixed at 8h · Heatmap & charts & insights'),
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