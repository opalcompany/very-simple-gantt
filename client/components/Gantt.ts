// https://betterprogramming.pub/add-an-html-canvas-into-your-react-app-176dab099a79
// https://medium.com/@PepsRyuu/why-i-no-longer-use-d3-js-b8288f306c9a

import * as d3 from 'd3';
import { GanttBar } from "./GanttBar"
import { GanttDataProvider } from './GanttDataProvider';

export class Gantt {
    private svg: any;
    private scale : any;
    private xAxis : any;
    private d3Container : any;  
    private timebarHeight : number = 60;
    private svgElementHorizontalLines : any;
    
    public width : number = 2000;

    public bars: GanttBar[];
    public dataProvider : GanttDataProvider;

    public startDate : Date;
    public endDate : Date;
    public rowHeight : number = 100;
    public horizontalLinesColor : string = "#cbcdd6";

    public height() : number {
        return (this.rowHeight * this.dataProvider.GetRows()) + this.timebarHeight;
    }    
        
    public init() {        
        this.svg = d3.select(this.d3Container.current)
        .append("svg")
        .attr("width", this.width)
        .attr("height", this.height());        

        this.scale =  d3.scaleTime()
        .range([0, this.width])
        .domain([this.startDate, this.endDate]);        

        this.xAxis = d3.axisTop(this.scale)
        .ticks(d3.timeDay);
        //.tickFormat(d=>d3.timeFormat("%B %Y")(d));                
       
        this.svg
        .append("g")
        .attr("transform", "translate(0," + this.timebarHeight + ")")      // This controls the vertical position of the Axis
        .call(this.xAxis);

        this.svgElementHorizontalLines = this.svg.append("g")
          .attr("stroke", this.horizontalLinesColor);

        var i : number;        
        for (i = 0; i < this.dataProvider.GetRows(); i++)
        {
          this.svgElementHorizontalLines.append("line")
          .attr("x1", 0)
          .attr("x2", this.width)
          .attr("y1", this.timebarHeight + (i * this.rowHeight))
          .attr("y2", this.timebarHeight + (i * this.rowHeight))          
        }        

    }

    public loadBars(){
       
        this.svg.selectAll("rect")
        .data(this.bars)
        .enter()
        .append("g")
        .append("rect")        
        .attr("x", (bar: GanttBar) => this.scale(bar.startTime))
        .attr("y", (bar: GanttBar) => (bar.row * this.rowHeight) + this.timebarHeight + ((this.rowHeight - bar.height) / 2) )
        .attr("width", (bar: GanttBar) => bar.width(this.scale))        
        .attr("height", (bar: GanttBar) => bar.height)
        .attr("fill", (bar: GanttBar) => bar.barColor)
        .append("text", (bar: GanttBar) => bar.caption)
        
               
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

    constructor(container : any, dp : GanttDataProvider) {
        this.bars = new Array();
        this.startDate = new Date();
        this.endDate = new Date();
        this.d3Container = container;        
        this.dataProvider = dp;
    }

    

    /**
     * name
     */
    public name() {
        
    }
}