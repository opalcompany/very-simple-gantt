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
import { DEFAULT_ECDH_CURVE } from 'tls';
import { GanttBar } from "./GanttBar"
import { OnGanttDragBarEvent, OnGanttEndDragBarEvent, OnGanttEndResizeBarEvent, OnGanttResizeBarEvent, OnGanttStartDragBarEvent, OnGanttStartResizeBarEvent } from './GanttEvents';
import { GanttRow } from './GanttRow';
//import { Margins } from './Margins';
import './style.scss'
//require('./style.scss')

export interface GanttOptions {
    rowHeight: number
    width: number
    headers: {
        width: number
        fontFamily: string
        fontSize: number
    }
    bars: {
        fontFamily: string
        fontSize: number
    }
    timebarHeight: number
}

export const DEFAULT_OPTIONS: GanttOptions = {
    headers: {
        width: 100,
        fontFamily: "",
        fontSize: 18,
    },
    rowHeight: 70,
    width: 2000,
    timebarHeight: 60,
    bars: {
        fontFamily: "",
        fontSize: 18,
    }
}
export class Gantt<T> {
    // scales
    private scale: d3.ScaleTime<number, number, never>;
    private xAxis: d3.Axis<Date>;
    // data
    private bars: GanttBar<T>[];
    readonly rows: GanttRow[];
    // time range
    public startDate: Date;
    private endDate: Date;
    // appearance
    private options: GanttOptions
    public horizontalLinesColor: string = "#cbcdd6"
    public resizeAnchorWidth: number = 3
    // drag'n'drop
    private dragging: boolean
    private startXOfDragEvent?: number
    private draggedBarStartX?: number
    private draggedBarEndX?: number
    private draggedBarId?: string
    private draggedBarY?: number
    // resizing
    private resizing: boolean
    private startXOfResizeEvent?: number
    //private resizingBarStartX?: number;
    private resizingBarEndX?: number
    //private resizingBarY?: number;

    public onStartDrag?: OnGanttStartDragBarEvent<T>;
    public onDrag?: OnGanttDragBarEvent<T>;
    public onEndDrag?: OnGanttEndDragBarEvent<T>;

    public onStartResize?: OnGanttStartResizeBarEvent<T>;
    public onResize?: OnGanttResizeBarEvent<T>;
    public onEndResize?: OnGanttEndResizeBarEvent<T>;

    container: HTMLElement;

    private height(): number {
        return (this.options.rowHeight * this.rows.length) + this.options.timebarHeight
    }

    private convertGanttXToContainerX(ganttXCoord: number): number {
        return ganttXCoord + this.options.headers.width
    }

    private calculateBarX(bar: GanttBar<T>, x: number): number {
        return this.convertGanttXToContainerX(x + this.scale(bar.startTime));
    }

    private calculateBarY(bar: GanttBar<T>): number {
        return (bar.row * this.options.rowHeight) + this.options.timebarHeight + ((this.options.rowHeight - bar.height) / 2);
    }

    private gTransform = (bar: GanttBar<T>, x: number) => {
        return `translate(${this.calculateBarX(bar, x)}, ${this.calculateBarY(bar)})`
    }

    private idToValidDomId = (id: String) => {
        //alternative is: return '[id="' + id + '"]'
        return "g" + id.replace(/[ ]/g, "_")
    }


    private gOnStartResize(el: any, event: any, bar: GanttBar<T>): any {
        console.log("start resize: " + bar.id + " " + bar.resizeble);

        if (!bar.resizeble) return

        if (this.onStartResize) {
            if (!this.onStartResize(bar)) return
        }

        this.startXOfResizeEvent = d3.pointer(event, el)[0]
        this.resizingBarEndX = this.scale(bar.endTime)
        this.resizing = true

        const pn = d3.select<any, any>("#" + this.idToValidDomId(bar.id));
        //pn.raise().style("opacity", bar.opacity / 2)        
        pn.raise().classed("ganttBarResizing", true)
    }

