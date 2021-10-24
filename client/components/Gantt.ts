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

import * as d3 from 'd3';
import * as d3drag from 'd3-drag';
import { ThemeConsumer } from 'react-bootstrap/esm/ThemeProvider';
import { GanttBar } from "./GanttBar"
import { onGanttDragBarEvent, onGanttEndDragBarEvent, onGanttStartDragBarEvent } from './GanttEvents';
import { GanttRow } from './GanttRow';
import { Margins } from './Margins';

export class Gantt {
    // main elements
    private d3Container: any;
    private parent: any;
    private body: any;
    private headerSvg: any;
    private pannableSvg: any;
    // svg elements
    private svgElementHorizontalLines: any;
    private svgElementBars: any;
    private svgElementsHeader: any;
    // scales
    private scale: any;
    private xAxis: any;
    // sizes
    private timebarHeight: number = 60;
    private headersWidth: number = 100;
    // data
    public bars: GanttBar[];
    public rows: GanttRow[];
    // time range
    public startDate: Date;
    public endDate: Date;
    // appearance
    public rowHeight: number = 100;
    public width: number = 2000;
    public margins: Margins;
    public horizontalLinesColor: string = "#cbcdd6";
    // drag'n'drop
    private dragging: boolean;
    private currentDragStartDate?: Date;
    private currentDragBarStartDate?: Date;
    private currentDragBarEndDate?: Date;
    private currentDragBarY?: number;

    public onStartDrag?: onGanttStartDragBarEvent;
    public onDrag?: onGanttDragBarEvent;
    public onEndDrag?: onGanttEndDragBarEvent;

    private height(): number {
        return (this.rowHeight * this.rows.length) + this.timebarHeight;
    }

    private getGanttXCoord(svgXCoord: number) : number {
        return svgXCoord - this.headersWidth - this.margins.left;
    }

    private getSvgXCoord(ganttXCoord : number) : number {
        return ganttXCoord + this.headersWidth + this.margins.left;
    }

    private calculateBarX(bar: GanttBar, x:number) : number {
        return this.getSvgXCoord(x+this.scale(bar.startTime));
    }

    private calculateBarY(bar: GanttBar) : number {
        return (bar.row * this.rowHeight) + this.timebarHeight + ((this.rowHeight - bar.height) / 2) + this.margins.top;
    }

    private gTransform = (bar: GanttBar, x: number) => {
        return `translate(${this.calculateBarX(bar, x)}, ${this.calculateBarY(bar)})`
    }

    private gXTransform =(bar: GanttBar, x: number) => {
        return `translate(${this.getSvgXCoord(x+this.scale(bar.startTime))}, ${this.currentDragBarY})`
    } 

    private gOnStartDrag(el: Element, event: any, bar: GanttBar): any {
        //this.currentDragStartX = event.x;
        //console.log("current drag start x:" + this.currentDragStartX);
        this.currentDragStartDate = this.scale.invert(this.getGanttXCoord(event.x));
        console.log("current drag bar:" + bar.caption);
        this.currentDragBarStartDate = bar.startTime;
        console.log("current drag start time:" + bar.startTime.toISOString());
        this.currentDragBarEndDate = bar.endTime;
        console.log("current drag end time:" + bar.endTime.toISOString());
        this.currentDragBarY = this.calculateBarY(bar);
        console.log("current drag start y:" + this.currentDragBarY);
        if (this.onStartDrag! != undefined) {
            if (this.onStartDrag!(bar)) {
              d3.select(el).raise().attr("stroke", "black");
              this.dragging = true;
            } else {
                this.dragging = false;
            }
        } else {
            d3.select(el).raise().attr("stroke", "black");
            this.dragging = true;
        }


    }

    private gOnDrag(el: Element, event: any, bar: GanttBar) {                       
        if (this.dragging) {
            const actualDate : Date = this.scale.invert(this.getGanttXCoord(event.x));
            const delta = actualDate.valueOf() - this.currentDragStartDate!.valueOf();
            let newStartTime = new Date(this.currentDragBarStartDate!.valueOf() + delta);
            console.log("new start time:" + newStartTime.toISOString());
            let newEndTime = new Date(this.currentDragBarEndDate!.valueOf() + delta);
            console.log("new end time:" + newEndTime.toISOString());
            // exceed left time limit
            if (newStartTime < this.startDate) {                
                const newdelta_s = this.startDate.valueOf() - newStartTime.valueOf();
                newStartTime = this.startDate;
                newEndTime = new Date(newEndTime.valueOf() + newdelta_s);
            } else if (newEndTime > this.endDate) { // exceed right time limit
                console.log('right limit');
                const newdelta_e = newEndTime.valueOf() - this.endDate.valueOf();
                console.log('start time:' + newStartTime.toISOString() + ' end time:' + newEndTime.toISOString());
                newStartTime = new Date(newStartTime.valueOf() - newdelta_e);
                newEndTime = this.endDate;
                console.log('start time:' + newStartTime.toISOString() + ' end time:' + newEndTime.toISOString());
            }
                

            if (this.onDrag! != undefined){
                if (this.onDrag!(bar, newStartTime)) {
                    bar.startTime = newStartTime;
                    bar.endTime = newEndTime;
                    d3.select(el)
                        .attr("transform", this.gXTransform(bar, 0));    
        
                }
            } else {
                bar.startTime = newStartTime;
                d3.select(el)
                    .attr("transform", this.gXTransform(bar, 0));    
    
            }            
        }
    }

