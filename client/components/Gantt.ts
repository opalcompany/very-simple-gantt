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

import * as d3 from "d3";
import * as d3drag from "d3-drag";
import { GanttBar } from "./GanttBar";
import { GanttRow } from "./GanttRow";
//import { Margins } from './Margins';
import "./style.scss";
//require('./style.scss')

export { GanttBar, GanttRow };

export type Decoration = LineDecoration;
export type LineDecoration = { type: "line"; time: Date; class?: string };
export type DecorationType = Decoration["type"];

export type GanttOptions = {
  rowHeight: number;
  width: number;
  headers: {
    width: number;
    style: {
      [k: string]: any;
    };
    textX: (options: GanttOptions) => number;
    textY: (options: GanttOptions, i: number) => number;
  };
  bars: {
    resizeAnchor: {
      width: number;
      height: number;
      padding: number;
      roundness?: number;
    };
    moveAnchor: {
      width: number;
      height: number;
      padding: number;
      roundness?: number;
    };
    paddingLeft: number;
    paddingRight: number;
    paddingTop: number;
    paddingBottom: number;
    fontFamily: string;
    fontSizes: number[];
    roundness?: number;
    minimumTextSpace: number;
  };
  timebar: { height: number; ticks: number };
  debugAvoidHideTooltip?: boolean;
};

export const DEFAULT_OPTIONS: GanttOptions = {
  headers: {
    width: 100,
    style: {
      "font-size": 18,
      "text-anchor": "middle",
    },
    textX: (opts) => opts.headers.width / 2,
    textY: (opts, i) =>
      i * opts.rowHeight + opts.timebar.height + opts.rowHeight / 2,
  },
  rowHeight: 70,
  width: 2000,
  timebar: { height: 30, ticks: 30 },
  bars: {
    paddingLeft: 20,
    minimumTextSpace: 20,
    paddingRight: 20,
    paddingBottom: 5,
    paddingTop: 5,
    fontFamily: "",
    fontSizes: [14, 10],
    roundness: 0.1,
    moveAnchor: { width: 4, height: 32, padding: 6, roundness: 2 },
    resizeAnchor: { width: 4, height: 12, padding: 6, roundness: 2 },
  },
};
const resizingClass = "ganttBarResizing";
const draggingClass = "ganttBarDragging";

const DECORATION_CLS = "decoration";
export class Gantt<R, T> {
  // scales
  private scale!: d3.ScaleTime<number, number, never>;
  private xAxis!: d3.Axis<Date>;
  // data
  private bars: GanttBar<T>[] = [];
  private _rows: GanttRow<R>[] = [];
  private tooltip: d3.Selection<HTMLDivElement, unknown, any, any>;
  private decorations: LineDecoration[] = [];

  // time range
  private startDate: Date = new Date();
  private endDate: Date = new Date();
  // appearance
  private readonly options: GanttOptions;
  public horizontalLinesColor: string = "#cbcdd6";
  // drag'n'drop
  private startXOfDragEvent?: number;
  private draggedBarStartX?: number;
  private draggedBarEndX?: number;
  private draggedBarId?: string;
  private draggedBarY?: number;
  // resizing
  private resizingBarId?: string;
  private startXOfResizeEvent?: number;
  //private resizingBarStartX?: number;
  private resizingBarEndX?: number;
  //private resizingBarY?: number;

  public get rows() {
    return this._rows;
  }

  public onStartDrag?: (bar: GanttBar<T>) => boolean;
  public onDrag?: (
    bar: GanttBar<T>,
    newStartTime: Date,
    bars: GanttBar<T>[]
  ) => void;
  public onEndDrag?: (bar: GanttBar<T>, bars: GanttBar<T>[]) => void;

  // must return false if resizing is not allowed for the bar, true if allowed
  public onStartResize?: (resizedBar: GanttBar<T>) => boolean;
  public onTooltip?: (bar: GanttBar<T>) => void;
  public onResize?: (
    resizedBar: GanttBar<T>,
    newEndTime: Date,
    bars: GanttBar<T>[]
  ) => void;
  public onEndResize?: (resizedBar: GanttBar<T>, bars: GanttBar<T>[]) => void;
  public readonly tooltipNode: HTMLElement | null;

