
export class GanttBar {
    public row : number = 0;
    public height : number;
    public startTime : Date;
    public endTime : Date;
    public barColor : string;
    public opacity : number;
    public caption : string;
    public data? : any;

    constructor() {
        this.height = 0;
        this.startTime = new Date(0) ;
        this.endTime = new Date(0) ;
        this.barColor = '#ffeeaa'; 
        this.caption = '';
        this.opacity = 0.5;
    }

    width (scale : any) : number {
        return scale(this.endTime) - scale(this.startTime)

    }
}