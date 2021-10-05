export class GanttBar {
    public row : number = 0;
    public x : Number;
    public y : Number;
    public width : Number;
    public height : Number;
    public startTime : Date;
    public endTime : Date;

    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.startTime = new Date(0) ;
        this.endTime = new Date(0) ;
    }
}