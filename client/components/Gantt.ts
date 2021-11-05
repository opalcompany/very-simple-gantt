// https://betterprogramming.pub/add-an-html-canvas-into-your-react-app-176dab099a79
// https://medium.com/@PepsRyuu/why-i-no-longer-use-d3-js-b8288f306c9a
// http://tutorials.jenkov.com/svg/rect-element.html
// http://bl.ocks.org/kevinnoll/77430421843b940869ed
// https://observablehq.com/@d3/pannable-chart
// http://bl.ocks.org/nicolashery/9627333
// drag
// http://bl.ocks.org/mccannf/1629464
// https://stackoverflow.com/questions/52030269/drag-rect-not-working-as-expected
// https://stackoverflow.com/questions/31206525/how-to-resize-rectangle-in-d3-js
// https://octoperf.com/blog/2018/04/18/d3-js-drag-and-drop-tutorial/#a-simpler-use-case
// https://codepen.io/sfearl1/pen/gRayJE
// https://bl.ocks.org/mbostock/2990a882e007f8384b04827617752738
// https://newbedev.com/how-can-i-dynamically-resize-an-svg-rect-based-on-text-width
// https://website.education.wisc.edu/~swu28/d3t/concept.html
// https://stackoverflow.com/questions/31206525/how-to-resize-rectangle-in-d3-js
// https://jsfiddle.net/SunboX/vj4jtdg8/


import * as d3 from 'd3';
import * as d3drag from 'd3-drag';
import { ThemeConsumer } from 'react-bootstrap/esm/ThemeProvider';
//import { ThemeConsumer } from 'react-bootstrap/esm/ThemeProvider';
import { GanttBar } from "./GanttBar"
import { onGanttDragBarEvent, onGanttEndDragBarEvent, onGanttStartDragBarEvent } from './GanttEvents';
import { GanttRow } from './GanttRow';
//import { Margins } from './Margins';

export class Gantt {    
    // scales
    private scale: d3.ScaleTime<number, number, never>;
    private xAxis: d3.Axis<Date>;
    // sizes
    private timebarHeight: number = 60;
    private headersWidth: number = 100;
    // data
    private bars: GanttBar[];
    private rows: GanttRow[];
    // time range
    public startDate: Date;
    private endDate: Date;
    // appearance
    public rowHeight: number = 100;
    public width: number = 2000;
    public horizontalLinesColor: string = "#cbcdd6";
    public resizeAnchorWidth: number = 3;
    // drag'n'drop
    private dragging: boolean;
    private startXOfDragEvent?: number;
    private draggedBarStartX?: number;
    private draggedBarEndX?: number;
    private draggedBarId?: string;
    private draggedBarY?: number;
    // resizing
    private resizing: boolean;
    private startXOfResizeEvent?: number;
    //private resizingBarStartX?: number;
    private resizingBarEndX?: number;
    //private resizingBarY?: number;

    public onDrag?: onGanttDragBarEvent;
    public onEndDrag?: onGanttEndDragBarEvent;
    container: HTMLElement;

    private height(): number {
        return (this.rowHeight * this.rows.length) + this.timebarHeight;
    }

    private convertGanttXToContainerX(ganttXCoord: number): number {
        return ganttXCoord + this.headersWidth;
    }

    private calculateBarX(bar: GanttBar, x: number): number {
        return this.convertGanttXToContainerX(x + this.scale(bar.startTime));
    }

    private calculateBarY(bar: GanttBar): number {
        return (bar.row * this.rowHeight) + this.timebarHeight + ((this.rowHeight - bar.height) / 2);
    }

    private gTransform = (bar: GanttBar, x: number) => {
        return `translate(${this.calculateBarX(bar, x)}, ${this.calculateBarY(bar)})`
    }

    private gXTransform = (bar: GanttBar, x: number, y: number) => {
        return `translate(${this.convertGanttXToContainerX(x + this.scale(bar.startTime))}, ${y})`
    }


