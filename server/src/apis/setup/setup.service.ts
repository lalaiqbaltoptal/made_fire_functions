import { BadRequestException, Injectable } from '@nestjs/common';
import { FireCollection } from 'src/constants/fireCollection';
import { LevelType } from 'src/constants/level.types';
import { EndNodesModel } from 'src/models/end_node.model';
import { LevelModel } from 'src/models/level.model';
import { PredecessorLevelModel } from 'src/models/predecessor_level.model';
import { ResponseModel } from 'src/models/response.model';
import { SetupModel } from 'src/models/setup.model';
import { FireAdminService } from 'src/services/fire-admin.service';
import { MadeUtils } from 'src/utils/MadeUtils';

@Injectable()
export class SetupService {
  constructor(private fireService: FireAdminService) {}
  private seqPredecessors(
    setupHashMap,
    predecessorList: PredecessorLevelModel[],
    predecessorId: string,
    levelNo: number,
  ): PredecessorLevelModel[] {
    const predecessor: SetupModel = setupHashMap[predecessorId];
    predecessorList.push({
      id: predecessor.id,
      levelName: predecessor.levelName,
      levelNo: levelNo,
      title: predecessor.title,
      type: predecessor.type,
    });

    if (levelNo == 0) {
      return predecessorList;
    }
    return this.seqPredecessors(
      setupHashMap,
      predecessorList,
      predecessor.predecessorId,
      --levelNo,
    );
  }
  async getEndNodes(): Promise<ResponseModel> {
    const levels: LevelModel[] = await (
      await this.fireService.getAll(FireCollection.level)
    ).docs.map((item) =>
      Object.assign({ id: item.id }, item.data() as LevelModel),
    );
    const setups: SetupModel[] = await (
      await this.fireService.getAll(FireCollection.setup)
    ).docs.map((item) =>
      Object.assign(
        { id: item.id },
        item.data() as SetupModel,
        { creationDate: item.createTime.toMillis() },
        { updateDate: item.updateTime.toMillis() },
      ),
    );
    const hashMap = {};
    const endNodes: EndNodesModel[] = [];

    const maxLevel = levels.length - 1;
    setups.forEach((item) => {
      hashMap[item.id] = item;
      if (item.type == LevelType.END_NODE) {
        endNodes.push(Object.assign(item));
      }
    });
    endNodes.forEach((item) => {
      item.predeLevels = [];
      item.predeLevels = this.seqPredecessors(
        hashMap,
        [],
        item.predecessorId,
        maxLevel - 1,
      ).reverse();
    });
    return {
      message: 'End node loaded successfully',
      success: true,
      data: endNodes,
      count: endNodes.length,
    };
  }
  async predecessorList(id: string): Promise<ResponseModel> {
    let levels: LevelModel[] = await (
      await this.fireService.getAll(FireCollection.level)
    ).docs.map((item) =>
      Object.assign({ id: item.id }, item.data() as LevelModel),
    );
    const hashMap = {};
    let lastChild: SetupModel;
    const setups: SetupModel[] = await (
      await this.fireService.getAll(FireCollection.setup)
    ).docs.map((item) => {
      const obj = Object.assign({ id: item.id }, item.data() as SetupModel);
      obj.nextNodes = [];
      hashMap[item.id] = obj;
      if (item.id == id) {
        lastChild = obj;
      }
      return obj;
    });
    if (!lastChild) {
      throw new BadRequestException('Invalid id');
    }
    let level = 0;
    levels = this.sortLevels(levels);
    levels.forEach((item, index) => {
      if (lastChild.levelName == item.title) {
        level = index;
      }
    });
    let sequentialList = [
      {
        id: lastChild.id,
        levelName: lastChild.levelName,
        levelNo: level,
        title: lastChild.title,
        type: lastChild.type,
      },
    ];
    if (level > 0) {
      sequentialList = this.seqPredecessors(
        hashMap,
        [
          {
            id: lastChild.id,
            levelName: lastChild.levelName,
            levelNo: level,
            title: lastChild.title,
            type: lastChild.type,
          },
        ],
        lastChild.predecessorId,
        level - 1,
      );
    }

    return {
      count: sequentialList.length,
      message: 'Loaded',
      success: true,
      data: {
        snake: sequentialList.reverse(),
        tagline:
          lastChild.nextTagLine == undefined || lastChild.nextNodes == null
            ? 'NA'
            : lastChild.nextTagLine,
      },
    };
  }
  async deepCopy(id: string): Promise<ResponseModel> {
    const levels: LevelModel[] = await (
      await this.fireService.getAll(FireCollection.level)
    ).docs.map((item) =>
      Object.assign({ id: item.id }, item.data() as LevelModel),
    );
    const hashMap = {};
    const predecessorHashMap = {};
    let payrentSetup: SetupModel;
    const setups: SetupModel[] = await (
      await this.fireService.getAll(FireCollection.setup)
    ).docs.map((item) => {
      const obj = Object.assign({ id: item.id }, item.data() as SetupModel);
      obj.nextNodes = [];
      hashMap[item.id] = obj;
      if (id == item.id) {
        payrentSetup = obj;
      }
      if (predecessorHashMap[obj.predecessorId] == undefined) {
        predecessorHashMap[obj.predecessorId] = [];
      }
      predecessorHashMap[obj.predecessorId].push(obj);
      return obj;
    });
    if (!payrentSetup) {
      throw new BadRequestException('Invalid id');
    }

    const mapedPayrent: SetupModel = this.mapChildren(
      Object.assign(predecessorHashMap),
      payrentSetup,
    );

    await this.saveCopy(mapedPayrent);
    return {
      count: undefined,
      message: 'Deep copy id done',
      success: true,
      data: mapedPayrent,
    };
  }
  async deepDeleteSetup(id: string) {
    const levels: LevelModel[] = await (
      await this.fireService.getAll(FireCollection.level)
    ).docs.map((item) =>
      Object.assign({ id: item.id }, item.data() as LevelModel),
    );
    const hashMap = {};
    const predecessorHashMap = {};
    let payrentSetup: SetupModel;
    const setups: SetupModel[] = await (
      await this.fireService.getAll(FireCollection.setup)
    ).docs.map((item) => {
      const obj = Object.assign({ id: item.id }, item.data() as SetupModel);
      obj.nextNodes = [];
      hashMap[item.id] = obj;
      if (id == item.id) {
        payrentSetup = obj;
      }
      if (predecessorHashMap[obj.predecessorId] == undefined) {
        predecessorHashMap[obj.predecessorId] = [];
      }
      predecessorHashMap[obj.predecessorId].push(obj);
      return obj;
    });
    if (!payrentSetup) {
      throw new BadRequestException('Invalid id');
    }
    const mapedPayrent: SetupModel = this.mapChildren(
      Object.assign(predecessorHashMap),
      payrentSetup,
    );
    await this.deleteHelper(mapedPayrent);
    return {
      count: undefined,
      message: 'Deep copy id done',
      success: true,
      data: undefined,
    };
  }
  private async deleteHelper(setupModel: SetupModel) {
    const setupToDelete: SetupModel = Object.assign(setupModel);

    await this.fireService.delete(FireCollection.setup, setupToDelete.id);

    for (let i = 0; i < setupToDelete.nextNodes.length; i++) {
      const node: SetupModel = setupToDelete.nextNodes[i];
      node.predecessorId = setupToDelete.id;
      await this.deleteHelper(node);
    }
  }
  private async saveCopy(setupModel: SetupModel) {
    const copyToSave: SetupModel = Object.assign(setupModel);
    copyToSave.id = MadeUtils.id;

    copyToSave.title = copyToSave.title + ' - copy';
    await this.fireService.postData(
      FireCollection.setup,
      copyToSave,
      copyToSave.id,
    );

    if (setupModel.nextNodes == undefined) {
      setupModel.nextNodes = [];
    }
    for (let i = 0; i < setupModel.nextNodes.length; i++) {
      const node: SetupModel = setupModel.nextNodes[i];
      node.predecessorId = copyToSave.id;
      await this.saveCopy(node);
    }
  }
  private mapChildren(
    predecessorHashMap,
    payrentSetup: SetupModel,
  ): SetupModel {
    payrentSetup.nextNodes = predecessorHashMap[payrentSetup.id];
    if (payrentSetup.nextNodes == undefined) {
      payrentSetup.nextNodes = [];
    }
    if (payrentSetup.nextNodes.length > 0) {
      payrentSetup.nextNodes.forEach((item) => {
        this.mapChildren(predecessorHashMap, item);
      });
    }
    return Object.assign({}, payrentSetup);
  }
  sortLevels(levels: LevelModel[]): LevelModel[] {
    levels.sort((a, b) => a.orderNo - b.orderNo);
    return levels;
  }
}
