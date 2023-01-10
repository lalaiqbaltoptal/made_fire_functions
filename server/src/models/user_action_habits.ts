import { Advisor } from './advisors.model';
import { CpQUestions } from './setup.model';

export class Action {
  id: string;
  advisor?: Advisor;
  subscriptionId: string;
  index: number;
  title: string;
  priority: number;
  isSelected: boolean;
  personalizeId: string;
  endNodeId: string;
  steps: Step[];
  cpQuestions: CpQUestions[];
}

export class Step {
  advisor?: Advisor;
  subscriptionId: string;
  title: string;

  questions: Question[];
}

export class Question {
  advisor?: Advisor;
  statements: string;
  subscriptionId: string;
  paragraph: string;
}
