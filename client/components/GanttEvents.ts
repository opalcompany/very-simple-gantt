import { GanttBar } from "./GanttBar";

// must return false if dragging is not allowed for the bar, true if allowed
export interface OnGanttStartDragBarEvent<T>{ (bar: GanttBar<T>): boolean }
export interface OnGanttDragBarEvent<T> { (bar: GanttBar<T>, newStartTime: Date, bars: GanttBar<T>[]): void }
export interface OnGanttEndDragBarEvent<T> { (bar: GanttBar<T>, bars: GanttBar<T>[]): void }

// must return false if resizing is not allowed for the bar, true if allowed
export interface OnGanttStartResizeBarEvent<T> { (resizedBar: GanttBar<T>): boolean }
// must return false if resizing is not allowed for the bar, true if allowed
export interface OnGanttResizeBarEvent<T> { (resizedBar: GanttBar<T>, newEndTime: Date, bars: GanttBar<T>[]): void }
export interface OnGanttEndResizeBarEvent<T> { (resizedBar: GanttBar<T>, bars: GanttBar<T>[]): void }