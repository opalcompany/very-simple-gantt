
export class GanttBar {
    public id: string;
    public row: number = 0;
    public height: number;
    public startTime: Date;
    public endTime: Date;
    public barColor: string;
    public opacity: number;
    public caption: string;
    public data?: object;
    public draggable: boolean = false;
    public resizeble: boolean = false;

    constructor() {
        this.id = '';
        this.height = 0;
        this.startTime = new Date(0);
        this.endTime = new Date(0);
        this.barColor = '#ffeeaa';
        this.caption = '';
        this.opacity = 0.5;
    }

    public copyTo(destination: GanttBar) {
        destination.id = this.id;
        destination.height = this.height;
        destination.startTime = this.startTime;
        destination.endTime = this.endTime;
        destination.barColor = this.barColor;
        destination.caption = this.caption;
        destination.opacity = this.opacity;
        destination.data = this.data;
    }
}