    private gOnResize(el: any, event: any, bar: GanttBar<T>): any {
        if (this.resizing) {
            const correctX = d3.pointer(event, el)[0]
            const delta = correctX - this.startXOfResizeEvent!;
            let newEndTime = this.scale.invert(this.resizingBarEndX! + delta);
            // avoid bar shorter than one second
            if (newEndTime < bar.startTime) {
                newEndTime = bar.startTime;
                newEndTime.setSeconds(newEndTime.getSeconds() + 1);
            }
            if (this.onResize) {
                const clonedBars: GanttBar<T>[] = [];
                this.cloneBars(this.bars, clonedBars)
                this.onResize(bar, newEndTime, clonedBars);
                this.assignBars(clonedBars, this.bars)
            } else {
                bar.endTime = newEndTime
                this.doUpdateBars(this.bars);
            }
            const pn = d3.select<any, any>("#" + this.idToValidDomId(bar.id));
            //pn.raise().style("opacity", bar.opacity / 2)        
            pn.raise().classed("ganttBarResizing", true)
        }
    }

    private gOnEndResize(el: any, event: any, bar: GanttBar<T>): any {
        const pn = d3.select<any, any>("#" + this.idToValidDomId(bar.id));
        //pn.style("opacity", null)
        pn.classed("ganttBarResizing", false)
        this.resizing = false;
        if (this.onEndResize) {
            const clonedBars: GanttBar<T>[] = []
            this.cloneBars(this.bars, clonedBars)
            this.onEndResize(bar, clonedBars)
        }

    }

    private gOnStartDrag(el: Element, event: any, bar: GanttBar<T>): any {
        this.dragging = false
        if (!bar.draggable) return
        if (this.onStartDrag) {
            if (!this.onStartDrag(bar)) return
        }
        this.startXOfDragEvent = event.x;
        this.draggedBarStartX = this.scale(bar.startTime);
        this.draggedBarEndX = this.scale(bar.endTime);
        this.draggedBarId = bar.id;
        this.draggedBarY = this.calculateBarY(bar);
        this.dragging = true;
        d3.select("#" + this.idToValidDomId(this.draggedBarId!))
            .classed("ganttBarDragging", true)
            //.style("opacity", bar.opacity / 2)
            .attr("cursor", "grabbing")
            .raise()
    }

