import { Test, TestingModule } from '@nestjs/testing';
import { SurveyMetaController } from '../controllers/surveyMeta.controller';
import { SurveyMetaService } from '../services/surveyMeta.service';
import { LoggerProvider } from 'src/logger/logger.provider';
import { HttpException } from 'src/exceptions/httpException';
import { EXCEPTION_CODE } from 'src/enums/exceptionCode';
import { CollaboratorService } from '../services/collaborator.service';
import { ObjectId } from 'mongodb';

jest.mock('src/guards/authentication.guard');
jest.mock('src/guards/survey.guard');
jest.mock('src/guards/workspace.guard');

describe('SurveyMetaController', () => {
  let controller: SurveyMetaController;
  let surveyMetaService: SurveyMetaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SurveyMetaController],
      providers: [
        {
          provide: SurveyMetaService,
          useValue: {
            editSurveyMeta: jest.fn().mockResolvedValue(undefined),
            getSurveyMetaList: jest
              .fn()
              .mockResolvedValue({ count: 0, data: [] }),
          },
        },
        LoggerProvider,
        {
          provide: CollaboratorService,
          useValue: {
            getCollaboratorListByUserId: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get<SurveyMetaController>(SurveyMetaController);
    surveyMetaService = module.get<SurveyMetaService>(SurveyMetaService);
  });

  it('should update survey meta', async () => {
    const reqBody = {
      remark: 'Test remark',
      title: 'Test title',
      surveyId: 'test-survey-id',
    };

    const survey = {
      title: '',
      remark: '',
    };

    const req = {
      user: {
        username: 'test-user',
      },
      surveyMeta: survey,
    };

    const result = await controller.updateMeta(reqBody, req);

    expect(surveyMetaService.editSurveyMeta).toHaveBeenCalledWith({
      title: reqBody.title,
      remark: reqBody.remark,
    });

    expect(result).toEqual({ code: 200 });
  });

  it('should validate request body with Joi', async () => {
    const reqBody = {};
    const req = {
      user: {
        username: 'test-user',
      },
    };

    try {
      await controller.updateMeta(reqBody, req);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.code).toBe(EXCEPTION_CODE.PARAMETER_ERROR);
    }

    expect(surveyMetaService.editSurveyMeta).not.toHaveBeenCalled();
  });

  it('should get survey meta list', async () => {
    const queryInfo = {
      curPage: 1,
      pageSize: 10,
    };
    const userId = new ObjectId().toString();
    const req = {
      user: {
        username: 'test-user',
        _id: new ObjectId(userId),
      },
    };

    jest
      .spyOn(surveyMetaService, 'getSurveyMetaList')
      .mockImplementation(() => {
        const date = new Date().getTime();
        return Promise.resolve({
          count: 10,
          data: [
            {
              _id: new ObjectId(),
              createDate: date,
              updateDate: date,
              curStatus: {
                date: date,
              },
              subStatus: {
                date: date,
              },
            },
          ],
        });
      });

    const result = await controller.getList(queryInfo, req);

    expect(result).toEqual({
      code: 200,
      data: {
        count: 10,
        data: expect.arrayContaining([
          expect.objectContaining({
            createDate: expect.stringMatching(
              /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
            ),
            curStatus: expect.objectContaining({
              date: expect.stringMatching(
                /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
              ),
            }),
            subStatus: expect.objectContaining({
              date: expect.stringMatching(
                /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
              ),
            }),
          }),
        ]),
      },
    });
    expect(surveyMetaService.getSurveyMetaList).toHaveBeenCalledWith({
      pageNum: queryInfo.curPage,
      pageSize: queryInfo.pageSize,
      username: req.user.username,
      filter: {},
      order: {},
      surveyIdList: [],
      userId,
      workspaceId: undefined,
    });
  });

  it('should get survey meta list with filter and order', async () => {
    const queryInfo = {
      curPage: 1,
      pageSize: 10,
      filter: JSON.stringify([
        {
          comparator: '',
          condition: [{ field: 'title', value: 'hahah', comparator: '$regex' }],
        },
        {
          comparator: '',
          condition: [{ field: 'surveyType', value: 'normal' }],
        },
      ]),
      order: JSON.stringify([{ field: 'createDate', value: -1 }]),
    };
    const userId = new ObjectId().toString();
    const req = {
      user: {
        username: 'test-user',
        _id: new ObjectId(userId),
      },
    };

    const result = await controller.getList(queryInfo, req);

    expect(result.code).toEqual(200);
    expect(surveyMetaService.getSurveyMetaList).toHaveBeenCalledWith({
      pageNum: queryInfo.curPage,
      pageSize: queryInfo.pageSize,
      username: req.user.username,
      surveyIdList: [],
      userId,
      filter: { surveyType: 'normal', title: { $regex: 'hahah' } },
      order: { createDate: -1 },
      workspaceId: undefined,
    });
  });
});
