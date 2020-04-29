import '@babel/polyfill';
import { createContextualLogger } from './helpers/logger';

module.exports.extract = async (event, context) => { 
    const logger = createContextualLogger(context);

    logger.verbose({ action: 'log', domain: 'lambda', text: 'event', value: event });
    logger.verbose({ action: 'log', domain: 'lambda', text: 'context', value: context });

    /*
    const param = {
        name: payload.executionKey,
        stateMachineArn: stepFunctionArn, //`arn:aws:states:ap-southeast-2:${process.env.AWS_ACCOUNT_ID}:stateMachine:${process.env.STEP_FUNCTION_NAME}`,
        input: JSON.stringify(payload, null, 2)
    };
    */

}