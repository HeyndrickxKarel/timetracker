import { DataContainer } from "resources/models/data-container";
import { observable, TaskQueue, autoinject } from "aurelia-framework";
import { Project } from "resources/models/project";
import { Activity } from "resources/models/activity";
import moment = require("moment");
import { ProjectOverview } from "resources/models/project-overview";

@autoinject
export class App {
  public dc: DataContainer;

  @observable
  public startHour: number;
  @observable
  public startMinute: number;
  @observable
  public endHour: number;
  @observable
  public endMinute: number;

  @observable
  public projectName: string;
  public suggestedProject: Project;
  public suggestedProjectCorrect: string;
  public suggestedProjectRemaining: string;

  public activitiesToday: ProjectOverview[] = [];
  public activitiesBefore: ProjectOverview[] = [];

  public constructor(private taskQueue: TaskQueue){
    this.loadDataFromStorage();
    if(this.dc.lastActivity && this.dc.lastActivity.endTime.format('DD/MM/YYYY') == moment().format('DD/MM/YYYY')){
      this.setFields(this.dc.lastActivity);   
    } else {
      this.setFields();
    }
  }

  public attached(){
    this.setOverview();
    this.focusNewLine();
  }

  public projectNameChanged(){
    if (this.projectName && this.projectName.length > 0){
      let suggestion = this.dc.projects.filter(p => p.name.toLowerCase().startsWith(this.projectName.toLowerCase()))[0];
      if(suggestion){
        this.suggestedProject = suggestion;
        this.suggestedProjectCorrect = this.suggestedProject.name.substr(0, this.projectName.length);
        this.suggestedProjectRemaining = this.suggestedProject.name.substr(this.projectName.length);
      } else {
        this.clearSuggestion();
      }

    } else {
      this.clearSuggestion();
    }
  }

  public clearSuggestion(){
    this.suggestedProject = null;
    this.suggestedProjectCorrect = null;
    this.suggestedProjectRemaining = null;
  }

  public keyDownInProjectName(e){
    if (e.keyCode === 13) { // enter key
      this.taskQueue.queueTask(() => this.submit())
    }
    return true;
  }

  public submit(){
    if(this.projectName && this.projectName.length > 0){
      // Find out which project he is talking about, is it a new one -> add it, is it a known one -> use reference.
      let project;
      if(!this.suggestedProject){
        project = {name: this.projectName} as Project;
        this.dc.projects.push(project);
      } else {
        project = this.suggestedProject;
      }
      
      //Format timestamps
      let startTime = moment().hour(this.startHour).minute(this.startMinute);
      let endTime = moment().hour(this.endHour).minute(this.endMinute);
      
      let activity = {project: project, startTime: startTime, endTime: endTime, id: Date.now()} as Activity;
      
      //Push activity
      this.dc.activities.push(activity);
      this.dc.lastActivity = activity;
      
      // Add activity to overview
      this.addToOverview(this.activitiesToday, activity);
      
      // Sync data
      this.saveDataToStorage();
      
      // Clear and set fields
      this.clearSuggestion();
      this.setFields(activity);
      this.focusNewLine();
    }

  }

  public focusNewLine(){
    document.getElementById("startHour").focus();
  }

  public setFields(previousActivity? : Activity){
    if(previousActivity){
      this.startHour = previousActivity.endTime.hour();
      this.startMinute = previousActivity.endTime.minute();
      this.endHour = 0;
      this.endMinute = 0;
    } else {
      this.startHour = 8;
      this.startMinute = 30;
      this.endHour = 12;
      this.endMinute= 0;
    }
    this.projectName = "";
  }

  public saveDataToStorage(){
    localStorage.setItem("timetracker", JSON.stringify(this.dc));
  }

  public loadDataFromStorage(){
    let data = localStorage.getItem("timetracker");
    if(data){
      this.dc = JSON.parse(data);
      this.dc.activities.forEach((activity : any) => {
        activity.startTime = moment(activity.startTime);
        activity.endTime = moment(activity.endTime);
      })
      this.dc.lastActivity.startTime = moment(this.dc.lastActivity.startTime);
      this.dc.lastActivity.endTime = moment(this.dc.lastActivity.endTime);
    } else {
      this.dc = {activities: [], projects: []} as DataContainer;
    }
  }

  public setOverview(){
    this.dc.activities.forEach(activity => {
      let list;
      // If same day
      if(moment().format('DD/MM/YYYY') == activity.startTime.format('DD/MM/YYYY')){
        list = this.activitiesToday; 
      } else {
        list = this.activitiesBefore;
      }
      this.addToOverview(list, activity);
    });

  }

  public addToOverview(list: ProjectOverview[], activity: Activity){
    let overview = list.find(a => a.project.name == activity.project.name);
    if(overview){
      overview.activities.push(activity);
    } else {
      list.push({project: activity.project, activities: [activity]} as ProjectOverview);
    }
  }

  public deleteActivity(list: ProjectOverview[], projectOverview: ProjectOverview, index: number){
      let activity = projectOverview.activities.splice(index, 1)[0];
      if(projectOverview.activities.length == 0){
        let indexOfOverview = list.indexOf(projectOverview);
        list.splice(indexOfOverview, 1);
      }
      let indexInDc = this.dc.activities.findIndex(a => a.id == activity.id);
      this.dc.activities.splice(indexInDc, 1);
      this.saveDataToStorage();
  }
}
