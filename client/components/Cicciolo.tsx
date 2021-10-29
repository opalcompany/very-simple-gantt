import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GanttBar } from './GanttBar'
import { Gantt } from './Gantt'
import { GanttRow } from './GanttRow';

function randomDate(start: Date, end: Date) {
    const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return d;
  }
function randomBarDate(start: Date) {    
    const d = new Date();    
    d.setDate(start.getDate() + 1 + Math.random() * 7)
    console.log("start:" + start.toDateString() + ' end:' + d.toDateString());    
    return d;    
}

class GanttData  {
    public experimentId? : number;
    public actionId? : number;
}

export const Cicciolo: React.FC = () => {    

    /* The useRef Hook creates a variable that "holds on" to a value across rendering
       passes. In this case it will hold our component's SVG DOM element. It's
       initialized null and React will assign it later (see the return statement) */    
    const d3Container = useRef(null);    
    

    /* The useEffect Hook is for running side effects outside of React,
       for instance inserting elements into the DOM using D3 */    
    useEffect(() => {        
        const gantt = new Gantt(d3Container); 
        gantt.startDate = new Date(2021, 9, 1);
        gantt.endDate = new Date(2021, 9, 30);
        
        for (let i = 0; i < 6; i++) {
            let r = new GanttRow;
            r.row = i;
            r.caption = 'CAZZILLATORE ' + i;
            gantt.rows.push(r);
        }

        for (let e = 1; e <= 4; e++)
        {
            let dateLimit = gantt.startDate;

            for (let r = 0; r < 6; r++) {
                let b = new GanttBar;
                b.row = r;
                b.startTime = randomBarDate(dateLimit);
                b.endTime = randomBarDate(b.startTime);
                dateLimit = randomBarDate(b.endTime);
                b.height = 70;
                b.barColor = d3.interpolateRainbow(Math.random());
                b.id = e + "-" + r;
                b.caption = "EX " + e + " ACT" + r;
                const data = new GanttData();
                b.data = data;
                data.experimentId = e;
                data.actionId = r + 1;
                gantt.bars.push(b);
            }
        
        }

        const onStartDrag = (bar: GanttBar): boolean => {
            const d = bar.data!;
            return (d.actionId == 1);
        }

        gantt.onStartDrag = onStartDrag;

        const onEndDrag = (bar: GanttBar, bars: GanttBar[]): boolean => {            
            //return false;            
            const data = bar.data!;
            const currentExperiment = data.experimentId;
            for (let expBar of gantt.bars) {
                if (expBar.data!.experimentId == currentExperiment) {
                    let b = new GanttBar;
                    expBar.copyTo(b);
                    b.barColor = d3.interpolateGreens(Math.random());
                    bars.push(b);
                }
            }
            return true;
        }

        gantt.onEndDrag = onEndDrag;

        gantt.init();       

        const updateChart = () => {
            gantt.loadBars();
        }

        updateChart();
    })

    return  <div id="cicciolo" ref={d3Container} />
    
}
