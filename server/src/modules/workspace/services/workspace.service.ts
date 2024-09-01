import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';

import { Workspace } from 'src/models/workspace.entity';
import { SurveyMeta } from 'src/models/surveyMeta.entity';

import { ObjectId } from 'mongodb';
import { RECORD_SUB_STATUS } from 'src/enums';

interface FindAllByIdWithPaginationParams {
  workspaceIdList: string[];
  page: number;
  limit: number;
  name?: string;
}
interface FindAllByIdWithPaginationResult {
  list: Workspace[];
  count: number;
}

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(Workspace)
    private workspaceRepository: MongoRepository<Workspace>,
    @InjectRepository(SurveyMeta)
    private surveyMetaRepository: MongoRepository<SurveyMeta>,
  ) {}

  async create(workspace: {
    name: string;
    description: string;
    ownerId: string;
  }): Promise<Workspace> {
    const newWorkspace = this.workspaceRepository.create({
      ...workspace,
    });
    return this.workspaceRepository.save(newWorkspace);
  }

  async findOneById(id) {
    return this.workspaceRepository.findOne({
      where: {
        _id: new ObjectId(id),
      },
    });
  }

  async findAllById({
    workspaceIdList,
  }: {
    workspaceIdList: string[];
  }): Promise<Workspace[]> {
    const query = {
      _id: {
        $in: workspaceIdList.map((item) => new ObjectId(item)),
      },
      'curStatus.status': {
        $ne: RECORD_SUB_STATUS.REMOVED,
      }, //添加字状态后兼容之前的数据
      'subCurStatus.status': {
        $ne: RECORD_SUB_STATUS.REMOVED,
      },
    };

    return this.workspaceRepository.find({
      where: query,
      order: {
        _id: -1,
      },
      select: [
        '_id',
        'curStatus',
        'name',
        'description',
        'ownerId',
        'createDate',
      ],
    });
  }

  async findAllByIdWithPagination({
    workspaceIdList,
    page,
    limit,
    name,
  }: FindAllByIdWithPaginationParams): Promise<FindAllByIdWithPaginationResult> {
    const skip = (page - 1) * limit;
    if (!Array.isArray(workspaceIdList) || workspaceIdList.length === 0) {
      return { list: [], count: 0 };
    }
    const query = {
      _id: {
        $in: workspaceIdList.map((m) => new ObjectId(m)),
      },
      'curStatus.status': {
        $ne: RECORD_SUB_STATUS.REMOVED,
      }, //添加字状态后兼容之前的数据
      'subCurStatus.status': {
        $ne: RECORD_SUB_STATUS.REMOVED,
      },
    };
    if (name) {
      query['name'] = { $regex: name, $options: 'i' };
    }
    const [data, count] = await this.workspaceRepository.findAndCount({
      where: query,
      skip,
      take: limit,
      order: {
        createDate: -1,
      },
    });
    return { list: data, count };
  }

  update(id: string, workspace: Partial<Workspace>) {
    return this.workspaceRepository.update(id, workspace);
  }

  async delete(id: string) {
    const newSubStatus = {
      status: RECORD_SUB_STATUS.REMOVED,
      date: Date.now(),
    };
    const workspaceRes = await this.workspaceRepository.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          subCurStatus: newSubStatus,
        },
        $push: {
          statusList: newSubStatus as never,
        },
      },
    );
    const surveyRes = await this.surveyMetaRepository.updateMany(
      {
        workspaceId: id,
      },
      {
        $set: {
          curStatus: newSubStatus,
        },
        $push: {
          statusList: newSubStatus as never,
        },
      },
    );
    return {
      workspaceRes,
      surveyRes,
    };
  }

  // 用户下的所有空间
  async findAllByUserId(userId: string) {
    return await this.workspaceRepository.find({
      where: {
        ownerId: userId,
        'curStatus.status': {
          $ne: RECORD_SUB_STATUS.REMOVED,
        }, //添加字状态后兼容之前的数据
        'subCurStatus.status': {
          $ne: RECORD_SUB_STATUS.REMOVED,
        },
      },
      order: {
        _id: -1,
      },
      select: [
        '_id',
        'curStatus',
        'name',
        'description',
        'ownerId',
        'createDate',
      ],
    });
  }
}
