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
    const d = new Date(start.getTime() + (1 + Math.random() * 7) * MILLIS_IN_DAY)
    console.log("start:" + start.toDateString() + ' end:' + d.toDateString());
    return d;
}

const MILLIS_IN_DAY = 24 * 3600 * 1000
class GanttData {
    public experimentId?: number;
    public actionId?: number;
}

export const Cicciolo: React.FC = () => {

    /* The useRef Hook creates a variable that "holds on" to a value across rendering
       passes. In this case it will hold our component's SVG DOM element. It's
       initialized null and React will assign it later (see the return statement) */
    const d3Container = useRef<HTMLDivElement>(null);


    /* The useEffect Hook is for running side effects outside of React,
       for instance inserting elements into the DOM using D3 */
    useEffect(() => {
        const bars: GanttBar[] = [];
        const rows: GanttRow[] = [];
        const startDate = new Date(2021, 9, 1)

        for (let i = 0; i < 6; i++) {
            let r = new GanttRow;
            r.row = i;
            r.caption = 'CAZZILLATORE ' + i;
            rows.push(r);
        }

        let expStart = startDate

        for (let e = 1; e <= 2; e++) {
            let dateLimit = expStart

            for (let r = 0; r < 6; r++) {
                let b = new GanttBar;
                b.row = r;
                b.startTime = dateLimit;//randomBarDate(dateLimit);
                b.endTime = new Date(b.startTime.getTime() + MILLIS_IN_DAY * Math.random() * 7);
                dateLimit = b.endTime//randomBarDate(b.endTime);
                if (r === 0)
                    expStart = b.endTime
                b.height = 70;
                b.barColor = d3.interpolateRainbow(Math.random());
                b.id = "AZZ" + e + "EXP" + r;
                b.caption = "EX " + e + " ACT" + r;
                const data = new GanttData();
                data.experimentId = e;
                data.actionId = r + 1;
                b.data = JSON.stringify(data);
                bars.push(b);
            }
        }

        const gantt = new Gantt(d3Container.current!, startDate, new Date(2021, 9, 30), rows, bars);

        const onStartDrag = (bar: GanttBar): boolean => {
            const d = JSON.parse(bar.data) as GanttData
            return (d.actionId == 1);
        }

        gantt.onStartDrag = onStartDrag;

        const onEndDrag = (bar: GanttBar, bars: GanttBar[]): boolean => {
            //return false;            
            //const d = JSON.parse(bar.data) as GanttData
            //const currentExperiment = d.experimentId;
            //for (let expBar of bars) {
            //    if (d.experimentId == currentExperiment) {
            //        let b = new GanttBar;
            //        expBar.copyTo(b);
            //        b.barColor = d3.interpolateGreens(Math.random());
            //        bars.push(b);
            //    }
            //}
            return true;
        }

        gantt.onEndDrag = onEndDrag;

        const updateChart = () => {
            gantt.loadBars();
        }

        updateChart();
    })

    return <div id="cicciolo" ref={d3Container} />

}
