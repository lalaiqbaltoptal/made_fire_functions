import { BadRequestException, Injectable } from '@nestjs/common';
import { FireCollection } from 'src/constants/fireCollection';
import { AdvisorPrefDto } from 'src/dtos/advisor_pref_body';
import { SubscriptionDto } from 'src/dtos/subscription.dto';
import { Advisor } from 'src/models/advisors.model';
import { CoachingModel, UserPreferenceModel } from 'src/models/coaching.model';
import { EndNodesModel } from 'src/models/end_node.model';
import { ResponseModel } from 'src/models/response.model';
import { Action } from 'src/models/user_action_habits';
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
  // async getCoachings(userId: string): Promise<ResponseModel> {

  // }
  // async getActionAndHabits(userId: string): Promise<ResponseModel> {
  //   const coaching = await this.fireService
  //     .getQuery(FireCollection.coaching)
  //     .where('userId', '==', userId)
  //     .get();
  //   // TODO - change this functions such as only required end nodes are fetched;
  //   const allEndNodes: EndNodesModel[] = (await this.setupService.getEndNodes())
  //     .data as EndNodesModel[];
  //   const endNodes = [];
  //   const advisorPref: UserPreferenceModel[] = [];
  //   coaching.docs.forEach((item) => {
  //     endNodes.push(item.data().endNodeId);
  //     advisorPref.push(item.data().advisorPreference);
  //   });
  //   const advisorsList = [];
  //   for (let i = 0; i < advisorPref.length; i++) {
  //     const advPref: AdvisorPrefDto = {
  //       ageLower: advisorPref[i].minAge,
  //       ageUpper: advisorPref[i].maxAge,
  //       gender: advisorPref[i].gender,
  //       ethnicity: advisorPref[i].ethnicity,
  //       type: advisorPref[i].type,
  //     };
  //     const listAdvisors: Advisor[] = (await (
  //       await this.advisorService.getAdvisorsList(coaching)
  //     ).data) as Advisor[];
  //     const toAdd = false;

  //     advisorsList.push(
  //       listAdvisors.filter(
  //         (item) =>
  //           !MadeUtils.listContain(item.id, advisorPref[i].rejectedAdvisors) ||
  //           true,
  //       ),
  //     );
  //   }

  //   const actions = await this.fireService
  //     .getQuery(FireCollection.actions)
  //     .where('endNodeId', 'in', endNodes)
  //     .get();
  //   const habits = await this.fireService
  //     .getQuery(FireCollection.habits)
  //     .where('endNodeId', 'in', endNodes)
  //     .get();

  //   const userActionAndHabits: UserActionHabits[] = [];
  //   endNodes.forEach((item, index) => {
  //     const userActions: Action[] = [];
  //     const userHabits: Action[] = [];
  //     let endNodeTitle = '';
  //     let fistTitle = '';
  //     const advisors: Advisor[] = advisorsList[index];

  //     allEndNodes.forEach((node) => {
  //       if (node.id == item) {
  //         endNodeTitle = node.title;
  //       }
  //       try {
  //         fistTitle = node.predeLevels[0].title;
  //       } catch (err) {}
  //     });
  //     let advisorIndex = 0;
  //     actions.docs.forEach((doc) => {
  //       if (doc.data().endNodeId == item) {
  //         userActions.push(
  //           Object.assign(
  //             doc.data() as Action,
  //             { id: doc.id },
  //             {
  //               advisor: advisors[advisorIndex],
  //             },
  //           ),
  //         );
  //       }
  //       advisorIndex = (advisorIndex + 1) % advisors.length;
  //     });
  //     advisorIndex = 0;
  //     habits.docs.forEach((doc) => {
  //       if (doc.data().endNodeId == item) {
  //         userHabits.push(
  //           Object.assign(
  //             doc.data() as Action,
  //             { id: doc.id },
  //             {
  //               advisor: advisors[advisorIndex],
  //             },
  //           ),
  //         );
  //         advisorIndex = (advisorIndex + 1) % advisors.length;
  //       }
  //     });
  //     userActionAndHabits.push({
  //       endNodeId: item,
  //       actions: userActions,
  //       habits: userHabits,
  //       endNodeTitle: endNodeTitle,
  //       firstLevelTitle: fistTitle,
  //     });
  //   });
  //   return {
  //     count: undefined,
  //     message: 'Loaded',
  //     success: true,
  //     data: userActionAndHabits,
  //   };
  // }

  async getActionAndHabits(userId: string): Promise<ResponseModel> {
    const coaching: CoachingModel[] = (
      await this.fireService
        .getQuery(FireCollection.coaching)
        .where('userId', '==', userId)
        .get()
    ).docs.map((item) => {
      const obj: CoachingModel = {} as CoachingModel;
      Object.assign(obj, item.data(), { id: item.id });
      return obj;
    });
    if (coaching.length == 0) {
      throw new BadRequestException('Invalid userId');
    }
    const activeCoaching: CoachingModel = coaching.filter(
      (item) => item.isActive,
    )[0];
    if (
      activeCoaching.activePlan == null ||
      activeCoaching.activePlan == undefined
    ) {
      throw new BadRequestException('User is not on plan');
    }
    const subscriptions: SubscriptionDto[] = await (
      await this.fireService.getAll(FireCollection.subscription)
    ).docs.map((e) => {
      const obj: SubscriptionDto = {} as SubscriptionDto;
      Object.assign(obj, e.data(), { id: e.id });
      return obj;
    });
    subscriptions.sort((a, b) => a.percentageBaseValue - b.percentageBaseValue);
    const actions: Action[] = (
      await this.fireService
        .getQuery(FireCollection.actions)
        .where('personalizeId', '==', activeCoaching.userPersonalizeId)
        .where('endNodeId', '==', activeCoaching.endNodeId)
        .get()
    ).docs.map((e) => {
      const obj: Action = {} as Action;
      Object.assign(obj, e.data(), { id: e.id });
      return obj;
    });

    const habits: Action[] = (
      await this.fireService
        .getQuery(FireCollection.habits)
        .where('personalizeId', '==', activeCoaching.userPersonalizeId)
        .where('endNodeId', '==', activeCoaching.endNodeId)
        .get()
    ).docs.map((e) => {
      const obj: Action = {} as Action;
      Object.assign(obj, e.data(), { id: e.id });
      return obj;
    });
    const userSubId = activeCoaching.activePlan;
    const userActions: Action[] = [];
    for (let i = 0; i < actions.length; i++) {
      const action: Action = actions[i];

      if (
        this.isEqualOrBelowSub(action.subscriptionId, userSubId, subscriptions)
      ) {
        action.steps = action.steps.filter((item) =>
          this.isEqualOrBelowSub(item.subscriptionId, userSubId, subscriptions),
        );
        action.steps.forEach((item) => {
          item.questions = item.questions.filter((item) =>
            this.isEqualOrBelowSub(
              item.subscriptionId,
              userSubId,
              subscriptions,
            ),
          );
        });
        action.cpQuestions = action.cpQuestions.filter((item) =>
          MadeUtils.listContain(item.question, activeCoaching.cpQuestions),
        );
        userActions.push(action);
      }
    }
    const userHabits: Action[] = [];
    for (let i = 0; i < habits.length; i++) {
      const habit: Action = habits[i];
      if (
        this.isEqualOrBelowSub(habit.subscriptionId, userSubId, subscriptions)
      ) {
        habit.steps = habit.steps.filter((item) =>
          this.isEqualOrBelowSub(item.subscriptionId, userSubId, subscriptions),
        );
        habit.steps.forEach((item) => {
          item.questions = item.questions.filter((item) =>
            this.isEqualOrBelowSub(
              item.subscriptionId,
              userSubId,
              subscriptions,
            ),
          );
        });
        habit.cpQuestions = habit.cpQuestions.filter((item) =>
          MadeUtils.listContain(item.question, activeCoaching.cpQuestions),
        );
        userHabits.push(habit);
      }
    }
    let advisorsList: Advisor[] = (
      await this.advisorService.getAdvisorsList(
        activeCoaching.advisorPreference,
      )
    ).data as Advisor[];

    advisorsList = advisorsList.filter((item) => {
      return !MadeUtils.listContain(
        item.id,
        activeCoaching.advisorPreference.rejectedAdvisors,
      );
    });

    advisorsList.sort((a, b) => a.priority - b.priority);
    let advisorIndex = 0;
    userActions.forEach((item) => {
      item.advisor = advisorsList[advisorIndex];
      item.steps.forEach((step) => {
        step.advisor = advisorsList[advisorIndex];
        step.questions.forEach((ques) => {
          ques.advisor = advisorsList[advisorIndex];
        });
      });
      advisorIndex = (advisorIndex + 1) % advisorsList.length;
    });
    advisorIndex = 0;
    userHabits.forEach((item) => {
      item.advisor = advisorsList[advisorIndex];
      item.steps.forEach((step) => {
        step.advisor = advisorsList[advisorIndex];
        step.questions.forEach((ques) => {
          ques.advisor = advisorsList[advisorIndex];
        });
      });
      advisorIndex = (advisorIndex + 1) % advisorsList.length;
    });
    const allEndNodes: EndNodesModel[] = (await this.setupService.getEndNodes())
      .data as EndNodesModel[];
    let endNodeTitle = '';
    let fistLevelTitle = '';
    allEndNodes.forEach((item) => {
      if (item.id == activeCoaching.endNodeId) {
        endNodeTitle = item.title;
        fistLevelTitle = item.predeLevels[0].title;
      }
    });
    return {
      message: 'Loaded',
      count: undefined,
      success: true,
      data: {
        userActions,
        userHabits,
        endNodeTitle,
        fistLevelTitle,
      },
    };
  }

  private isEqualOrBelowSub(
    actionSubId: string,
    userSubId: string,
    subscriptions: SubscriptionDto[],
  ) {
    const isValid = false;
    let indexOfActionRef = 0;
    let indexOfUserSub;
    for (let i = 0; i < subscriptions.length; i++) {
      if (actionSubId == subscriptions[i].id) {
        indexOfActionRef = i;
      }
      if (userSubId == subscriptions[i].id) {
        indexOfUserSub = i;
      }
    }
    return indexOfUserSub >= indexOfActionRef;
  }
}
