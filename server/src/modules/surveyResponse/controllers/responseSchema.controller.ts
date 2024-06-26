import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ResponseSchemaService } from '../services/responseScheme.service';
import { HttpException } from 'src/exceptions/httpException';
import { EXCEPTION_CODE } from 'src/enums/exceptionCode';
import { RECORD_STATUS } from 'src/enums';
import { ApiTags } from '@nestjs/swagger';
import Joi from 'joi';
import { Logger } from 'src/logger';
import { SurveyNotFoundException } from 'src/exceptions/surveyNotFoundException';
import { WhitelistType } from 'src/interfaces/survey';
import { UserService } from 'src/modules/auth/services/user.service';
import { WorkspaceMemberService } from 'src/modules/workspace/services/workspaceMember.service';
import { WhitelistService } from 'src/modules/auth/services/whitelist.service';

@ApiTags('surveyResponse')
@Controller('/api/responseSchema')
export class ResponseSchemaController {
  constructor(
    private readonly responseSchemaService: ResponseSchemaService,
    private readonly logger: Logger,
    private readonly userService: UserService,
    private readonly workspaceMemberService: WorkspaceMemberService,
    private readonly whitelistService: WhitelistService,
  ) {}

  @Get('/getSchema')
  @HttpCode(200)
  async getSchema(
    @Query()
    queryInfo: {
      surveyPath: string;
    },
  ) {
    if (!queryInfo.surveyPath) {
      throw new HttpException('参数有误', EXCEPTION_CODE.PARAMETER_ERROR);
    }
    const responseSchema =
      await this.responseSchemaService.getResponseSchemaByPath(
        queryInfo.surveyPath,
      );
    if (
      !responseSchema ||
      responseSchema.curStatus.status === RECORD_STATUS.REMOVED
    ) {
      throw new HttpException(
        '问卷已删除',
        EXCEPTION_CODE.RESPONSE_SCHEMA_REMOVED,
      );
    }

    // 去掉C端的敏感字段
    if (responseSchema.code?.baseConf) {
      responseSchema.code.baseConf.password = null;
      responseSchema.code.baseConf.whitelist = [];
    }
    return {
      code: 200,
      data: responseSchema,
    };
  }

  // 白名单验证
  @Post('/:surveyPath/validate')
  @HttpCode(200)
  async whitelistValidate(@Param('surveyPath') surveyPath, @Body() body) {
    const { value, error } = Joi.object({
      password: Joi.string().allow(null, ''),
      value: Joi.string().allow(null, ''),
    }).validate(body, { allowUnknown: true });

    if (error) {
      this.logger.error(`whitelistValidate error: ${error.message}`, {});
      throw new HttpException('参数错误', EXCEPTION_CODE.PARAMETER_ERROR);
    }

    // 问卷信息
    const schema =
      await this.responseSchemaService.getResponseSchemaByPath(surveyPath);
    if (!schema || schema.curStatus.status === 'removed') {
      throw new SurveyNotFoundException('该问卷不存在,无法提交');
    }

    const { password, value: val } = value;
    const {
      passwordSwitch,
      password: settingPassword,
      whitelistType,
      whitelist,
    } = schema.code.baseConf;

    // 密码校验
    if (passwordSwitch) {
      if (settingPassword !== password) {
        throw new HttpException('验证失败', EXCEPTION_CODE.WHITELIST_ERROR);
      }
    }

    // 名单校验（手机号/邮箱）
    if (whitelistType === WhitelistType.CUSTOM) {
      if (!whitelist.includes(val)) {
        throw new HttpException('验证失败', EXCEPTION_CODE.WHITELIST_ERROR);
      }
    }

    // 团队成员昵称校验
    if (whitelistType === WhitelistType.MEMBER) {
      const user = await this.userService.getUserByUsername(val);
      if (!user) {
        throw new HttpException('验证失败', EXCEPTION_CODE.WHITELIST_ERROR);
      }

      const workspaceMember = await this.workspaceMemberService.findAllByUserId(
        { userId: user._id.toString() },
      );
      if (!workspaceMember.length) {
        throw new HttpException('验证失败', EXCEPTION_CODE.WHITELIST_ERROR);
      }
    }

    // 返回verifyId
    const res = await this.whitelistService.create(surveyPath);
    return {
      code: 200,
      data: {
        verifyId: res._id.toString(),
      },
    };
  }
}