  private headerSvg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private body: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  private pannableSvg: d3.Selection<SVGSVGElement, unknown, null, undefined>;

  private height(): number {
    return (
      this.options.rowHeight * this._rows.length + this.options.timebar.height
    );
  }

  private convertGanttXToContainerX(ganttXCoord: number): number {
    return ganttXCoord + this.options.headers.width;
  }

  private calculateBarX(bar: GanttBar<T>, x: number): number {
    const time = bar.startTime;
    return this.xForTime(x, time);
  }

  private xForTime(x: number, time: Date): number {
    return this.convertGanttXToContainerX(x + this.scale(time));
  }

  private calculateBarY(bar: GanttBar<T>): number {
    const y =
      bar.row * this.options.rowHeight +
      (this.options.rowHeight - bar.height) / 2;
    return this.yFor(y);
  }

  private gTransform = (bar: GanttBar<T>, x: number) => {
    return `translate(${this.calculateBarX(bar, x)}, ${this.calculateBarY(
      bar
    )})`;
  };

  private idToValidDomId = (id: String) => {
    //alternative is: return '[id="' + id + '"]'
    return "g" + id.replace(/[ ]/g, "_");
  };

  private yFor(y: number): number {
    return this.options.timebar.height + y;
  }

  private gOnStartResize(el: any, event: any, bar: GanttBar<T>): any {
    if (!bar.resizeble) return;

    if (this.onStartResize) {
      if (!this.onStartResize(bar)) return;
    }

    this.startXOfResizeEvent = d3.pointer(event, el)[0];
    this.resizingBarEndX = this.scale(bar.endTime);
    this.resizingBarId = bar.id;

    const pn = d3.select<any, any>("#" + this.idToValidDomId(bar.id));
    //pn.raise().style("opacity", bar.opacity / 2)
    pn.raise().classed(resizingClass, true);
  }

  private gOnResize(el: any, event: any, bar: GanttBar<T>): any {
    if (this.resizingBarId) {
      const correctX = d3.pointer(event, el)[0];
      const delta = correctX - this.startXOfResizeEvent!;
      let newEndTime = this.scale.invert(this.resizingBarEndX! + delta);
      // avoid bar shorter than zero
      if (newEndTime < bar.startTime) {
        newEndTime = new Date(bar.startTime.getTime());
      }
      if (this.onResize) {
        const clonedBars: GanttBar<T>[] = [];
        this.cloneBars(this.bars, clonedBars);
        this.onResize(bar, newEndTime, clonedBars);
      } else {
        bar.endTime = newEndTime;
        this.doUpdateBars(this.bars, false);
      }
      const pn = d3.select<any, any>("#" + this.idToValidDomId(bar.id));
      //pn.raise().style("opacity", bar.opacity / 2)
      pn.raise();
    }
  }

  private gOnEndResize(el: any, event: any, bar: GanttBar<T>): any {
    const pn = d3.select<any, any>("#" + this.idToValidDomId(bar.id));
    //pn.style("opacity", null)
    pn.classed(resizingClass, false);
    this.resizingBarId = undefined;
    if (this.onEndResize) {
      const clonedBars: GanttBar<T>[] = [];
      this.cloneBars(this.bars, clonedBars);
      this.onEndResize(bar, clonedBars);
    }
  }

  private gOnStartDrag(el: Element, event: any, bar: GanttBar<T>): any {
    this.draggedBarId = undefined;
    if (!bar.draggable) return;
    if (this.onStartDrag) {
      if (!this.onStartDrag(bar)) return;
    }
    this.startXOfDragEvent = event.x;
    this.draggedBarStartX = this.scale(bar.startTime);
    this.draggedBarEndX = this.scale(bar.endTime);
    this.draggedBarId = bar.id;
    this.draggedBarY = this.calculateBarY(bar);
    d3.select("#" + this.idToValidDomId(this.draggedBarId!))
      .classed(draggingClass, true)
      //.style("opacity", bar.opacity / 2)
      .attr("cursor", "grabbing")
      .raise();
  }

