import { LevelModel } from './level.model';
import { PredecessorLevelModel } from './predecessor_level.model';
import { SetupModel } from './setup.model';

export class EndNodesModel extends SetupModel {
  predeLevels: PredecessorLevelModel[];
}