    private gOnDrag(el: Element, event: any, bar: GanttBar<T>) {
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

            if (this.onDrag) {
                const clonedBars: GanttBar<T>[] = [];
                this.cloneBars(this.bars, clonedBars)
                this.onDrag(bar, newStartTime, clonedBars)
                this.assignBars(clonedBars, this.bars)
            } else {
                bar.startTime = newStartTime;
                bar.endTime = newEndTime;
                this.doUpdateBars(this.bars);
            }
            d3.select("#" + this.idToValidDomId(this.draggedBarId!))
                .classed("ganttBarDragging", true)

        }
    }

    private gOnEndDrag(el: Element, event: any, bar: GanttBar<T>): any {
        if (this.dragging) {
            if (this.onEndDrag) {
                this.onEndDrag(bar, this.bars)
            }
            d3.select<any, GanttBar<T>>("#" + this.idToValidDomId(this.draggedBarId!))
                .classed("ganttBarDragging", false)
                //.style("opacity", null) //bar.opacity)
                .attr("cursor", this.cursorForBar)
        }
        this.dragging = false;
    }

    private barWidth = (bar: GanttBar<T>) => {
        return this.scale(bar.endTime) - this.scale(bar.startTime)
    }

    public loadBars() {
        const referenceToGantt = this;

        const pannableSvg = d3.select(this.container).select("svg.bars")

        const svgElementBars = pannableSvg.append("g")
            .attr("class", "ganttBars")
            .selectAll<SVGGElement, GanttBar<T>>("g")
            .data(this.bars, (bar: GanttBar<T>) => bar.id)
            .enter()
            .append("g")
            .on("click", (e: { target: any; }, bar: GanttBar<T>) => {
                d3.select("#" + this.idToValidDomId(bar.id)).lower()
            })
            .call(d3drag.drag<any, GanttBar<T>>()
                // "referenceToGantt" refers to the gantt instance ("this" now), "this" is a group element (rect + text) in the function context, 
                // event is the d3 event
                // d is the datum aka GanttBar
                .on("start", function (event, d) { referenceToGantt.gOnStartDrag(this, event, d) })
                .on("drag", function (event, d) { referenceToGantt.gOnDrag(this, event, d) })
                .on("end", function (event, d) { referenceToGantt.gOnEndDrag(this, event, d) })
            )
            .attr("class", "ganttBar")
            .attr("cursor", this.cursorForBar)

        const bars = svgElementBars
        bars.append("rect").attr("class", "ganttBarRect")
        bars.append("text").attr("class", "ganttBarCaption")

        bars.filter((bar: GanttBar<T>) => bar.draggable)
            .append("rect")
            .attr("class", "ganttBarDraggableIndicator")


        bars.filter((bar: GanttBar<T>) => bar.resizeble)
            .append("rect")
            .attr("class", "ganttBarHandle")
            .attr("width", this.resizeAnchorWidth)
            .call(d3drag.drag<any, GanttBar<T>>()
                // "referenceToGantt" refers to the gantt instance ("this" now), "this" is a group element (rect + text) in the function context, 
                // event is the d3 event
                // d is the datum aka GanttBar
                .on("start", function (event, d) { referenceToGantt.gOnStartResize(d3.select(this), event, d); })
                .on("drag", function (event, d) { referenceToGantt.gOnResize(d3.select(this), event, d); })
                .on("end", function (event, d) { referenceToGantt.gOnEndResize(d3.select(this), event, d); })
            )



        this.doUpdateBars(this.bars);

    }

    constructor(container: HTMLElement, startDate: Date, endDate: Date, rows: GanttRow[], bars: GanttBar<T>[], options?: GanttOptions) {
        this.rows = rows
        this.bars = bars
        this.startDate = startDate
        this.endDate = endDate
        this.dragging = false;
        this.resizing = false;
        this.container = container
        this.options = options ?? DEFAULT_OPTIONS

        const parent = d3.select(container)
            .append("div")

        const svg = parent.append("svg")

        svg.append("pattern")
            .attr("id", "grabPattern")
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", 4)
            .attr("height", 4)
            .append("path").attr("d", "M-1,1 l2,-2   M0, 4 l4, -4   M3, 5 l2, -2")
            .style("stroke", "black")
            .style("opacity", .3)
            .style("stroke-width", "1")

        const headerSvg = svg
            .attr("class", "header")
            .attr("width", this.options.headers.width)
            .attr("height", this.height())
            .style("position", "absolute")
            .style("pointer-events", "none")
            .style("z-index", 1)
        //.call(svg => svg.append("g").call(yAxis));

        const body = parent.append("div")
            .style("overflow-x", "scroll")
            .style("-webkit-overflow-scrolling", "touch");

        this.scale = d3.scaleTime()
            .range([0, this.options.width - this.options.headers.width])
            .domain([this.startDate, this.endDate]);

        this.xAxis = d3.axisTop<Date>(this.scale)
            //.ticks(d3.timeDay)
            .ticks(40)
        //.tickFormat(d=>d3.timeFormat("%B %Y")(d));                     


        const svgElementsHeader = headerSvg.append("g")
            .selectAll("g")
            .data(this.rows)
            .enter()
            .append("g");

        svgElementsHeader.append("rect")
            .attr("x", 0)
            .attr("y", (_, i: number) => (i * this.options.rowHeight) + this.options.timebarHeight)
            .attr("width", () => this.options.headers.width)
            .attr("height", () => this.options.rowHeight)
            .attr("fill", (row: GanttRow) => row.color)
            .attr("stroke", (row: GanttRow) => row.borderColor)

        svgElementsHeader.append("text")
            .attr("x", () => (this.options.headers.width / 2))
            .attr("y", (_, i: number) => (i * this.options.rowHeight) + this.options.timebarHeight + (this.options.rowHeight / 2))
            .style("font-family", this.options.headers.fontFamily)
            .style("font-size", this.options.headers.fontSize)
            .style("text-anchor", "middle")
            .text(function (row: GanttRow) { return row.caption; });

        const pannableSvg = body.append("svg")
            .attr("class", "bars")
            .attr("width", this.options.width)
            .attr("height", this.height())
            .style("display", "block");
        pannableSvg
            .append("g")
            .attr("transform", "translate(" + this.options.headers.width + "," + this.options.timebarHeight + ")")      // This controls the vertical position of the Axis
            .call(this.xAxis);

        const svgElementHorizontalLines = pannableSvg.append("g")
            .attr("stroke", this.horizontalLinesColor);

        let i: number;
        for (i = 0; i < this.rows.length; i++) {
            svgElementHorizontalLines.append("line")
                .attr("x1", this.options.headers.width)
                .attr("x2", this.options.width)
                .attr("y1", this.options.timebarHeight + (i * this.options.rowHeight))
                .attr("y2", this.options.timebarHeight + (i * this.options.rowHeight));
        }
        pannableSvg.on("click", (e: { target: any; }) => {
            console.log("clic! " + d3.select<any, GanttBar<T>>(e.target).datum().id)
        });

        //yield parent.node();

        // Initialize the scroll offset after yielding the chart to the DOM.
        body.node()!.scrollBy(this.options.width, 0);

    }

    private cursorForBar = (bar: GanttBar<T>) => bar.draggable ? "grab" : "default";

    public assignBars(sourceBars: GanttBar<T>[], destinationBars: GanttBar<T>[]) {
        sourceBars.forEach(b => {
            const destBar = destinationBars.find(ba => ba.id === b.id)
            if (destBar) {
                copyBar(b, destBar)
            }

        })
    }

    public cloneBars(sourceBars: GanttBar<T>[], destinationBars: GanttBar<T>[]) {
        sourceBars.forEach(b => {
            const newBar: GanttBar<T> = { ...b }
            destinationBars.push(newBar)
        })
    }

    public doUpdateBars = (nbars: GanttBar<T>[]) => {
        //var ids = d3.selectAll<SVGGElement, GanttBar>("g.ganttBar").data().map(b => b.id)
        //nbars = ids.map(id => nbars.find(b => b.id === id)!)

        this.assignBars(nbars, this.bars)

        var bars = d3
            .selectAll<SVGGElement, GanttBar<T>>("g.ganttBar")
            .data(this.bars, (bar: GanttBar<T>) => bar.id)

        bars.attr("transform", (bar: GanttBar<T>) => this.gTransform(bar, 0))
            .attr('class', (bar: GanttBar<T>) => ['ganttBar', ...bar.classes ?? []].join(' '))
            .attr("id", (bar: GanttBar<T>) => { return this.idToValidDomId(bar.id) })

        const roundness = 0.08;
        bars.selectChild(".ganttBarRect")
            .attr("rx", (bar: GanttBar<T>) => bar.height * roundness)
            .attr("ry", (bar: GanttBar<T>) => bar.height * roundness)
            .attr("width", this.barWidth)
            .attr("height", (bar: GanttBar<T>) => bar.height)
            .style("opacity", (bar: GanttBar<T>) => bar.opacity)
            .attr("fill", (bar: GanttBar<T>) => bar.barColor)


        bars.selectChild(".ganttBarCaption")
            .attr("x", (bar: GanttBar<T>) => this.barWidth(bar) / 2)
            .attr("y", (bar: GanttBar<T>) => (bar.height ) / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .style("font-family", this.options.bars.fontFamily)
            .style("font-size", this.options.bars.fontSize)
            .attr("cursor", "inherited")
            .text(function (bar: GanttBar<T>) { return bar.caption; });

        bars.selectChild(".ganttBarHandle")
            .attr("x", (bar: GanttBar<T>) => this.barWidth(bar) - this.resizeAnchorWidth)
            .attr("y", (bar: GanttBar<T>) => (bar.height - (bar.height / 3)) / 2)
            .attr("height", (bar: GanttBar<T>) => bar.height / 3)
            .attr("cursor", "e-resize")
            .style("opacity", (bar: GanttBar<T>) => bar.opacity)

        bars.selectChild(".ganttBarDraggableIndicator")
            .attr("width", (bar: GanttBar<T>) => bar.height * roundness)
            .attr("height", (bar: GanttBar<T>) => bar.height * (1 - 2 * roundness))
            .attr("rx", (bar: GanttBar<T>) => bar.height * roundness / 2)
            .attr("ry", (bar: GanttBar<T>) => bar.height * roundness / 2)
            .attr("fill", (bar: GanttBar<T>) => "black")
            .attr("x", (bar: GanttBar<T>) => bar.height * roundness)
            .attr("y", (bar: GanttBar<T>) => bar.height * roundness)
            .style("opacity", (bar: GanttBar<T>) => .2)
            .attr("visibility", (bar: GanttBar<T>) => this.barWidth(bar) > 3 * bar.height * roundness ? "visible" : "hidden")
    }

    /**
     * name
     */
    public name() {

    }
}

function copyBar<T>(src: GanttBar<T>, dest: GanttBar<T>) {
    Object.assign(dest, src)
    // dest.id = src.id;
    // dest.height = src.height;
    // dest.startTime = src.startTime;
    // dest.endTime = src.endTime;
    // dest.barColor = src.barColor;
    // dest.caption = src.caption;
    // dest.opacity = src.opacity;
    // dest.data = src.data;
    // dest.classes = src.classes;
}