    private gOnStartResize(el: any, event: any, bar: GanttBar): any {
        if(!bar.resizeble)
            return
        this.startXOfResizeEvent = d3.pointer(event, el)[0];
        this.resizingBarEndX = this.scale(bar.endTime);
        this.resizing = true;
        //debugger
        const pn = d3.select(el.parentNode);
        console.log(pn)
        pn.raise().attr("stroke", "black");
        //d3.select(el).raise().attr("stroke", "black");        
    }

    private gOnResize(el: any, event: any, bar: GanttBar): any {
        if (this.resizing) {
            const correctX = d3.pointer(event, el)[0]
            const delta = correctX - this.startXOfResizeEvent!;
            let newEndTime = this.scale.invert(this.resizingBarEndX! + delta);
            // avoid bar shorter than one second
            if (newEndTime < bar.startTime) {
                newEndTime = bar.startTime;
                newEndTime.setSeconds(newEndTime.getSeconds() + 1);
            }
            const newBars = this.bars //JSON.parse(JSON.stringify(this.bars)) as GanttBar[]
            //newBars.filter(b=>b.id===bar.id).forEach(b=>b.endTime = newEndTime)
            bar.endTime = newEndTime
            //debugger
            var bs = d3.selectAll<SVGGElement, unknown>("g.ganttBar")
                .data(newBars)

            this.doUpdateBars(bs);
        }

    }

    private gOnEndResize(el: any, event: any, bar: GanttBar): any {
        d3.select(el.parentNode).attr("stroke", null);
        this.resizing = false;
    }

    private gOnStartDrag(el: Element, event: any, bar: GanttBar): any {
        this.startXOfDragEvent = event.x;
        this.draggedBarStartX = this.scale(bar.startTime);
        this.draggedBarEndX = this.scale(bar.endTime);
        this.draggedBarId = d3.select(el).attr("id")
        console.log("dragged bar id " + this.draggedBarId)
        //console.log("current bar starts at " + this.draggedBarStartX + ' and ends at ' + this.draggedBarEndX);
        this.draggedBarY = this.calculateBarY(bar);
        if (bar.draggable) {
                this.dragging = true;
                d3.select('[id="' + this.draggedBarId! + '"]').style("opacity", bar.opacity / 2)
                //d3.select('[id="' + this.draggedBarId! + '"]').raise().attr("stroke", "black");
                //d3.select(el).raise().attr("stroke", "black");
            } else {
                this.dragging = false;
        }
    }

    private gOnDrag(el: Element, event: any, bar: GanttBar) {
        if (this.dragging) {
            const delta = event.x - this.startXOfDragEvent!;
            let newStartTime = new Date(this.scale.invert(this.draggedBarStartX! + delta));
            let newEndTime = new Date(this.scale.invert(this.draggedBarEndX! + delta));

            // exceed left time limit
            if (newStartTime < this.startDate) {
                console.log("exceed left time limit");
                const newdelta_s = this.startDate.valueOf() - newStartTime.valueOf();
                newStartTime = this.startDate;
                newEndTime = new Date(newEndTime.valueOf() + newdelta_s);
            } else if (newEndTime > this.endDate) { // exceed right time limit
                console.log("exceed right time limit");
                const newdelta_e = newEndTime.valueOf() - this.endDate.valueOf();
                newStartTime = new Date(newStartTime.valueOf() - newdelta_e);
                newEndTime = this.endDate;
            }


            if (this.onDrag! != undefined) {
                if (this.onDrag!(bar, newStartTime, newEndTime)) {
                    bar.startTime = newStartTime;
                    bar.endTime = newEndTime;
                }
            } else {
                bar.startTime = newStartTime;
                bar.endTime = newEndTime;
            }

            const newBars = this.bars //JSON.parse(JSON.stringify(this.bars)) as GanttBar[]
            var bs = d3.selectAll<SVGGElement, unknown>("g.ganttBar")
                .data(newBars)

            this.doUpdateBars(bs);
            //d3.select('[id="' + this.draggedBarId! + '"]').raise().attr("stroke", "black");
            d3.select('[id="' + this.draggedBarId! + '"]').style("opacity", bar.opacity / 2)
        }
    }

