import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GanttBar } from './GanttBar'
import { Gantt } from './Gantt'
import { GanttDataProvider } from './GanttDataProvider';

class DataProvider implements GanttDataProvider{
    public GetRows() : number
    {
        return 6;
    }
}

function randomDate(start: Date, end: Date) {
    var d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    console.log("start:" + start + " end:" + end + " date:" + d);
    return d;

  }

export const Cicciolo: React.FC = () => {    

    /* The useRef Hook creates a variable that "holds on" to a value across rendering
       passes. In this case it will hold our component's SVG DOM element. It's
       initialized null and React will assign it later (see the return statement) */    
    const d3Container = useRef(null);    
    

    /* The useEffect Hook is for running side effects outside of React,
       for instance inserting elements into the DOM using D3 */    
    useEffect(() => {
        const dt = new DataProvider;
        const gantt = new Gantt(d3Container, dt); 
        gantt.startDate = new Date(2021, 9, 1);
        gantt.endDate = new Date(2021, 9, 30);
        gantt.init();

        for (let i = 0; i < 18; i++) {
            let b = new GanttBar;
            b.row = i%6;
            b.startTime = randomDate(gantt.startDate, gantt.endDate);
            b.endTime = randomDate(b.startTime, gantt.endDate);            
            b.height = 50;
            b.barColor = d3.interpolateRainbow(Math.random());
            b.caption = "bar #";
            gantt.bars.push(b);
        }

        const updateChart = () => {
            gantt.loadBars();
        }

        updateChart();
    })

    return <div style={{ height: 400, overflow: "scroll" }}>
        <div id="cicciolo" ref={d3Container} />
    </div>
}
