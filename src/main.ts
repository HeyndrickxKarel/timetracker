import {Aurelia} from 'aurelia-framework';
import environment from './environment';
import { PLATFORM } from "aurelia-pal";
import {
	faArrowRight, faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
export function configure(aurelia: Aurelia): void {
  aurelia.use
    .standardConfiguration()
    .plugin(PLATFORM.moduleName("aurelia-animator-css"))
    .plugin(PLATFORM.moduleName("aurelia-fontawesome"), {
			icons: [
        faArrowRight,
        faTimesCircle
			],
		})
    .feature('resources');

  aurelia.use.developmentLogging(environment.debug ? 'debug' : 'warn');

  if (environment.testing) {
    aurelia.use.plugin('aurelia-testing');
  }

  aurelia.start().then(() => aurelia.setRoot());
}
