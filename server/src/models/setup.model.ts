export class SetupModel {
  title: string;
  description: string;
  id: string;
  predecessorName: string;
  predecessorId: string;
  levelName: string;
  type: string;
  index: number;
  priority: number;
  nextTagLine: string;
  isSelected?: boolean;
  cpQuestions?: string[];
  price?: number;
  nextNodes?: SetupModel[];
  creationDate?: number;
  updatedDate?: number;
}

export class CpQUestions {
  id: string;
  question: string;
}