  private gOnDrag(el: Element, event: any, bar: GanttBar<T>) {
    if (this.draggedBarId) {
      const delta = event.x - this.startXOfDragEvent!;
      let newStartTime = new Date(
        this.scale.invert(this.draggedBarStartX! + delta)
      );
      let newEndTime = new Date(
        this.scale.invert(this.draggedBarEndX! + delta)
      );

      if (this.onDrag) {
        const clonedBars: GanttBar<T>[] = [];
        this.cloneBars(this.bars, clonedBars);
        this.onDrag(bar, newStartTime, clonedBars);
      } else {
        bar.startTime = newStartTime;
        bar.endTime = newEndTime;
        this.doUpdateBars(this.bars, false);
      }
      d3.select("#" + this.idToValidDomId(this.draggedBarId!));
    }
  }

  private gOnEndDrag(el: Element, event: any, bar: GanttBar<T>): any {
    if (this.draggedBarId) {
      if (this.onEndDrag) {
        this.onEndDrag(bar, this.bars);
      }
      d3.select<any, GanttBar<T>>("#" + this.idToValidDomId(this.draggedBarId!))
        .classed(draggingClass, false)
        //.style("opacity", null) //bar.opacity)
        .attr("cursor", this.cursorForBar);
    }
    this.draggedBarId = undefined;
  }

  private barWidth = (bar: GanttBar<T>) => {
    return this.scale(bar.endTime) - this.scale(bar.startTime);
  };

  private makeTooltip(
    parent: d3.Selection<HTMLDivElement, unknown, HTMLElement, undefined>
  ): d3.Selection<HTMLDivElement, unknown, any, any> {
    const result = parent
      .append("div")
      .attr("class", "gantt-tooltip")
      .style("position", "absolute")
      .style("z-index", 10)
      .style("visibility", "hidden");
    const a = result
      .append("svg")
      .attr("class", "gantt-arrow")
      .attr("width", 8)
      .attr("height", 5)
      .style("position", "absolute");

    const tooltipArrow = a.append("g");
    tooltipArrow
      .append("path")
      .attr("class", "gantt-arrow-path")
      .attr("d", "M4 0L8 5L0 5L4 0Z");

    result
      .append("div")
      .attr("class", "gantt-tooltip-content")
      .style("margin-top", "5px")
      .style("white-space", "nowrap");
    return result;
  }

