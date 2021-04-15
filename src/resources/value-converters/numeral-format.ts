import * as numeral from "numeral";

export class NumeralFormatValueConverter {
  toView(value, format = "0,0.00") {
    return value != null ? numeral(+value).format(format) : "";
  }
}
