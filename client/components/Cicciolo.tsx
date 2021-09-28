import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Bar {
    x: number
    y: number
    w: number
    h: number
}

export const Cicciolo: React.FC = () => {
    const d3Container = useRef(null);
    const width = 5000
    const height = 5000

    useEffect(() => {
        const svg = d3.select(d3Container.current)
            .append("svg")
            .attr("width", width)
            .attr("height", height)

        const bars: Bar[] = []

        for (let i = 0; i < 1000; i++) {
            const x = -100 + Math.random() * (width + 200)
            const y = -100 + Math.random() * (height + 200)
            bars.push({ x: x, y: y, w: 80, h: 50 })
        }

        const updateChart = () => {
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
        }

        updateChart();

    })

    return <div style={{ height: 500, overflow: "scroll" }}>
        <div id="cicciolo" ref={d3Container} />
    </div>
}
