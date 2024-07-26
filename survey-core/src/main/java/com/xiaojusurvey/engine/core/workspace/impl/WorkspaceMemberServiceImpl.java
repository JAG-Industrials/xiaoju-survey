package com.xiaojusurvey.engine.core.workspace.impl;

import com.xiaojusurvey.engine.common.entity.workspace.WorkspaceMember;
import com.xiaojusurvey.engine.core.workspace.WorkspaceMemberService;
import com.xiaojusurvey.engine.repository.MongoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @description: 空间成员
 * @author: wangchenglong
 * @time: 2024/7/24 14:23
 */
@Service
public class WorkspaceMemberServiceImpl implements WorkspaceMemberService {

    @Autowired
    private MongoRepository mongoRepository;

    @Override
    public List<WorkspaceMember> getWorkspaceMembers(String workspaceId, List<String> userId) {
        return mongoRepository.findList(new Query().addCriteria(Criteria.where("workspaceId").is(workspaceId))
                .addCriteria(Criteria.where("userId").in(userId)), WorkspaceMember.class);
    }

    public WorkspaceMember getWorkspaceMember(String workspaceId, String userId) {
        return mongoRepository.findOne(new Query().addCriteria(Criteria.where("workspaceId").is(workspaceId))
                .addCriteria(Criteria.where("userId").is(userId)), WorkspaceMember.class);
    }

    /**
     *  查询当前用户参与的空间
     * @param userId
     * @return
     */
    @Override
    public List<WorkspaceMember> getWorkspaceMembers(String userId, Integer pageSize, Integer curPage) {
        List<WorkspaceMember> workspaceMembers = mongoRepository.page(new Query().addCriteria(Criteria.where("userId").is(userId))
                        .with(Sort.by(Sort.Direction.DESC, "createDate")),
                curPage, pageSize, WorkspaceMember.class);
        return workspaceMembers;
    }

    @Override
    public List<WorkspaceMember> getWorkspaceMembers(String workspaceId) {
        return mongoRepository.findList(new Query().addCriteria(Criteria.where("workspaceId").is(workspaceId)), WorkspaceMember.class);
    }
}
