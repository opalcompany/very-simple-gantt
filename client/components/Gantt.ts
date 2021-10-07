// https://betterprogramming.pub/add-an-html-canvas-into-your-react-app-176dab099a79
// https://medium.com/@PepsRyuu/why-i-no-longer-use-d3-js-b8288f306c9a
// http://tutorials.jenkov.com/svg/rect-element.html
// http://bl.ocks.org/kevinnoll/77430421843b940869ed
// https://observablehq.com/@d3/pannable-chart
// http://bl.ocks.org/nicolashery/9627333


import * as d3 from 'd3';
import { GanttBar } from "./GanttBar"
import { GanttRow } from './GanttRow';

export class Gantt {
    private svg: any;
    private scale : any;
    private xAxis : any;
    private d3Container : any;  
    private timebarHeight : number = 60;
    private headersWidth : number = 100;
    // svg elements
    private svgElementHorizontalLines : any;
    private svgElementBars : any;
    private svgElementsHeader : any;
    
    public width : number = 2000;

    public bars: GanttBar[];
    public rows: GanttRow[];
    //public dataProvider : GanttDataProvider;

    public startDate : Date;
    public endDate : Date;
    public rowHeight : number = 100;
    public horizontalLinesColor : string = "#cbcdd6";

    public height() : number {
        return (this.rowHeight * this.rows.length) + this.timebarHeight;
    }    
        
    public init() {        
        this.svg = d3.select(this.d3Container.current)
        .append("svg")
        .attr("width", this.width)
        .attr("height", this.height());        

        this.scale =  d3.scaleTime()
        .range([0, this.width - this.headersWidth])
        .domain([this.startDate, this.endDate]);        
        
        this.xAxis = d3.axisTop(this.scale)
        .ticks(d3.timeDay);
        //.tickFormat(d=>d3.timeFormat("%B %Y")(d));                     

        this.svg
        .append("g")
        .attr("transform", "translate(" + this.headersWidth + "," + this.timebarHeight + ")")      // This controls the vertical position of the Axis
        .call(this.xAxis);

        this.svgElementHorizontalLines = this.svg.append("g")
          .attr("stroke", this.horizontalLinesColor);

        var i : number;        
        for (i = 0; i < this.rows.length; i++)
        {
          this.svgElementHorizontalLines.append("line")
          .attr("x1", this.headersWidth)
          .attr("x2", this.width)
          .attr("y1", this.timebarHeight + (i * this.rowHeight))
          .attr("y2", this.timebarHeight + (i * this.rowHeight))          
        }        

        this.svgElementsHeader = this.svg.append("g")
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

    }

    public loadBars(){
        this.svgElementBars = this.svg.append("g")
        .selectAll("g")
        .data(this.bars)
        .enter()
        .append("g")
        //.attr("transform", "translate(" + this.headersWidth + ",0)");
                

        this.svgElementBars.append("rect")
        .attr("x", (bar: GanttBar) => this.scale(bar.startTime) + this.headersWidth)
        .attr("y", (bar: GanttBar) => (bar.row * this.rowHeight) + this.timebarHeight + ((this.rowHeight - bar.height) / 2) )
        .attr("rx", (bar: GanttBar) => bar.height * 0.15)
        .attr("ry", (bar: GanttBar) => bar.height * 0.15)
        .attr("width", (bar: GanttBar) => bar.width(this.scale))        
        .attr("height", (bar: GanttBar) => bar.height)
        .attr("fill", (bar: GanttBar) => bar.barColor);

        this.svgElementBars.append("text")
        .attr("x", (bar: GanttBar) => this.scale(bar.startTime) + this.headersWidth)
        .attr("y", (bar: GanttBar) => (bar.row * this.rowHeight) + this.timebarHeight + (bar.height / 2) + ((this.rowHeight - bar.height) / 2)) 
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
        
        this.svg.on("click", (e: { target: any; }) => { console.log("clic! " + d3.select(e.target).datum()) })
        
    }

    constructor(container : any) {
        this.bars = new Array();
        this.rows = new Array();
        this.startDate = new Date();
        this.endDate = new Date();
        this.d3Container = container;                
    }

    

    /**
     * name
     */
    public name() {
        
    }
}