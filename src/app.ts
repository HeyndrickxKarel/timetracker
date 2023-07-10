import { DataContainer } from "resources/models/data-container";
import { observable, TaskQueue, autoinject } from "aurelia-framework";
import { Project } from "resources/models/project";
import { Activity } from "resources/models/activity";
import moment = require("moment");
import { ProjectOverview } from "resources/models/project-overview";
import {BindingEngine} from 'aurelia-framework';
import { HistoryOverview } from "resources/models/history-overview";
import { SuggestedProject } from "resources/models/suggested-project";

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
  public suggestedProject: SuggestedProject;

  public suggestedProjects: SuggestedProject[];
  public highlightedSuggestedProjectIndex: number;
  public suggestionContainerInner: HTMLElement;


  public activitiesToday: ProjectOverview[] = [];
  public activitiesBefore: ProjectOverview[] = [];

  public viewProjects: boolean = false;
  public viewHistory: boolean = false;
  public viewOverview: boolean = true;

  public historyOverviews: HistoryOverview[] = [];

  public constructor(private taskQueue: TaskQueue, private be: BindingEngine){
    this.loadDataFromStorage();
    if(this.dc.lastActivity && this.dc.lastActivity.endTime.format('DD/MM/YYYY') == moment().format('DD/MM/YYYY')){
      this.setFields(this.dc.lastActivity);   
    } else {
      this.setFields();
    }
  }

  public attached(){
    this.clearHistoryOlderThan2Weeks();
    this.setOverview();
    this.focusNewLine();
  }

  public projectNameChanged(){
    this.clearSuggestions();
    if (this.projectName && this.projectName.length > 0){
      let suggestion = this.dc.projects.filter(p => p.name.toLowerCase().startsWith(this.projectName.toLowerCase()))[0];

      this.suggestedProjects = this.dc.projects.filter(p => p.name.toLowerCase().startsWith(this.projectName.toLowerCase())).map(p => {
        let obj ={project: p, correctString: p.name.substr(0, this.projectName.length), remainingString: p.name.substr(this.projectName.length)};
        return obj;
      });
      if(this.suggestedProjects.length > 0)
      this.suggestedProject = this.suggestedProjects[0];
    } 
  }

  public clearSuggestions(){
    this.suggestedProject = null;
    this.suggestedProjects = [];
    this.highlightedSuggestedProjectIndex = 0;
    $(this.suggestionContainerInner).animate({top: 0}, 100, 'swing');
  }

  public keyDownInProjectName(e){
    if (e.keyCode === 13) { // enter key
      this.taskQueue.queueTask(() => this.submit())
    }
    else if (e.keyCode === 38) // up 
    {
      this.scrollSuggestionContainer(false)
    }
    else if (e.keyCode === 40) // down 
    {
      this.scrollSuggestionContainer(true);
    }
    return true;
  }

  public scrollSuggestionContainer(up: boolean){
    if(up && (this.highlightedSuggestedProjectIndex == this.suggestedProjects.length - 1) || (!up && this.highlightedSuggestedProjectIndex == 0))
    return;
    this.highlightedSuggestedProjectIndex += (up? 1 : -1);
    let newTop = -this.highlightedSuggestedProjectIndex * 24;
    $(this.suggestionContainerInner).animate({top: newTop}, 100, 'swing');
    this.suggestedProject = this.suggestedProjects[this.highlightedSuggestedProjectIndex];
  }

  public submit(){
    if(this.projectName && this.projectName.length > 0){

      // Find out which project he is talking about, is it a new one -> add it, is it a known one -> use reference.
      let project;
      if(!this.suggestedProject){
        project = {name: this.projectName} as Project;
        this.dc.projects.push(project);
      } else {
        project = this.suggestedProject.project;
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
      this.clearSuggestions();
      this.setFields(activity);
      this.focusNewLine();
    }

  }

  public focusNewLine(){
    if(this.viewOverview)
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
      let po = new ProjectOverview(this.be, [activity], activity.project);
      list.push(po);
    }
  }

  public deleteActivity(list: ProjectOverview[], projectOverview: ProjectOverview, index: number){
      let activity = projectOverview.activities.splice(index, 1)[0];
      if(projectOverview.activities.length == 0){
        projectOverview.dispose();
        let indexOfOverview = list.indexOf(projectOverview);
        list.splice(indexOfOverview, 1);
      }
      let indexInDc = this.dc.activities.findIndex(a => a.id == activity.id);
      this.dc.activities.splice(indexInDc, 1);
      this.saveDataToStorage();

      this.startHour = activity.startTime.hour();
      this.startMinute = activity.startTime.minute();
      this.endHour = 0;
      this.endMinute = 0;    
  }

  public goToProjects(){
    this.viewProjects = true;
    this.viewHistory = false;
    this.viewOverview = false;

  }

  public goToOverview(){
    this.viewOverview = true;
    this.viewProjects = false;
    this.viewHistory = false;
  }

  public goToHistory(){
    this.viewHistory = true;
    this.viewOverview = false;
    this.viewProjects = false;

    this.setHistory();
  }

  public deleteProject(project: Project){
    let index = this.dc.projects.indexOf(project);
    this.dc.projects.splice(index, 1);
    this.saveDataToStorage();
  }

  public setHistory(){
    this.historyOverviews = [];
    let dates = this.dc.activities.map(a => a.endTime);
    let minDate = moment(moment.min(dates));

    let today = moment();
    while (today.isSameOrAfter(minDate, "day")) {
      this.dc.activities.forEach(element => {
      });
      let activies = this.dc.activities.filter(a => moment(a.endTime).isSame(today, "day")).sort((a, b) => a.startTime.valueOf() - b.startTime.valueOf());
      if(activies.length > 0){
        const overview = {
          date: moment(today), 
          activities: activies
        } as HistoryOverview
        this.historyOverviews.push(overview);
      }
      today = today.add(-1, "day");
    }
  }

  public clearHistoryOlderThan2Weeks(){
    this.dc.activities = this.dc.activities.filter(a => a.startTime.isAfter(moment().add(-2, "weeks")));
    this.saveDataToStorage();
  }
}
