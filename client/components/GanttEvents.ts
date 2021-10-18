import { GanttBar } from "./GanttBar";

export interface onGanttStartDragBarEvent { (bar: GanttBar): boolean }
export interface onGanttDragBarEvent { (bar: GanttBar, destDate : Date): boolean}
export interface onGanttEndDragBarEvent { (bar: GanttBar): boolean}