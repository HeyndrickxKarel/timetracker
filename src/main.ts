import {Aurelia} from 'aurelia-framework';
import environment from './environment';
import { PLATFORM } from "aurelia-pal";
import {
  faArrowLeft,
	faArrowRight, faCog, faHistory, faStopwatch, faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import * as numeral from "numeral";
import "numeral/locales/nl-be";

export function configure(aurelia: Aurelia): void {
  aurelia.use
    .standardConfiguration()
    .plugin(PLATFORM.moduleName("aurelia-animator-css"))
    .plugin(PLATFORM.moduleName("aurelia-fontawesome"), {
			icons: [
        faArrowRight,
        faTimesCircle,
        faStopwatch,
        faCog,
        faArrowLeft,
        faHistory
			],
		})
    .feature('resources');

    numeral.locale("nl-BE");


  aurelia.use.developmentLogging(environment.debug ? 'debug' : 'warn');

  if (environment.testing) {
    aurelia.use.plugin('aurelia-testing');
  }

  aurelia.start().then(() => aurelia.setRoot());
}
