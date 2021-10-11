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

import * as d3 from 'd3';
import { GanttBar } from "./GanttBar"
import { GanttRow } from './GanttRow';
import { Margins } from './Margins';

export class Gantt {
    // main elements
    private d3Container : any;  
    private parent : any;
    private body : any;
    private headerSvg: any;
    private pannableSvg: any;
    // svg elements
    private svgElementHorizontalLines : any;
    private svgElementBars : any;
    private svgElementsHeader : any;
    // scales
    private scale : any;
    private xAxis : any;
    // sizes
    private timebarHeight : number = 60;
    private headersWidth : number = 100;    
    // drag'n'drop    
    
    // data
    public bars: GanttBar[];
    public rows: GanttRow[];    
    // time range
    public startDate : Date;
    public endDate : Date;
    // appearance
    public rowHeight : number = 100;
    public width : number = 2000;
    public margins : Margins;
    public horizontalLinesColor : string = "#cbcdd6";

    private height() : number {
        return (this.rowHeight * this.rows.length) + this.timebarHeight;
    }

    private onStartDrag(): any {
        console.log("start drag");
    }

    private onDrag(): any  {
        console.log("on drag");

    }
    
    private onEndDrag(): any {
        console.log("on end drag");

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
        
        //.call(svg => svg.append("g").call(xAxis))
        //.append("path")
        //.datum(data)
        //.attr("fill", "steelblue")
        //.attr("d", area);        

        //this.svg = d3.select(this.d3Container.current)
        //.append("svg")
        //.attr("width", this.width)
        //.attr("height", this.height());        

        this.scale =  d3.scaleTime()
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

        let i : number;        
        for (i = 0; i < this.rows.length; i++)
        {
          this.svgElementHorizontalLines.append("line")
          .attr("x1", this.headersWidth)
          .attr("x2", this.width)
          .attr("y1", this.timebarHeight + (i * this.rowHeight))
          .attr("y2", this.timebarHeight + (i * this.rowHeight))          
        }        

        this.svgElementsHeader = this.headerSvg.append("g")
        .selectAll("g")
        .data(this.rows)
        .enter()
        .append("g")

        this.svgElementsHeader.append("rect")
        .attr("x", 0)
        .attr("y", (row : GanttRow, i: number) => (i * this.rowHeight) + this.timebarHeight)
        .attr("width", ()=> this.headersWidth)
        .attr("height", ()=> this.rowHeight)
        .attr("fill", (row : GanttRow) => row.color)
        .attr("stroke", (row : GanttRow) => row.borderColor);

        this.svgElementsHeader.append("text")
        .attr("x", ()=>(this.headersWidth / 2))
        .attr("y", (row : GanttRow, i: number) => (i * this.rowHeight) + this.timebarHeight + (this.rowHeight / 2))
        .style("font-family", "Serif")
        .style("font-size", "10px")
        .style("text-anchor", "middle")
        .text(function (row: GanttRow) { return row.caption; })    
        
        
        //yield parent.node();
 
        // Initialize the scroll offset after yielding the chart to the DOM.
        this.body.node().scrollBy(this.width + this.margins.left + this.margins.right, 0);

    }

