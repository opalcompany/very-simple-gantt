import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {GanttBar} from './GanttBar'
import {Gantt} from './Gantt'


export const Cicciolo: React.FC = () => {    

    /* The useRef Hook creates a variable that "holds on" to a value across rendering
       passes. In this case it will hold our component's SVG DOM element. It's
       initialized null and React will assign it later (see the return statement) */    
    const d3Container = useRef(null);    
    

    /* The useEffect Hook is for running side effects outside of React,
       for instance inserting elements into the DOM using D3 */    
    useEffect(() => {
        const gantt = new Gantt(d3Container);        
        gantt.init();

/*        
        const svg = d3.select(d3Container.current)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            */
/*
        const bars: Bar[] = []
        */

        for (let i = 0; i < 1000; i++) {
            const x = -100 + Math.random() * (gantt.width + 200)
            const y = -100 + Math.random() * (gantt.height + 200)
            let b = new GanttBar;
            b.x = x;
            b.y = y;
            b.width = 80;
            b.height = 50;
            gantt.bars.push(b);
            //bars.push({ x: x, y: y, w: 80, h: 50 })
        }

        const updateChart = () => {
            gantt.loadBars;
            /*
            svg.selectAll("rect")
                .data(bars)
                .transition().duration(750)
                .attr("x", r => r.x)
                .attr("y", r => r.y)
                .attr("width", r => r.w)
                .attr("height", r => r.h)

            svg.selectAll("rect")
                .data(bars)
                .enter()
                .append("rect")
                .transition().duration(1000)
                .attr("x", r => r.x)
                .attr("y", r => r.y)
                .attr("width", r => r.w)
                .attr("height", r => r.h)
                
                
                

            svg.selectAll("rect")
                .data(bars).exit().remove()

            
            svg.on("click", e => { console.log("clic! " + d3.select(e.target).datum()) })
            */
        }

        updateChart();

    })

    return <div style={{ height: 400, overflow: "scroll" }}>
        <div id="cicciolo" ref={d3Container} />
    </div>
}
