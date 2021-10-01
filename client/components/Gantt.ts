// https://betterprogramming.pub/add-an-html-canvas-into-your-react-app-176dab099a79
import * as d3 from 'd3';
import {GanttBar} from "./GanttBar"

export class Gantt {
    private svg: any;
    private d3Container : any;  
    
    public height : number = 1000;
    public width : number = 1000;

    public bars: GanttBar[];
        
    public init() {        
        this.svg = d3.select(this.d3Container.current)
        .append("svg")
        .attr("width", this.width)
        .attr("height", this.height);        
    }

    public loadBars(){
        console.log("ci provo");
        
        this.svg.selectAll("rect")
        .data(this.bars)        
        .transition().duration(750)
        .attr("x", (r: { x: any; }) => r.x)
        .attr("y", (r: { y: any; }) => r.y)
        .attr("width", (r: { width: any; }) => r.width)
        .attr("height", (r: { height: any; }) => r.height)  
        
        /*
        this.svg.selectAll("rect")
        .enter()
        .append("rect")
        .attr("x", 100)
        .attr("y", 100)
        .attr("width", 1000)
        .attr("height", 1000)          
        */


        this.svg.selectAll("rect")
        .data(this.bars)
        .enter()
        .append("rect")
        .transition().duration(1000)
        .attr("x", (r: { x: any; }) => r.x)
        .attr("y", (r: { y: any; }) => r.y)
        .attr("width", (r: { width: any; }) => r.width)
        .attr("height", (r: { height: any; }) => r.height)
        
        this.svg.selectAll("rect")
        .data(this.bars).exit().remove()     
        
        this.svg.on("click", (e: { target: any; }) => { console.log("clic! " + d3.select(e.target).datum()) })
        
    }

    constructor(container : any) {
        this.bars = new Array();
        this.d3Container = container;        
    }

    

    /**
     * name
     */
    public name() {
        
    }
}