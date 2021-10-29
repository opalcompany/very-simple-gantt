import { GanttBar } from "./GanttBar";

export interface onGanttStartDragBarEvent { (bar: GanttBar): boolean }
export interface onGanttDragBarEvent { (bar: GanttBar, newStartTime : Date, newEndTime : Date): boolean}
export interface onGanttEndDragBarEvent { (bar: GanttBar, bars: GanttBar[]): boolean}