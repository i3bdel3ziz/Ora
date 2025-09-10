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
    var today = new Date();
    var [year,setYear] = useState(today.getFullYear());
    var [month,setMonth] = useState(today.getMonth());

    var storeInit = {}; try { var raw = localStorage.getItem(STORAGE_KEY); storeInit = raw? JSON.parse(raw) : {}; } catch(e){ storeInit={}; }
    if(!storeInit.meta) storeInit.meta = { annualCarry:{}, autoLeave8:true };
    if(storeInit.meta.autoLeave8===undefined) storeInit.meta.autoLeave8 = true;
    var [store,setStore] = useState(storeInit);
    var ym = ymKey(year, month);
    var monthState = store[ym] || { hoursByDay:{}, holidays:{}, longDay:0, holidayNames:{}, leavesByDay:{} };
    var [hoursByDay,setHoursByDay] = useState(monthState.hoursByDay || {});
    var [holidays,setHolidays] = useState(monthState.holidays || {});
    var [holidayNames,setHolidayNames] = useState(monthState.holidayNames || {});
    var [leavesByDay,setLeavesByDay] = useState(monthState.leavesByDay || {});
    var annualCarryInit = (store.meta && store.meta.annualCarry && (store.meta.annualCarry[String(year)] || 0)) || 0;
    var [annualCarry,setAnnualCarry] = useState(annualCarryInit);
    var [autoLeave8,setAutoLeave8] = useState(!!(store.meta && store.meta.autoLeave8));

    useEffect(function(){
      var next = {}; for (var k in store) next[k]=store[k];
      if(!next.meta) next.meta = { annualCarry:{}, autoLeave8:autoLeave8 };
      next[ym] = { hoursByDay:hoursByDay, holidays:holidays, longDay:0, holidayNames:holidayNames, leavesByDay:leavesByDay };
      next.meta.annualCarry[String(year)] = Number(annualCarry)||0;
      next.meta.autoLeave8 = !!autoLeave8;
      setStore(next);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch(e){}
    }, [ym, hoursByDay, holidays, holidayNames, leavesByDay, annualCarry, autoLeave8]);

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

    function exportCSV(){
      var lines = ["day,weekday,hours,leave"];
      for (var d=1; d<=daysInMonth(year,month); d++){
        var wd = new Date(year,month,d).getDay(); if (isWeekendIndex(wd)) continue;
        var wk = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][wd];
        var v = hoursByDay[d]; v = (v===undefined || v===null)? '' : v;
        var lv = leavesByDay[d] || '';
        lines.push(d + "," + wk + "," + v + "," + lv);
      }
      var blob = new Blob([lines.join(String.fromCharCode(10))], { type:'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href = url; a.download = "ora_timesheet_" + ymKey(year,month) + ".csv";
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }

    return h('div', {className:'min-h-screen w-full'},
      h('div', {className:'max-w-3xl mx-auto p-6'},

        // Header with visible toggle state
        h('div', {className:'flex items-center justify-between mb-3'},
          h('h1', {className:'text-xl font-bold'}, 'ORA — ', monthLabel, ' (V1.9.1 fix)'),
          h('label', {className:'text-sm flex items-center gap-2'},
            h('input', {type:'checkbox', checked:!!autoLeave8, onChange:function(e){ setAutoLeave8(e.target.checked); }}),
            'Leave sets 8h ', h('span',{className:'text-xs text-gray-500'}, autoLeave8? '(ON)':'(OFF)')
          )
        ),

        // Leave balances
        (function(){
          function computeYearLeaveUsage(y){
            var usedAL=0, usedSLM=0, usedSLN=0;
            for (var key in store){
              if(!/^\d{4}-\d{2}$/.test(key)) continue;
              var parts = key.split('-'); var yy = Number(parts[0]);
              if (yy!==y) continue;
              var ms = store[key];
              if(ms && ms.leavesByDay){
                for(var dd in ms.leavesByDay){
                  var code = ms.leavesByDay[dd];
                  if(code===LEAVE_AL) usedAL++;
                  else if(code===LEAVE_SLM) usedSLM++;
                  else if(code===LEAVE_SLN) usedSLN++;
                }
              }
            }
            return { usedAL:usedAL, usedSLM:usedSLM, usedSLN:usedSLN };
          }
          var usage = computeYearLeaveUsage(year);
          var annualEntitlement = 30 + (Number(annualCarry)||0);
          var annualRemaining = Math.max(0, annualEntitlement - usage.usedAL);
          var sickTotalEnt = 10;
          var sickUsedTotal = usage.usedSLM + usage.usedSLN;
          var sickRemainingTotal = Math.max(0, sickTotalEnt - sickUsedTotal);
          var sickNoMCLimit = 3;
          var sickNoMCRemaining = Math.max(0, sickNoMCLimit - usage.usedSLN);

          return h('div', {className:'bg-white rounded-xl p-3 mb-3'},
            h('div', {className:'flex items-center justify-between mb-2'},
              h('div', {className:'font-semibold'}, 'Leave Balances — ', year),
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
                h('div', {className:'text-lg font-bold'}, usage.usedAL, ' / ', annualEntitlement),
                h('div', {className:'text-xs text-gray-500'}, 'Remaining: ', annualRemaining)
              ),
              h('div', {className:'bg-emerald-50 rounded p-2'},
                h('div', {className:'text-gray-600'}, 'Sick (total 10)'),
                h('div', {className:'text-lg font-bold'}, sickUsedTotal, ' / 10'),
                h('div', {className:'text-xs text-gray-500'}, 'Remaining: ', sickRemainingTotal)
              ),
              h('div', {className:'bg-amber-50 rounded p-2'},
                h('div', {className:'text-gray-600'}, 'Sick (No MC max 3)'),
                h('div', {className:'text-lg font-bold'}, usage.usedSLN, ' / 3'),
                h('div', {className:'text-xs text-gray-500'}, 'Remaining: ', sickNoMCRemaining)
              )
            )
          );
        })(),

        // Simple daily grid (only leave + hours, to verify toggle works)
        h('div', {className:'bg-white rounded-xl p-3'},
          h('div', {className:'text-sm text-gray-600 mb-2'}, 'Daily entries (Sun–Thu) — test the "Leave" button + auto 8h toggle'),
          h('div', null, rows.map(function(row, ri){
            return h('div', {key:'r'+ri, className:'grid gap-2', style:{gridTemplateColumns:'repeat('+row.length+', minmax(0,1fr))', marginBottom:'8px'}},
              row.map(function(dayNum, j){
                return h('div', {key:'c'+j, className:'border rounded p-2'},
                  dayNum ? h('div', null,
                    h('div', {className:'flex items-center justify-between mb-2'},
                      h('span', {className:'text-xs text-gray-500'}, ['Sun','Mon','Tue','Wed','Thu'][j],' ',dayNum),
                      h('div', {className:'flex gap-1'},
                        (leavesByDay[dayNum] ? h('span',{className:'chip'}, leaveLabel(leavesByDay[dayNum])) : null),
                        h('button', {className:'text-[10px] px-1.5 py-0.5 rounded bg-yellow-100', onClick:function(){ cycleLeave(dayNum); }}, 'Leave')
                      )
                    ),
                    h('input', {type:'number', step:'0.25', min:'0', className:'w-full rounded border px-2 py-1',
                      value: (hoursByDay[dayNum]===undefined || hoursByDay[dayNum]===null)? '' : hoursByDay[dayNum],
                      onChange:function(e){
                        var v = e.target.value==='' ? NaN : Number(e.target.value);
                        setHoursByDay(function(prev){ var n={}; for (var k in prev) n[k]=prev[k]; if(isNaN(v)) delete n[dayNum]; else n[dayNum]=v; return n; });
                      }
                    })
                  ) : h('div',{className:'h-7'})
                );
              })
            );
          }))
        ),

        h('div', {className:'mt-3 flex gap-2'},
          h('button', {onClick:exportCSV, className:'px-3 py-2 rounded bg-green-600 text-white'}, 'Export CSV'),
          h('span', {className:'text-xs text-gray-500'}, 'Target: ', fmt(targetMonthlyHours), 'h · Actual: ', fmt(actualMonthlyHours), 'h · ', (diff>=0?'Exceed ':'Shortage '), fmt(Math.abs(diff)), 'h')
        ),

        h('footer', {className:'text-xs text-gray-500 mt-6 text-center'}, 'ORA V1.9.1 (Leave Toggle Fix)')
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