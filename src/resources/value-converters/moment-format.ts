import * as moment from "moment";

export class MomentFormatValueConverter {
  public toView(value: moment.Moment, format: string) {
    if (!value) return "";
    if (!moment.isMoment(value)) {
      value = moment(value);
    }
    return value && value.isValid()
      ? value.format(format ? format : "YYYY/MM/DD")
      : "";
  }

  public fromView(value, format: string) {
    if (!value) return "";
    if (!moment.isMoment(value)) {
      value = moment(value);
    }
    return value && value.isValid()
      ? value.format(format ? format : "YYYY/MM/DD")
      : "";
  }
}
