
export interface GanttBar<T> {
    classes?: string[];
    id: string;
    row: number;
    height: number;
    startTime: Date;
    endTime: Date;
    barColor: string;
    opacity: number;
    caption: string;
    data: T;
    draggable: boolean;
    resizeble: boolean;
}
