
export class GanttBar {
    public row : number = 0;
    public height : number;
    public startTime : Date;
    public endTime : Date;
    public barColor : string;
    public caption : string;

    constructor() {
        this.height = 0;
        this.startTime = new Date(0) ;
        this.endTime = new Date(0) ;
        this.barColor = '#ffeeaa'; 
        this.caption = '';
    }

    width (scale : any) : number {
        return scale(this.endTime) - scale(this.startTime)

    }
}