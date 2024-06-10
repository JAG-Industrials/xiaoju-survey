package com.xiaojusurvey.engine.extensions.security.impl;

import com.xiaojusurvey.engine.extensions.processor.Invocation;
import com.xiaojusurvey.engine.extensions.processor.Result;
import com.xiaojusurvey.engine.extensions.security.SecurityProcessor;
import org.springframework.stereotype.Component;

@Component
public class TestSecurityProcessor implements SecurityProcessor {

    private static final int ORDER = 100;

    @Override
    public void before(Invocation invocation) {

    }

    @Override
    public Result after(Result result) {
        return new Result();
    }

    @Override
    public int getOrder() {
        return ORDER;
    }
}
