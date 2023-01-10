import { Injectable } from '@nestjs/common';
import { FireCollection } from 'src/constants/fireCollection';
import { AdvisorPrefDto } from 'src/dtos/advisor_pref_body';
import { AdvisorCategory } from 'src/models/advisor-category.model';
import { Advisor } from 'src/models/advisors.model';
import { AdvisorsOptionModel } from 'src/models/advisors_options';
import { UserPreferenceModel } from 'src/models/coaching.model';
import { ResponseModel } from 'src/models/response.model';
import { FireAdminService } from 'src/services/fire-admin.service';

@Injectable()
export class AdvisorsService {
  constructor(private fireService: FireAdminService) {}

  async getAdvisorsOptions(): Promise<ResponseModel> {
    const advisorCategory: AdvisorCategory[] = await (
      await this.fireService.getAll(FireCollection.advisor_category)
    ).docs.map((item) =>
      Object.assign({ id: item.id }, item.data() as AdvisorCategory),
    );

    const advisorsOptions: AdvisorsOptionModel = new AdvisorsOptionModel();
    advisorsOptions.age = [];
    advisorsOptions.ethnicity = [];
    advisorsOptions.gender = [];
    advisorsOptions.type = [];

    let minAge = 9999;
    let maxAge = -9999;

    advisorCategory.forEach((item) => {
      if (parseInt(item.ageLower.toString()) < minAge) {
        minAge = parseInt(item.ageLower.toString());
      }
      if (parseInt(item.ageUpper.toString()) > maxAge) {
        maxAge = parseInt(item.ageUpper.toString());
      }
      if (
        advisorsOptions.ethnicity.filter((eth) => eth == item.ethnicity)
          .length == 0
      ) {
        advisorsOptions.ethnicity.push(item.ethnicity);
      }
      if (
        advisorsOptions.gender.filter((gender) => gender == item.gender)
          .length == 0
      ) {
        advisorsOptions.gender.push(item.gender);
      }
      if (
        advisorsOptions.type.filter((type) => type == item.type).length == 0
      ) {
        advisorsOptions.type.push(item.type);
      }
    });

    for (let i = minAge; i < maxAge; i = i + 10) {
      advisorsOptions.age.push({
        lower: i,
        upper: i + 10,
      });
    }
    return {
      count: undefined,
      message: 'Loaded successfully',
      success: true,
      data: advisorsOptions,
    };
  }
  isThisFromPref(
    userPref: UserPreferenceModel,
    advisorCategory: AdvisorCategory,
  ): boolean {
    let isThis = true;
    if (userPref.gender != null) {
      if (userPref.gender != advisorCategory.gender) {
        isThis = false;
      }
    }
    if (userPref.ethnicity != null) {
      if (userPref.ethnicity != advisorCategory.ethnicity) {
        isThis = false;
      }
    }
    if (userPref.type != null) {
      if (userPref.type != advisorCategory.type) {
        isThis = false;
      }
    }
    if (userPref.maxAge != null) {
      if (userPref.maxAge != advisorCategory.ageUpper) {
        isThis = false;
      }
    }

    if (userPref.minAge != null) {
      if (userPref.minAge != advisorCategory.ageLower) {
        isThis = false;
      }
    }

    return isThis;
  }
  async getAdvisorsList(pref: UserPreferenceModel): Promise<ResponseModel> {
    const advisorCategory: AdvisorCategory[] = await (
      await this.fireService.getAll(FireCollection.advisor_category)
    ).docs.map((item) =>
      Object.assign({ id: item.id }, item.data() as AdvisorCategory),
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const ids: string[] = advisorCategory
      .filter((item) => this.isThisFromPref(pref, item))
      .map((e) => e.id);

    const advisors: Advisor[] = await (
      await this.fireService
        .getQuery(FireCollection.advisors)
        .where('categoryId', 'in', ids)

        .get()
    ).docs.map((item) =>
      Object.assign({ id: item.id }, item.data() as Advisor),
    );

    return {
      count: undefined,
      message: 'Loaded successfully',
      success: true,
      data: advisors,
    };
  }
}