    private gOnEndDrag(el: Element, event: any, bar: GanttBar): any {
        if (this.dragging) {
            d3.select('[id="' + this.draggedBarId! + '"]').raise().attr("stroke", null);
            //d3.select(el).attr("stroke", null);
            if (this.onEndDrag! != undefined) {
                const newBars = this.bars //JSON.parse(JSON.stringify(this.bars)) as GanttBar[]
                this.onEndDrag!(bar, newBars)
                var bs = d3.selectAll<SVGGElement, unknown>("g.ganttBar")
                    .data(newBars)
                this.doUpdateBars(bs);

            }
        }
        this.dragging = false;
    }

    private barWidth = (bar: GanttBar) => {
        return this.scale(bar.endTime) - this.scale(bar.startTime)
    }

    public loadBars() {
        const referenceToGantt = this;

        const pannableSvg = d3.select(this.container).select("svg.bars")

        const svgElementBars = pannableSvg.append("g")
            .attr("class", "ganttBars")
            .selectAll("g")
            .data(this.bars)
            .enter()
            .append("g").call(d3drag.drag<any, GanttBar>()
                // "referenceToGantt" refers to the gantt instance ("this" now), "this" is a group element (rect + text) in the function context, 
                // event is the d3 event
                // d is the datum aka GanttBar
                .on("start", function (event, d) { referenceToGantt.gOnStartDrag(this, event, d) })
                .on("drag", function (event, d) { referenceToGantt.gOnDrag(this, event, d) })
                .on("end", function (event, d) { referenceToGantt.gOnEndDrag(this, event, d) })
            )
            .attr("class", "ganttBar")
            .attr("id", (bar: GanttBar) => { return bar.id });


        const bars = svgElementBars
        bars.append("rect").attr("class", "ganttBarRect")
        bars.append("text").attr("class", "ganttBarCaption")
        bars.append("rect")
            .attr("class", "ganttBarHandle")
            .call(d3drag.drag<any, GanttBar>()
                // "referenceToGantt" refers to the gantt instance ("this" now), "this" is a group element (rect + text) in the function context, 
                // event is the d3 event
                // d is the datum aka GanttBar
                .on("start", function (event, d) { referenceToGantt.gOnStartResize(d3.select(this), event, d); })
                .on("drag", function (event, d) { referenceToGantt.gOnResize(d3.select(this), event, d); })
                .on("end", function (event, d) { referenceToGantt.gOnEndResize(d3.select(this), event, d); })
            );


        this.doUpdateBars(bars);

    }

