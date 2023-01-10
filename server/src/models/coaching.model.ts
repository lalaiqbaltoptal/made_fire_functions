export class UserPreferenceModel {
  rejectedAdvisors: string[];

  maxAge: number;
  minAge: number;
  ethnicity: string;
  type: string;
  gender: string;
}
export class CoachingModel {
  id: string;
  userId: string;
  endNodeId: string;
  activePlan: string;
  userPersonalizeId: string;
  cpQuestions: string[];
  isActive: boolean;
  advisorPreference: UserPreferenceModel;
}