  private loadBars() {
    const self = this;
    const pannableSvg = this.pannableSvg; //d3.select(this.container).select("svg.bars")
    pannableSvg.attr("height", this.height());
    const svgElementHorizontalLines = self.pannableSvg
      .append("g")
      .attr("stroke", self.horizontalLinesColor);

    for (let i = 0; i < self._rows.length; i++) {
      svgElementHorizontalLines
        .append("line")
        .attr("x1", this.options.headers.width)
        .attr("x2", this.options.width)
        .attr("y1", this.options.timebar.height + i * this.options.rowHeight)
        .attr("y2", this.options.timebar.height + i * this.options.rowHeight);
    }

    pannableSvg
      .select(".ganttBars")
      .selectAll<SVGGElement, GanttBar<T>>("g")
      .remove();

    const showTooltip = (ev: any, d: GanttBar<T>) => {
      if (!this.onTooltip) return;
      this.tooltip.style("visibility", "visible");
      this.tooltip.selectAll().remove();

      this.onTooltip(d);

      const wBox = d3
        .select<HTMLElement, any>("body")
        .node()
        ?.getBoundingClientRect();
      const bBox: DOMRect = ev.currentTarget.getBoundingClientRect();
      const w = this.tooltip.node()?.getBoundingClientRect().width ?? 0;
      const hw = w / 2;
      const left = Math.min(
        Math.max(0, bBox.left + this.barWidth(d) / 2 - hw),
        (wBox?.width ?? Number.MAX_VALUE) - w
      );
      this.tooltip
        .style("left", `${left}px`)
        .style("top", `${bBox.top + d.height}px`);

      this.tooltip.select(".gantt-arrow").style("left", `${hw - 4}px`);
    };

    const svgElementBars = pannableSvg
      .select(".ganttBars")
      .selectAll<SVGGElement, GanttBar<T>>("g")
      .data(this.bars, (bar: GanttBar<T>) => bar.id)
      .enter()
      .append("g")
      .on("click", (e: { target: any }, bar: GanttBar<T>) => {
        d3.select("#" + this.idToValidDomId(bar.id)).lower();
      })
      .on(".drag", null)
      .call(
        d3drag
          .drag<any, GanttBar<T>>()
          // "referenceToGantt" refers to the gantt instance ("this" now), "this" is a group element (rect + text) in the function context,
          // event is the d3 event
          // d is the datum aka GanttBar
          .on("start", function (event, d) {
            self.gOnStartDrag(this, event, d);
          })
          .on("drag", function (event, d) {
            self.gOnDrag(this, event, d);
          })
          .on("end", function (event, d) {
            self.gOnEndDrag(this, event, d);
          })
      )
      .on("mouseover", showTooltip)
      .on("mouseout", this._hideTooltip)
      .attr("class", "ganttBar")
      .attr("cursor", this.cursorForBar);

    const bars = svgElementBars;
    bars.append("rect").attr("class", "ganttBarRect");
    bars.append("text").attr("class", "ganttBarCaption line-1");
    bars.append("text").attr("class", "ganttBarCaption line-2");

    bars
      .filter((bar: GanttBar<T>) => bar.draggable)
      .append("rect")
      .attr("class", "ganttBarHandle move")
      .attr("width", this.options.bars.moveAnchor.width);

    bars
      .filter((bar: GanttBar<T>) => bar.resizeble)
      .append("rect")
      .attr("class", "ganttBarHandle resize")
      .attr("width", this.options.bars.resizeAnchor.width)
      .call(
        d3drag
          .drag<any, GanttBar<T>>()
          // "referenceToGantt" refers to the gantt instance ("this" now), "this" is a group element (rect + text) in the function context,
          // event is the d3 event
          // d is the datum aka GanttBar
          .on("start", function (event, d) {
            self.gOnStartResize(d3.select(this), event, d);
          })
          .on("drag", function (event, d) {
            self.gOnResize(d3.select(this), event, d);
          })
          .on("end", function (event, d) {
            self.gOnEndResize(d3.select(this), event, d);
          })
      );

    this.doUpdateBars(this.bars, false);
  }

  private onScroll = (ev: Event) => {
    this._hideTooltip();
  };

  hideTooltip = () => {
    this.tooltip.style("visibility", "hidden");
  };

  private _hideTooltip = () => {
    this.options.debugAvoidHideTooltip || this.hideTooltip();
  };

  private cursorForBar = (bar: GanttBar<T>) =>
    bar.draggable ? "grab" : "default";

  public assignBars(sourceBars: GanttBar<T>[], destinationBars: GanttBar<T>[]) {
    sourceBars.forEach((b) => {
      const destBar = destinationBars.find((ba) => ba.id === b.id);
      if (destBar) {
        Object.assign(destBar, b);
      }
    });
  }

  private readonly pixelDurationListeners: ((millis: number) => void)[] = [];

  onPixelDuration = (l: (millis?: number) => void) => {
    this.pixelDurationListeners.push(l);
    const millis = this.getPixelDuration();
    l(millis);
  };

  offPixelDuration = (l: (millis?: number) => void) => {
    const i = this.pixelDurationListeners.indexOf(l);
    if (i > -1) this.pixelDurationListeners.splice(i, 1);
  };

  private notifyPixelDuration() {
    const millis = this.getPixelDuration();
    this.pixelDurationListeners.forEach((l) => l(millis));
  }

