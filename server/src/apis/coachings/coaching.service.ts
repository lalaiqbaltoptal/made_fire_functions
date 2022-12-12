import { Injectable } from '@nestjs/common';
import { FireCollection } from 'src/constants/fireCollection';
import { AdvisorPrefDto } from 'src/dtos/advisor_pref_body';
import { Advisor } from 'src/models/advisors.model';
import { UserPreferenceModel } from 'src/models/coaching.model';
import { EndNodesModel } from 'src/models/end_node.model';
import { ResponseModel } from 'src/models/response.model';
import { Action, UserActionHabits } from 'src/models/user_action_habits';
import { FireAdminService } from 'src/services/fire-admin.service';
import { MadeUtils } from 'src/utils/MadeUtils';
import { AdvisorsService } from '../advisors/advisors.service';
import { SetupService } from '../setup/setup.service';

@Injectable()
export class CoachingService {
  constructor(
    private fireService: FireAdminService,
    private setupService: SetupService,
    private advisorService: AdvisorsService,
  ) {}

  async getActionAndHabits(userId: string): Promise<ResponseModel> {
    const coaching = await this.fireService
      .getQuery(FireCollection.coaching)
      .where('userId', '==', userId)
      .get();
    // TODO - change this functions such as only required end nodes are fetched;
    const allEndNodes: EndNodesModel[] = (await this.setupService.getEndNodes())
      .data as EndNodesModel[];
    const endNodes = [];
    const advisorPref: UserPreferenceModel[] = [];
    coaching.docs.forEach((item) => {
      endNodes.push(item.data().endNodeId);
      advisorPref.push(item.data().advisorPreference);
    });
    const advisorsList = [];
    for (let i = 0; i < advisorPref.length; i++) {
      const advPref: AdvisorPrefDto = {
        ageLower: advisorPref[i].minAge,
        ageUpper: advisorPref[i].maxAge,
        gender: advisorPref[i].gender,
        ethnicity: advisorPref[i].ethnicity,
        type: advisorPref[i].type,
      };
      const listAdvisors: Advisor[] = (await (
        await this.advisorService.getAdvisorsList(advPref)
      ).data) as Advisor[];
      const toAdd = false;

      advisorsList.push(
        listAdvisors.filter(
          (item) =>
            !MadeUtils.listContain(item.id, advisorPref[i].rejectedAdvisors) ||
            true,
        ),
      );
    }

    const actions = await this.fireService
      .getQuery(FireCollection.actions)
      .where('endNodeId', 'in', endNodes)
      .get();
    const habits = await this.fireService
      .getQuery(FireCollection.habits)
      .where('endNodeId', 'in', endNodes)
      .get();

    const userActionAndHabits: UserActionHabits[] = [];
    endNodes.forEach((item, index) => {
      const userActions: Action[] = [];
      const userHabits: Action[] = [];
      let endNodeTitle = '';
      let fistTitle = '';
      const advisors: Advisor[] = advisorsList[index];

      allEndNodes.forEach((node) => {
        if (node.id == item) {
          endNodeTitle = node.title;
        }
        try {
          fistTitle = node.predeLevels[0].title;
        } catch (err) {}
      });
      let advisorIndex = 0;
      actions.docs.forEach((doc) => {
        if (doc.data().endNodeId == item) {
          userActions.push(
            Object.assign(
              doc.data() as Action,
              { id: doc.id },
              {
                advisor: advisors[advisorIndex],
              },
            ),
          );
        }
        advisorIndex = (advisorIndex + 1) % advisors.length;
      });
      advisorIndex = 0;
      habits.docs.forEach((doc) => {
        if (doc.data().endNodeId == item) {
          userHabits.push(
            Object.assign(
              doc.data() as Action,
              { id: doc.id },
              {
                advisor: advisors[advisorIndex],
              },
            ),
          );
          advisorIndex = (advisorIndex + 1) % advisors.length;
        }
      });
      userActionAndHabits.push({
        endNodeId: item,
        actions: userActions,
        habits: userHabits,
        endNodeTitle: endNodeTitle,
        firstLevelTitle: fistTitle,
      });
    });
    return {
      count: undefined,
      message: 'Loaded',
      success: true,
      data: userActionAndHabits,
    };
  }
}
