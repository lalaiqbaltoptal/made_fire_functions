export class AdvisorsOptionModel {
  age: AgeModel[];
  ethnicity: string[];
  gender: string[];
  type: string[];
}

export class AgeModel {
  lower: number;
  upper: number;
}