    constructor(container: HTMLElement, startDate: Date, endDate: Date, rows: GanttRow[], bars: GanttBar[]) {
        this.rows = rows
        this.bars = bars
        this.startDate = startDate
        this.endDate = endDate
        this.dragging = false;
        this.resizing = false;
        this.container = container

        const parent = d3.select(container)
            .append("div")

        const headerSvg = parent.append("svg")
            .attr("class", "header")
            .attr("width", this.width)
            .attr("height", this.height())
            .style("position", "absolute")
            .style("pointer-events", "none")
            .style("z-index", 1)
        //.call(svg => svg.append("g").call(yAxis));

        const body = parent.append("div")
            .style("overflow-x", "scroll")
            .style("-webkit-overflow-scrolling", "touch");

        this.scale = d3.scaleTime()
            .range([0, this.width - this.headersWidth])
            .domain([this.startDate, this.endDate]);

        this.xAxis = d3.axisTop<Date>(this.scale)
            .ticks(d3.timeDay);
        //.tickFormat(d=>d3.timeFormat("%B %Y")(d));                     


        const svgElementsHeader = headerSvg.append("g")
            .selectAll("g")
            .data(this.rows)
            .enter()
            .append("g");

        svgElementsHeader.append("rect")
            .attr("x", 0)
            .attr("y", (row: GanttRow, i: number) => (i * this.rowHeight) + this.timebarHeight)
            .attr("width", () => this.headersWidth)
            .attr("height", () => this.rowHeight)
            .attr("fill", (row: GanttRow) => row.color)
            .attr("stroke", (row: GanttRow) => row.borderColor);

        svgElementsHeader.append("text")
            .attr("x", () => (this.headersWidth / 2))
            .attr("y", (row: GanttRow, i: number) => (i * this.rowHeight) + this.timebarHeight + (this.rowHeight / 2))
            .style("font-family", "Serif")
            .style("font-size", "10px")
            .style("text-anchor", "middle")
            .text(function (row: GanttRow) { return row.caption; });

        const pannableSvg = body.append("svg")
            .attr("class", "bars")
            .attr("width", this.width)
            .attr("height", this.height())
            .style("display", "block");
        pannableSvg
            .append("g")
            .attr("transform", "translate(" + this.headersWidth + "," + this.timebarHeight + ")")      // This controls the vertical position of the Axis
            .call(this.xAxis);

        const svgElementHorizontalLines = pannableSvg.append("g")
            .attr("stroke", this.horizontalLinesColor);

        let i: number;
        for (i = 0; i < this.rows.length; i++) {
            svgElementHorizontalLines.append("line")
                .attr("x1", this.headersWidth)
                .attr("x2", this.width)
                .attr("y1", this.timebarHeight + (i * this.rowHeight))
                .attr("y2", this.timebarHeight + (i * this.rowHeight));
        }
        pannableSvg.on("click", (e: { target: any; }) => { console.log("clic! " + d3.select(e.target).datum()) });

        //yield parent.node();

        // Initialize the scroll offset after yielding the chart to the DOM.
        body.node()!.scrollBy(this.width, 0);

    }

    private isDraggable = (bar: GanttBar) => bar.draggable ? "pointer" : "default";

    private doUpdateBars = (bars: d3.Selection<SVGGElement, GanttBar, any, any>) => {
        bars.attr("transform", (bar: GanttBar) => this.gTransform(bar, 0));
        bars.selectChild(".ganttBarRect")
            .attr("rx", (bar: GanttBar) => bar.height * 0.15)
            .attr("ry", (bar: GanttBar) => bar.height * 0.15)
            .attr("width", this.barWidth)
            .attr("height", (bar: GanttBar) => bar.height)
            .attr("cursor", this.isDraggable)
            .style("opacity", (bar: GanttBar) => bar.opacity)
            .attr("id", (bar: GanttBar) => "gantt_bar_rect_" + bar.id)
            .attr("fill", (bar: GanttBar) => bar.barColor);

        bars.selectChild(".ganttBarCaption")
            .attr("x", (bar: GanttBar) => this.barWidth(bar) / 2)
            .attr("y", (bar: GanttBar) => this.rowHeight / 3)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .style("font-family", "Mono")
            .style("font-size", "30px")
            .attr("cursor", this.isDraggable)
            .attr("id", (bar: GanttBar) => "gantt_bar_caption_" + bar.id)
            .text(function (bar: GanttBar) { return bar.caption; });

        bars.selectChild(".ganttBarHandle")
            .attr("x", (bar: GanttBar) => this.barWidth(bar) - this.resizeAnchorWidth)
            .attr("y", (bar: GanttBar) => (bar.height - (bar.height / 3)) / 2)
            .attr("width", this.resizeAnchorWidth)
            .attr("height", (bar: GanttBar) => bar.height / 3)
            .attr("cursor", "e-resize")
            .style("opacity", (bar: GanttBar) => bar.opacity)
            .attr("id", (bar: GanttBar) => "gantt_bar_handle_" + bar.id)
    }

    /**
     * name
     */
    public name() {

    }
}