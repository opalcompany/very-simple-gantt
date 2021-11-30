import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GanttBar } from './GanttBar'
import { DEFAULT_OPTIONS, Gantt } from './Gantt'
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
        const bars: GanttBar<GanttData>[] = [];
        const rows: GanttRow[] = [];
        const startDate = new Date(2021, 9, 1)

        for (let i = 0; i < 6; i++) {
            let r: GanttRow = {
                row: i,
                caption: 'CAZZILLATORE ' + i,
                borderColor: "#006600",
                color: "#00cc00",
            };
            rows.push(r);
        }

        let expStart = startDate
        const endDate = new Date(2021, 9, 30)

        for (let e = 1; e <= 2; e++) {
            let dateLimit = expStart

            for (let r = 0; r < 6; r++) {
                const data = new GanttData();
                data.experimentId = e;
                data.actionId = r + 1;
                data.originalDurationInMillis = MILLIS_IN_DAY * Math.random() * 7;
                let b: GanttBar<GanttData> = {
                    row: r,
                    startTime: dateLimit,
                    endTime: new Date(dateLimit.getTime() + data.originalDurationInMillis),
                    height: 40,
                    barColor: d3.interpolateRainbow(Math.random()),
                    id: "EXP" + e + "AZZ" + r,
                    caption: "EX " + e + " ACT" + r,
                    draggable: data.actionId === 1,
                    resizeble: r === 0 || (r + e) % 2 === 0,
                    data: data,
                    opacity: .5,
                    classes: ['test', `step-${r}`]
                }
                bars.push(b);

                dateLimit = b.endTime
                if (r === 0)
                    expStart = b.endTime
            }
        }

        const gantt = new Gantt(d3Container.current!, startDate, endDate, rows, bars, {
            ...DEFAULT_OPTIONS, rowHeight: 60
        });
        const onEndDrag = (bar: GanttBar<GanttData>, bars: GanttBar<GanttData>[]): void => {
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

        const onDrag = (bar: GanttBar<GanttData>, newStartTime: Date, bars: GanttBar<GanttData>[]): void => {

            const draggedBarData = bar.data as GanttData
            console.log("dragging experiment " + draggedBarData.experimentId! + " action " + draggedBarData.actionId!)
            const delta = newStartTime.valueOf() - bar.startTime.valueOf()

            const ok = bars.every(b => {
                const bd = b.data
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

        const onResize = (resizedBar: GanttBar<GanttData>, newEndTime: Date, bars: GanttBar<GanttData>[]): void => {
            //const newBars = JSON.parse(JSON.stringify(bars), dateTimeReviver) as GanttBar[]

            const resizedBarData = resizedBar.data as GanttData
            console.log("resizing experiment " + resizedBarData.experimentId! + " action " + resizedBarData.actionId!)
            const newDuration = newEndTime.getTime() - resizedBar.startTime.getTime()
            if ((newDuration > (resizedBarData.originalDurationInMillis * 1.40)) || (newDuration < (resizedBarData.originalDurationInMillis * 0.60))) {
                return
            } else {
                //resizedBar.endTime = newEndTime
                var t = newEndTime
                bars.sort((b1, b2) => b1.data.actionId! - b2.data.actionId!).forEach(b => {
                    const bd = b.data as GanttData
                    if (bd.experimentId! !== resizedBarData.experimentId!)
                        return
                    if (bd.actionId! > resizedBarData.actionId!) {
                        const barDuration = b.endTime.getTime() - b.startTime.getTime();
                        b.startTime = t
                        t = new Date(t.getTime() + barDuration)
                        b.endTime = t
                    }
                    else if (bd.actionId! === resizedBarData.actionId!) {
                        b.endTime = newEndTime
                    }
                })
                gantt.doUpdateBars(bars)
            }
        }

        gantt.onEndDrag = onEndDrag
        gantt.onDrag = onDrag
        gantt.onResize = onResize

        console.log(rows, bars)
        const updateChart = () => {
            gantt.loadBars()
        }

        updateChart()
    })

    return <div id="cicciolo" ref={d3Container} />

}