    public loadBars(){
        this.svgElementBars = this.pannableSvg.append("g")
        .selectAll("g")
        .data(this.bars)
        .enter()
        .append("g")
        //.attr("transform", "translate(" + this.headersWidth + ",0)");
                

        this.svgElementBars.append("rect")
        .attr("class", "barRect")
        .attr("x", (bar: GanttBar) => this.scale(bar.startTime) + this.headersWidth + this.margins.left)
        .attr("y", (bar: GanttBar) => (bar.row * this.rowHeight) + this.timebarHeight + ((this.rowHeight - bar.height) / 2) + this.margins.top)
        .attr("rx", (bar: GanttBar) => bar.height * 0.15)
        .attr("ry", (bar: GanttBar) => bar.height * 0.15)
        .attr("width", (bar: GanttBar) => bar.width(this.scale))        
        .attr("height", (bar: GanttBar) => bar.height)
        .style("opacity", (bar: GanttBar) => bar.opacity)
        .attr("fill", (bar: GanttBar) => bar.barColor)
        .call(d3.drag()
        .on("start", (event, d) => this.svgElementBars.filter((p: unknown) => p === d).raise().attr("stroke", "black"))
        .on("drag", (event, d) => console.log("Drag! " + d))
        //.on("drag", (event, d) => this.svgElementBars.filter((p: unknown) => p === d).raise().attr("x", event.x))
        .on("end", (event, d) => this.svgElementBars.filter((p: any) => p === d).attr("stroke", null))
        );
        //.on("start.update drag.update end.update", update));

        //.on("mouseover", (e : MouseEvent) => {this.mouseoverEvent = e})
        //.on("mouseout", (bar: GanttBar) => {this.mouseoverBar = undefined})       
        
        //.on("click", (e: { target: any; }) => { console.log("clic! " + d3.select(e.target).datum()) })
        //.on("mousedown", (e: { target: any; }) => { console.log("mousedown! " + d3.select(e.target).datum()) })
        //.on("dragstart", (e: { target: any; }) => { console.log("dragstart! " + d3.select(e.target).datum()) })
        //.on("mouseup", (e: { target: any; }) => { console.log("mouseup! " + d3.select(e.target).datum()) })
        //.on("mousemove", (e: { target: any; }) => { console.log("mousemove! " + d3.select(e.target).datum()) });        
        
        //.call(d3.drag()
        //  .on("start", this.onStartDrag())
        //  .on("drag", this.onDrag())
        //  .on("end",  this.onEndDrag())
        //);

        //var dragHandler = d3.drag()
        //.on("drag", function (e: any) {
        //    d3.select(this)
        //        .attr("x", e.x)
        //        .attr("y", e.y);
        //});      

        /*
        d3.drag()
        .on("drag", function(e, i) {
            console.log("drag")
            d3.select(this).attr("transform", "translate(" + e.x + ","
            + e.y + ")");
        })
    */

              

        this.svgElementBars.append("text")
        //.attr("x", (bar: GanttBar) => this.scale(bar.startTime) + this.headersWidth)
        //.attr("y", (bar: GanttBar) => (bar.row * this.rowHeight) + this.timebarHeight + (bar.height / 2) + ((this.rowHeight - bar.height) / 2)) 
        .attr("x", (bar: GanttBar) => {const s = this.scale(bar.startTime); return s + this.headersWidth + (bar.width(this.scale) /2) + this.margins.left;})
        .attr("y", (bar: GanttBar) => (bar.row * this.rowHeight) + this.timebarHeight + (this.rowHeight / 2) + this.margins.top)        
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")        
        .style("font-family", "Mono")
        .style("font-size", "30px")
        .text(function (bar: GanttBar) { return bar.caption; })        
        
        //const svgElementBars = this.svg.append("g")
        //.selectAll("g")
        //.data(this.bars)         
        //.enter()
        //.append("g")
        //.append("rect")        
        //.attr("x", (bar: GanttBar) => this.scale(bar.startTime))
        //.attr("y", (bar: GanttBar) => (bar.row * this.rowHeight) + this.timebarHeight + ((this.rowHeight - bar.height) / 2) )
        //.attr("width", (bar: GanttBar) => bar.width(this.scale))        
        //.attr("height", (bar: GanttBar) => bar.height)
        //.attr("fill", (bar: GanttBar) => bar.barColor)
        //.join("g")
        //.append("text")
        //.join("g");
        

        //svgElementBars.selectAll("rect")
        //.enter()
        //.append("rect")        
        //.attr("x", (bar: GanttBar) => this.scale(bar.startTime))
        //.attr("y", (bar: GanttBar) => (bar.row * this.rowHeight) + this.timebarHeight + ((this.rowHeight - bar.height) / 2) )
        //.attr("width", (bar: GanttBar) => bar.width(this.scale))        
        //.attr("height", (bar: GanttBar) => bar.height)
        //.attr("fill", (bar: GanttBar) => bar.barColor)
        
       
        //this.svg.selectAll("rect")
        //.data(this.bars)
        //.enter()
        //.append("rect")        
        //.attr("x", (bar: GanttBar) => this.scale(bar.startTime))
        //.attr("y", (bar: GanttBar) => (bar.row * this.rowHeight) + this.timebarHeight + ((this.rowHeight - bar.height) / 2) )
        //.attr("width", (bar: GanttBar) => bar.width(this.scale))        
        //.attr("height", (bar: GanttBar) => bar.height)
        //.attr("fill", (bar: GanttBar) => bar.barColor)
        //.append("text", (bar: GanttBar) => bar.caption)
        
               
        //this.svg.selectAll("rect")
        //.data(this.bars)
        //.enter()
        //.append("rect")
        //.transition().duration(750)
        //.attr("x", (bar: GanttBar) => this.scale(bar.startTime))
        //.attr("y", (bar: GanttBar) => (bar.row * this.rowHeight) + this.timebarHeight + ((this.rowHeight - bar.height) / 2) )
        //.attr("width", (bar: GanttBar) => bar.width(this.scale))        
        //.attr("height", (bar: GanttBar) => bar.height)
        //.attr("fill", (bar: GanttBar) => bar.barColor )
        //        
        //this.svg.selectAll("rect")
        //.data(this.bars).exit().remove()          
        
        this.pannableSvg.on("click", (e: { target: any; }) => { console.log("clic! " + d3.select(e.target).datum()) })

        //var drag = this.pannableSvg.on("mousedown", (e: {target: any}) => {
        //    console.log("drag");
        //    d3.select(e.target)
        //        .attr('x', e.target.x)
        //        .attr('y', e.target.y);
        //}); 
        //
        //svg.addEventListener('mousedown', startDrag);
        //svg.addEventListener('mousemove', drag);
        //svg.addEventListener('mouseup', endDrag);
        //svg.addEventListener('mouseleave', endDrag);        
        
    }

    constructor(container : any) {
        this.bars = new Array();
        this.rows = new Array();        
        this.startDate = new Date();
        this.endDate = new Date();
        this.d3Container = container;                
        this.margins = new Margins();
    }

    

    /**
     * name
     */
    public name() {
        
    }
}