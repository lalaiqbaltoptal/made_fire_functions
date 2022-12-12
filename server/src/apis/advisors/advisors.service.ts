import { Injectable } from '@nestjs/common';
import { FireCollection } from 'src/constants/fireCollection';
import { AdvisorPrefDto } from 'src/dtos/advisor_pref_body';
import { AdvisorCategory } from 'src/models/advisor-category.model';
import { Advisor } from 'src/models/advisors.model';
import { AdvisorsOptionModel } from 'src/models/advisors_options';
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

  async getAdvisorsList(pref: AdvisorPrefDto): Promise<ResponseModel> {
    // const advisorCategory: AdvisorCategory[] = await (
    //   await this.fireService
    //     .getQuery(FireCollection.advisor_category)
    //     .where('gender', '==', pref.gender)
    //     .where('ethnicity', '==', pref.ethnicity)
    //     .where('type', '==', pref.type)
    //     .get()
    // ).docs
    //   .map((item) =>
    //     Object.assign({ id: item.id }, item.data() as AdvisorCategory),
    //   )
    //   .filter(
    //     (item) =>
    //       item.ageLower >= pref.ageLower && item.ageUpper <= pref.ageUpper,
    //   );

    const advisors: Advisor[] = await (
      await this.fireService
        .getQuery(FireCollection.advisors)

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
