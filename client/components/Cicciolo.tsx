import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GanttBar } from './GanttBar'
import { Gantt } from './Gantt'
import { GanttRow } from './GanttRow';
import { exit } from 'process';

const dateTimeReviver = function (key: any, value: any) {
    if (typeof value === 'string') {
        console.log(value)
        const n = Date.parse(value)
        if (!Number.isNaN(n)) {
            return new Date(n);
        }
    }
    return value;
}


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
    public originalDurationInMillis: number = 0;
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
        const endDate = new Date(2021, 9, 30)

        for (let e = 1; e <= 2; e++) {
            let dateLimit = expStart

            for (let r = 0; r < 6; r++) {
                let b = new GanttBar;
                b.row = r;
                const data = new GanttData();
                data.experimentId = e;
                data.actionId = r + 1;
                data.originalDurationInMillis = MILLIS_IN_DAY * Math.random() * 7;
                b.startTime = dateLimit;//randomBarDate(dateLimit);
                b.endTime = new Date(b.startTime.getTime() + data.originalDurationInMillis);
                dateLimit = b.endTime//randomBarDate(b.endTime);
                if (r === 0)
                    expStart = b.endTime
                b.height = 70;
                b.barColor = d3.interpolateRainbow(Math.random());
                b.id = "EXP" + e + "AZZ" + r;
                b.caption = "EX " + e + " ACT" + r;
                b.draggable = data.actionId === 1;
                b.resizeble = r === 0 || (r + e) % 2 === 0
                b.data = data;
                bars.push(b);
            }
        }

        const gantt = new Gantt(d3Container.current!, startDate, endDate, rows, bars);

        const onEndDrag = (bar: GanttBar, bars: GanttBar[]): void => {
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
            //return true;
        }

        const onDrag = (bar: GanttBar, newStartTime: Date, bars: GanttBar[]): void => {

            const draggedBarData = bar.data as GanttData
            console.log("dragging experiment " + draggedBarData.experimentId! + " action " + draggedBarData.actionId!)
            const delta = newStartTime.valueOf() - bar.startTime.valueOf()

            const ok = bars.every(b => {
                const bd = b.data as GanttData
                if ((bd.experimentId! === draggedBarData.experimentId!) && (bd.actionId! > draggedBarData.actionId!)) {
                    const tmpEndTime = new Date(b.endTime.valueOf() + delta)
                    return (!(tmpEndTime > endDate))
                } else {
                    return true
                }

            });

            if (!ok) {
                return
            }

            bars.forEach(b => {
                const bd = b.data as GanttData
                if ((bd.experimentId! === draggedBarData.experimentId!) && (bd.actionId! >= draggedBarData.actionId!)) {
                    b.startTime = new Date(b.startTime.valueOf() + delta)
                    b.endTime = new Date(b.endTime.valueOf() + delta)
                }
            });

            gantt.doUpdateBars(bars)


            //return true;
        }

        const onResize = (resizedBar: GanttBar, newEndTime: Date, bars: GanttBar[]): void => {
            //const newBars = JSON.parse(JSON.stringify(bars), dateTimeReviver) as GanttBar[]

            const resizedBarData = resizedBar.data as GanttData
            console.log("resizing experiment " + resizedBarData.experimentId! + " action " + resizedBarData.actionId!)
            const newDuration = newEndTime.valueOf() - resizedBar.startTime.valueOf()
            if ((newDuration > (resizedBarData.originalDurationInMillis * 1.40)) || (newDuration < (resizedBarData.originalDurationInMillis * 0.60))) {
                return
            } else {
                const delta = newEndTime.valueOf() - resizedBar.endTime.valueOf()
                bars.forEach(b => {
                    const bd = b.data as GanttData
                    if (bd.experimentId! === resizedBarData.experimentId!) {
                        if (bd.actionId! >= resizedBarData.actionId!) b.endTime = new Date(b.endTime.valueOf() + delta)
                        if (bd.actionId! > resizedBarData.actionId!) b.startTime = new Date(b.startTime.valueOf() + delta)

                    }
                })
                gantt.doUpdateBars(bars)
            }
        }

        gantt.onEndDrag = onEndDrag
        gantt.onDrag = onDrag
        gantt.onResize = onResize

        const updateChart = () => {
            gantt.loadBars()
        }

        updateChart()
    })

    return <div id="cicciolo" ref={d3Container} />

}
