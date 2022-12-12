import { Advisor } from './advisors.model';

export class Action {
  id: string;
  index: number;
  title: string;
  priority: number;
  orderNo: number;
  advisor: Advisor;
  endNodeId: string;
  steps: Step[];
}

export class Step {
  title: string;
  questions: Question[];
}

export class Question {
  statements: string;
  paragraph: string;
}

export class UserActionHabits {
  endNodeId: string;
  endNodeTitle: string;
  firstLevelTitle: string;
  actions: Action[];
  habits: Action[];
}