  private getPixelDuration() {
    return (
      this.scale &&
      this.scale.invert(1).getTime() - this.scale.invert(0).getTime()
    );
  }

  cloneBars(sourceBars: GanttBar<T>[], destinationBars: GanttBar<T>[]) {
    sourceBars.forEach((b) => {
      const newBar: GanttBar<T> = { ...b };
      destinationBars.push(newBar);
    });
  }

  reload = (rows: GanttRow<R>[], bars: GanttBar<T>[]) => {
    this._rows = rows;
    this.bars = bars;
    this.loadHeaders();
    this.loadBars();
  };

  setDecorations = (decorations: Decoration[]) => {
    this.decorations = decorations;
    this.loadDecorations();
  };

  setTimeRange = (startDate: Date, endDate: Date) => {
    this.startDate = startDate;
    this.endDate = endDate;

    this.loadTimeBar();
    this.loadHeaders();
    this.loadBars();
    this.loadDecorations();
    this.notifyPixelDuration();
  };

  private loadTimeBar = () => {
    this.scale = d3
      .scaleTime()
      .range([0, this.options.width - this.options.headers.width])
      .domain([this.startDate, this.endDate]);

    this.xAxis = d3
      .axisTop<Date>(this.scale)
      //.ticks(d3.timeDay)
      .ticks(this.options.timebar.ticks);
    //.tickFormat(d=>d3.timeFormat("%B %Y")(d));
    this.pannableSvg
      .select<SVGGElement>("g.timeBar")
      .attr(
        "transform",
        `translate(${this.options.headers.width}, ${this.options.timebar.height})`
      ) // This controls the vertical position of the Axis
      .call(this.xAxis);
  };

  private loadHeaders = () => {
    this.headerSvg.attr("height", this.height());
    this.headerSvg.selectAll("g").remove();
    const svgElementsHeader = this.headerSvg
      .selectAll("g")
      .data(this._rows)
      .enter()
      .append("g");

    svgElementsHeader
      .append("rect")
      .attr("x", 0)
      .attr(
        "y",
        (_, i: number) =>
          i * this.options.rowHeight + this.options.timebar.height
      )
      .attr("width", () => this.options.headers.width)
      .attr("height", () => this.options.rowHeight)
      .attr("fill", (row: GanttRow<R>) => row.color ?? null)
      .attr("stroke", (row: GanttRow<R>) => row.borderColor ?? null);

    const text = svgElementsHeader
      .append("text")
      .attr("x", () => this.options.headers.textX(this.options))
      .attr("y", (_, i: number) => this.options.headers.textY(this.options, i))
      .text(function (row: GanttRow<R>) {
        return row.caption;
      });
    Object.entries(this.options.headers.style).forEach(([k, v]) =>
      text.style(k, v)
    );
  };

  constructor(container: HTMLElement, options?: GanttOptions) {
    this.options = options ?? DEFAULT_OPTIONS;

    const parent = d3
      .select(container)
      .append("div")
      .style("position", "relative");
    addEventListener("scroll", this.onScroll, true);

    const parentBox = parent.node()?.getBoundingClientRect();

    const parentWidth = parentBox?.width;
    // svg.append("pattern")
    //     .attr("id", "grabPattern")
    //     .attr("patternUnits", "userSpaceOnUse")
    //     .attr("width", 4)
    //     .attr("height", 4)
    //     .append("path").attr("d", "M-1,1 l2,-2   M0, 4 l4, -4   M3, 5 l2, -2")
    //     .style("stroke", "black")
    //     .style("opacity", .3)
    //     .style("stroke-width", "1")

    parent
      .append("svg")
      .attr("class", "gantt-top-line")
      .attr("width", parentWidth ?? 2000)
      .attr("height", this.options.timebar.height)
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("z-index", 2)
      .append("line")
      .attr("class", "gantt-top-line")
      .attr("x1", 0)
      .attr("x2", this.options.width)
      .attr("y1", this.options.timebar.height)
      .attr("y2", this.options.timebar.height);

    this.headerSvg = parent
      .append("svg")
      .attr("class", "header")
      .attr("width", this.options.headers.width)
      .attr("height", this.height())
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("z-index", 1);
    //.call(svg => svg.append("g").call(yAxis));

    this.body = parent
      .append("div")
      .style("overflow-x", "scroll")
      .style("-webkit-overflow-scrolling", "touch");

    this.pannableSvg = this.body
      .append("svg")
      .attr("class", "bars")
      .attr("width", this.options.width)
      .style("display", "block");

    this.tooltip = this.makeTooltip(d3.select("body"));
    this.tooltipNode = this.tooltip
      .selectChild<HTMLElement>(".gantt-tooltip-content")
      .node();

    this.pannableSvg.on("click", (e: { target: any }) => {
      console.log("clic! " + d3.select<any, GanttBar<T>>(e.target).datum()?.id);
    });

    this.pannableSvg.append("g").attr("class", "timeBar");

    this.pannableSvg.append("g").attr("class", "ganttBars");
    this.pannableSvg.append("g").attr("class", "decorations");
    //yield parent.node();

    // Initialize the scroll offset after yielding the chart to the DOM.
    //this.body.node()!.scrollBy(this.options.width, 0);
  }

