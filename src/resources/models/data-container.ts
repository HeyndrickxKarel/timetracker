import { Activity } from "./activity";
import { Project } from "./project";

export class DataContainer {
    public activities: Activity[];
    public projects: Project[];
    public lastActivity: Activity;
}