    private gOnEndDrag(el: Element, event: any, bar: GanttBar): any {
        if (this.dragging) {
            console.log("on end drag");
            if (this.onEndDrag! != undefined) {
                if (this.onEndDrag!(bar)) {

                }

            }
            d3.select(el).attr("stroke", null);    
        }
        this.dragging = false;        
    }

    public init() {
        this.parent = d3.select(this.d3Container.current)
            .append("div")

        this.headerSvg = this.parent.append("svg")
            .attr("width", this.width)
            .attr("height", this.height())
            .style("position", "absolute")
            .style("pointer-events", "none")
            .style("z-index", 1)
        //.call(svg => svg.append("g").call(yAxis));

        this.body = this.parent.append("div")
            .style("overflow-x", "scroll")
            .style("-webkit-overflow-scrolling", "touch");

        this.pannableSvg = this.body.append("svg")
            .attr("width", this.width + this.margins.left + this.margins.right)
            .attr("height", this.height())
            .style("display", "block");
    

        this.scale = d3.scaleTime()
            .range([0, this.width - this.headersWidth])
            .domain([this.startDate, this.endDate]);

        this.xAxis = d3.axisTop(this.scale)
            .ticks(d3.timeDay);
        //.tickFormat(d=>d3.timeFormat("%B %Y")(d));                     

        this.pannableSvg
            .append("g")
            .attr("transform", "translate(" + this.headersWidth + "," + this.timebarHeight + ")")      // This controls the vertical position of the Axis
            .call(this.xAxis);

        this.svgElementHorizontalLines = this.pannableSvg.append("g")
            .attr("stroke", this.horizontalLinesColor);

        let i: number;
        for (i = 0; i < this.rows.length; i++) {
            this.svgElementHorizontalLines.append("line")
                .attr("x1", this.headersWidth)
                .attr("x2", this.width)
                .attr("y1", this.timebarHeight + (i * this.rowHeight))
                .attr("y2", this.timebarHeight + (i * this.rowHeight));
        }

        this.svgElementsHeader = this.headerSvg.append("g")
            .selectAll("g")
            .data(this.rows)
            .enter()
            .append("g");

        this.svgElementsHeader.append("rect")
            .attr("x", 0)
            .attr("y", (row: GanttRow, i: number) => (i * this.rowHeight) + this.timebarHeight)
            .attr("width", () => this.headersWidth)
            .attr("height", () => this.rowHeight)
            .attr("fill", (row: GanttRow) => row.color)
            .attr("stroke", (row: GanttRow) => row.borderColor);

        this.svgElementsHeader.append("text")
            .attr("x", () => (this.headersWidth / 2))
            .attr("y", (row: GanttRow, i: number) => (i * this.rowHeight) + this.timebarHeight + (this.rowHeight / 2))
            .style("font-family", "Serif")
            .style("font-size", "10px")
            .style("text-anchor", "middle")
            .text(function (row: GanttRow) { return row.caption; });


        //yield parent.node();

        // Initialize the scroll offset after yielding the chart to the DOM.
        this.body.node().scrollBy(this.width + this.margins.left + this.margins.right, 0);

    }

    public loadBars() {
        const referenceToGantt = this;

        this.svgElementBars = this.pannableSvg.append("g")
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
            .attr("id", (bar: GanttBar) => bar.id)            
            .attr("transform", (bar: GanttBar) => this.gTransform(bar, 0));


        this.svgElementBars.append("rect")
            .attr("class", "barRect")
            // .attr("x", (bar: GanttBar) => this.scale(bar.startTime) + this.headersWidth + this.margins.left)
            // .attr("y", (bar: GanttBar) => (bar.row * this.rowHeight) + this.timebarHeight + ((this.rowHeight - bar.height) / 2) + this.margins.top)
            .attr("rx", (bar: GanttBar) => bar.height * 0.15)
            .attr("ry", (bar: GanttBar) => bar.height * 0.15)
            .attr("width", (bar: GanttBar) => bar.width(this.scale))
            .attr("height", (bar: GanttBar) => bar.height)
            .attr("cursor", "pointer")
            .style("opacity", (bar: GanttBar) => bar.opacity)
            .attr("fill", (bar: GanttBar) => bar.barColor)

        this.svgElementBars.append("text")
            //.attr("x", (bar: GanttBar) => this.scale(bar.startTime) + this.headersWidth)
            //.attr("y", (bar: GanttBar) => (bar.row * this.rowHeight) + this.timebarHeight + (bar.height / 2) + ((this.rowHeight - bar.height) / 2)) 
            .attr("x", (bar: GanttBar) => bar.width(this.scale) / 2)
            .attr("y", (bar: GanttBar) => this.rowHeight/3)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .style("font-family", "Mono")
            .style("font-size", "30px")
            .attr("cursor", "pointer")
            .text(function (bar: GanttBar) { return bar.caption; })

        this.pannableSvg.on("click", (e: { target: any; }) => { console.log("clic! " + d3.select(e.target).datum()) });     
    }

    constructor(container: any) {
        this.bars = new Array();
        this.rows = new Array();
        this.startDate = new Date();
        this.endDate = new Date();
        this.d3Container = container;
        this.margins = new Margins();
        this.dragging = false;
    }



    /**
     * name
     */
    public name() {

    }
}