  dispose = () => {
    this.tooltip.remove();
  };

  private loadDecorations = () => {
    const self = this;
    const ds = this.pannableSvg.select(".decorations");
    ds.selectAll(`.${DECORATION_CLS}`).remove();
    ds.selectAll(`.${DECORATION_CLS}`)
      .data(this.decorations)
      .enter()
      .each(function (d) {
        const el = d3.select(this).datum(d);
        self
          .decorationFunc(d.type)(el, d)
          .attr("class", (_d, i, a) =>
            [d3.select(a[i]).attr("class"), DECORATION_CLS].join(" ")
          );
      });
  };

  private decorationFunc = (t: DecorationType) => {
    switch (t) {
      case "line":
        return this.lineDecorationFunc;
      default:
        throw new Error("Missing func for decoration type: " + t);
    }
  };

  private lineDecorationFunc = <T extends d3.BaseType>(
    enter: d3.Selection<T, LineDecoration, any, any>,
    line: LineDecoration
  ) => {
    //return enter.append("text").text((l) => "ciao " + l.type);
    return enter
      .append("line")
      .attr("class", ["decoration-line", line.class].join(" "))
      .attr("x1", this.xForTime(0, line.time))
      .attr("x2", this.xForTime(0, line.time))
      .attr("y1", this.yFor(0))
      .attr("y2", this.yFor(this.options.rowHeight * this._rows.length));
  };

