import '@babel/polyfill';

import { createContextualLogger } from './helpers/logger';
import secretManager from './helpers/secretManager';
import stepFunctionHelper from './helpers/stepFunctionHelper';

import { v4 as uuid } from 'uuid';

module.exports.workflow = async (event, context) => { 
    const logger = createContextualLogger(context);

    logger.verbose({ action: 'log', domain: 'lambda', text: 'event', value: event });
    logger.verbose({ action: 'log', domain: 'lambda', text: 'context', value: context });

    // Get the Job Id
    const jobId = (event && event.pathParameters && event.pathParameters.jobId) ? event.pathParameters.jobId : null;
    logger.verbose({ action: 'log', domain: 'cron', text: 'jobId', value: jobId });
    if (!jobId) throw new Error('Missing Job Id'); 

    // Get Workflow Step Function ARN
    const stepFunctionArn = await secretManager.getValue(logger, 'STEP_FUNCTION_ARN');
    logger.verbose({ action: 'log', domain: 'cron', text: 'stepFunctionArn', value: stepFunctionArn });

    // Construct Request for Workflow
    const payload = {
        executionKey: uuid(),
        jobId,
    };
    logger.verbose({ action: 'log', domain: 'cron', text: 'payload', value: payload });

    // Construct request for Step Function
    const param = {
        name: payload.executionKey,
        stateMachineArn: stepFunctionArn,
        input: JSON.stringify(payload, null, 2),
    };
    logger.verbose({ action: 'log', domain: 'step-function', text: 'param', value: param });

    // Create Step Function
    const result = await stepFunctionHelper.execute(param);
    logger.verbose({ action: 'log', domain: 'step-function', text: 'result', value: result });

}