import { Activity } from "./activity";
import { Project } from "./project";
import {BindingEngine} from 'aurelia-framework';
import { Disposable, observable } from "aurelia-framework";

export class ProjectOverview {
    public project: Project;
    @observable
    public activities: Activity[];
    public totalHours: number;
    public totalMinutes: number;
    public subscription: Disposable

    public constructor(private be: BindingEngine, activities: Activity[], project: Project) {
        console.log("constructed");
        this.activities = activities;
        this.project = project;

        this.subscription = this.be
        .propertyObserver(this.activities, 'length')
        .subscribe((newValue, oldValue) => { 
            this.calculateTotalDurationOverview()
        });

        this.calculateTotalDurationOverview();
    }

    public dispose(){
        this.subscription.dispose();
    }

    public calculateTotalDurationOverview(){
        if(this.activities && this.activities.length > 0){
            let totalMinutes = 0; 
            this.activities.forEach(activity => {
              let totalMinutesAct = activity.endTime.diff(activity.startTime, "minutes");
              totalMinutes += totalMinutesAct;
            });
            this.totalMinutes = totalMinutes % 60;
            this.totalHours =  Math.trunc(totalMinutes / 60);
        } else {
            this.totalHours = 0;
            this.totalMinutes = 0;
        }
        
      }
}