  doUpdateBars = (nbars: GanttBar<T>[], noText?: boolean) => {
    //var ids = d3.selectAll<SVGGElement, GanttBar>("g.ganttBar").data().map(b => b.id)
    //nbars = ids.map(id => nbars.find(b => b.id === id)!)

    this.assignBars(nbars, this.bars);

    var bars = d3
      .selectAll<SVGGElement, GanttBar<T>>("g.ganttBar")
      .data(this.bars, (bar: GanttBar<T>) => bar.id);

    bars
      .attr("transform", (bar: GanttBar<T>) => this.gTransform(bar, 0))
      .attr("class", (bar: GanttBar<T>) => this.classesForBar(bar).join(" "))
      .attr("id", (bar: GanttBar<T>) => {
        return this.idToValidDomId(bar.id);
      });

    const roundness = this.options.bars.roundness;
    bars
      .selectChild(".ganttBarRect")
      .attr("rx", () => roundness ?? null)
      .attr("ry", () => roundness ?? null)
      .attr("width", this.barWidth)
      .attr("height", (bar) => bar.height)
      .style("opacity", (bar) => bar.opacity ?? null)
      .attr("fill", (bar) => bar.barColor ?? null);

    const textWidth = (bar: GanttBar<T>) => {
      return (
        this.barWidth(bar) -
        this.options.bars.paddingLeft -
        this.options.bars.paddingRight
      );
    };

    const inTimeRange = (bar: GanttBar<T>) =>
      bar.endTime.getTime() > this.startDate.getTime() &&
      bar.startTime.getTime() < this.endDate.getTime();

    const minimumTextSpace = this.options.bars.minimumTextSpace;

    function writeText(this: any, bar: GanttBar<T>, text: string) {
      if (noText) return;
      const self = d3.select(this);
      if (!inTimeRange(bar)) return;

      const width = textWidth(bar);

      if (width <= minimumTextSpace) {
        self.text("");
        return;
      }
      self.text(text);
      const node = self.node();
      let textLength = node.getComputedTextLength();
      while (textLength > width && text.length > 0) {
        text = text.slice(0, -1);
        if (text.length === 0) self.text("");
        else self.text(text + "...");
        textLength = node.getComputedTextLength();
      }
    }

    bars
      .selectChild(".ganttBarCaption.line-1")
      .attr("x", (bar: GanttBar<T>) => this.options.bars.paddingLeft)
      .attr("y", (bar: GanttBar<T>) => this.options.bars.paddingTop)
      .attr("text-anchor", "left")
      .attr("dominant-baseline", "hanging")
      .style("font-family", this.options.bars.fontFamily)
      .style("font-size", this.options.bars.fontSizes[0])
      .attr("cursor", "inherited")
      .each(function (bar: GanttBar<T>) {
        writeText.call(this, bar, bar.captions[0]);
      });

    bars
      .selectChild(".ganttBarCaption.line-2")
      .attr("x", (bar: GanttBar<T>) => this.options.bars.paddingLeft)
      .attr(
        "y",
        (bar: GanttBar<T>) => bar.height - this.options.bars.paddingBottom
      )
      .attr("text-anchor", "left")
      .attr("dominant-baseline", "text-bottom")
      .style("font-family", this.options.bars.fontFamily)
      .style(
        "font-size",
        this.options.bars.fontSizes[1] ?? this.options.bars.fontSizes[0]
      )
      .attr("cursor", "inherited")
      .each(function (bar: GanttBar<T>) {
        writeText.call(this, bar, bar.captions[1]);
      });

    bars
      .selectChild(".ganttBarHandle.resize")
      .attr(
        "x",
        (bar) =>
          this.barWidth(bar) -
          this.options.bars.resizeAnchor.width -
          this.options.bars.resizeAnchor.padding
      )
      .attr(
        "y",
        (bar) => (bar.height - this.options.bars.resizeAnchor.height) / 2
      )
      .attr("rx", () => this.options.bars.resizeAnchor.roundness ?? null)
      .attr("ry", () => this.options.bars.resizeAnchor.roundness ?? null)
      .attr("height", () => this.options.bars.resizeAnchor.height)
      .attr("cursor", "e-resize")
      .style("opacity", (bar) => bar.opacity ?? null);

    bars
      .selectChild(".ganttBarHandle.move")
      .attr("height", () => this.options.bars.moveAnchor.height)
      .attr("rx", () => this.options.bars.moveAnchor.roundness ?? null)
      .attr("ry", () => this.options.bars.moveAnchor.roundness ?? null)
      .attr("fill", () => "black")
      .attr("x", () => this.options.bars.moveAnchor.padding)
      .attr(
        "y",
        (bar) => (bar.height - this.options.bars.moveAnchor.height) / 2
      )
      .style("opacity", (bar) => bar.opacity ?? null)
      .attr("visibility", (bar) =>
        this.barWidth(bar) >
        this.options.bars.resizeAnchor.padding +
          this.options.bars.resizeAnchor.width +
          this.options.bars.moveAnchor.padding +
          this.options.bars.moveAnchor.width +
          10
          ? "visible"
          : "hidden"
      );
  };

  private classesForBar = (bar: GanttBar<T>) => {
    const result = ["ganttBar", ...(bar.classes ?? []).filter((e) => !!e)];
    if (bar.id === this.draggedBarId) result.push(draggingClass);
    if (bar.id === this.resizingBarId) result.push(resizingClass);
    return result;
  };
}
