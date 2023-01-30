export interface GanttRow<T> {
  row: number;
  caption: string;
  borderColor?: string;
  color?: string;
  data: T;
}
