import { Project } from "./project";
import moment = require("moment");

export class Activity {
    public id: number;
    public project: Project;
    public startTime: moment.Moment;
    public endTime: moment.Moment;
}