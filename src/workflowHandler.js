import '@babel/polyfill';

import { createContextualLogger } from './helpers/logger';
import dataService from './mocks/dataService';
import stateManager from './helpers/stateManager';

let executionCounter = 0;

// WORKFLOW: Step #1: ExecuteQuery
module.exports.extract = async (event, context) => { 
    
    const logger = createContextualLogger(context);

    logger.verbose({ action: 'log', domain: 'lambda', text: 'event', value: event });
    logger.verbose({ action: 'log', domain: 'lambda', text: 'context', value: context });
    logger.verbose({ action: 'log', domain: 'lambda', text: 'executionCounter', value: executionCounter++ });

    // Check for parameters
    if (!event || !event.executionKey) throw new Error('Missing Execution Key');
    if (!event || !event.jobId) throw new Error('Missing Job Id');

    // Get Polices for specified Job (mocked)
    const result = await dataService.executeJob(new Date(), event.jobId);
    logger.verbose({ action: 'log', domain: 'get-policies', text: 'result', value: result });

    // Check for success
    if (!result || !result.success) throw new Error('Could not execute job query.');

    // Persist the data to S3 -- too large to pass around as Lambda results.
    await stateManager.persistPayloadToDataStore(logger, {
        executionKey: event.executionKey,
        query: result.query,
        data: result.data,
    });

    return null;

};
 /*
module.exports.processorHandler = async (event, context) => heartbeatHelper.wrapper(event, context, null, async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false; 
    
    const logger = createContextualLogger(context);

    logger.verbose({ action: 'log', domain: 'lambda', text: 'event', value: event });
    logger.verbose({ action: 'log', domain: 'lambda', text: 'context', value: context });
    logger.verbose({ action: 'log', domain: 'lambda', text: 'executionCounter', value: executionCounter++ });
    logger.verbose({ action: 'log', domain: 'data', text: 'initialised', value: (!!data) });

    const action = event.action || 'iterate';

    let response = null;
    switch (action) {
        case 'iterate':
            response = await iterateHandler(logger, event, context);
            break;
        case 'transform':
            response = await transformHandler(logger, event, context);
            break;
        default:
            throw new Error(`Action not implemented (action: ${action})`);
    }

    return response;
});

const iterateHandler = async (logger, event, context) => {
    logger.verbose({ action: 'log', domain: 'handler', text: 'name', value: 'iterateHandler' });

    // Initialise the data layer
    data = await dataService.initialise(data);

    // Get data from S3
    const raw = await s3Manager.getObject(logger, event.bucket, event.key);
    logger.debug({ action: 'log', domain: 's3', text: 'raw', value: raw });

    const body = raw.Body.toString();
    
    const payload = JSON.parse(body);
    logger.debug({ action: 'log', domain: 'queue', text: 'payload', value: payload });
    
    // --------------------------------------------------------------------
    logger.debug({ action: 'log', domain: 's3', text: 'body', value: body });

    const index = event.index || 0;
    const len = event.length || payload.length;

    logger.verbose({ action: 'log', domain: 'queue', text: 'index', value: index });
    logger.verbose({ action: 'log', domain: 'queue', text: 'length', value: len });

    // If all documents have been processed, then end.
    if (index >= len) {
        return Object.assign({}, event, { end: true });
    }

    // --------------------------------------------------------------------

    // Queue document
    const msg = isString(payload[index]) ? payload[index] : JSON.stringify(payload[index], null, 2);
    logger.verbose({ action: 'log', domain: 'queue', text: 'msg', value: msg });

    // Directly process message
    const queueMsg = {
        integrationKey: event.integrationKey,
        parentNotificationKey: event.notificationKey,
        body: msg,
        notifierParams: event.notifierParams || {},
    };
    logger.verbose({ action: 'log', domain: 'queue', text: 'queueMsg', value: queueMsg });

    const result = await integrationService.queue(logger, queueMsg);
    logger.verbose({ action: 'log', domain: 'queue', text: 'result', value: result });

    // --------------------------------------------------------------------

    return Object.assign({}, event, { 
        end: false,
        index: index + 1,
        length: len,
        wait: event.wait || 20,
    });

};

const transformHandler = async (logger, event, context) => {
    logger.verbose({ action: 'log', domain: 'handler', text: 'name', value: 'transformHandler' });

    let state, notification, execution, payload; 

    // Initialise the data layer
    data = await dataService.initialise(data);
        
    // Initialise from context.
    const opt = {
        notificationStatus: NotificationStatus.TRANSFORM,
        notificationMessage: 'Executing notifier data transformation.',
        executionStatus: NotificationExecutionStatus.TRANSFORM_EXECUTING,
        executionMessage: 'Executing notifier data transformation.',
    };

    try { ({ state, notification, execution, payload } = await stateManager.initialise(event, context, opt)); }
    catch (e) { throw e; }
    logger.verbose({ action: 'log', domain: 'handler', text: 'initialise', value: { state, notification, execution, payload } });

    // -------------------------

    // Get the integration from the data store.
    let record;
    try {
        record = await dataService.objects.Integration.getByKey(payload.integrationKey);

        if (!record) {
            const errorMsg = 'Invalid Integration Key';
            await stateManager.generateStateResponseException(logger, state, notification, execution, payload, { action: 'validation', e: exceptionHelper.asObject(e), friendlyMessage: errorMsg, notificationStatus: NotificationStatus.INVALID, executionStatus: NotificationExecutionStatus.INVALID });
            throw new Error(errorMsg);
        }
    }
    catch (e) {
        const errorMsg = 'Unable to get Integration data';
        await stateManager.generateStateResponseException(logger, state, notification, execution, payload, { e: exceptionHelper.asObject(e), friendlyMessage: errorMsg, notificationMessage: NotificationStatus.ExecutionExceptionMessage });
        throw new Error(errorMsg);
    }

    logger.verbose({ action: 'log', domain: 'data', text: 'record', value: record });

    // -------------------------

    // Get the dependant lambda ARN and the platform's context.
    const arn = get(record, 'recipe.arn');
    const recipeContext = get(record, 'context');

    logger.verbose({ action: 'log', domain: 'data', text: 'arn', value: arn });
    logger.verbose({ action: 'log', domain: 'data', text: 'recipeContext', value: recipeContext });

    if (!arn || !recipeContext) {
        const errorMsg = 'Incorrectly configured Integration';
        await stateManager.generateStateResponseException(logger, state, notification, execution, payload, { e: exceptionHelper.asObject(e), friendlyMessage: errorMsg, notificationMessage: NotificationStatus.ExecutionExceptionMessage });
        throw new Error(errorMsg);
    }

    // -------------------------

    // Create header / context for notification processor.
    let contextMsg;
    try { 
        contextMsg = Object.assign({}, { action: 'transform' }, JSON.parse(recipeContext), payload.notifierParams || {}); 

        // Enables an admin to skip stages using the Step console -- can inject into the step payload.
        if (event.stage) contextMsg.stage = event.stage;
    }
    catch (e) { 
        const errorMsg = 'Unable to create context.';
        await stateManager.generateStateResponseException(logger, state, notification, execution, payload, { e: exceptionHelper.asObject(e), friendlyMessage: errorMsg, notificationMessage: NotificationStatus.ExecutionExceptionMessage });
        throw new Error(errorMsg);
    }

    // Create message for notification processor.
    const notificationMsg = { context: contextMsg, request: payload };
    logger.verbose({ action: 'log', domain: 'data', text: 'notificationMsg', value: notificationMsg });

    // -------------------------

    // Execute notification processor.
    let notifierResult;
    try { 
        notifierResult = await lambdaManager.invoke(arn, notificationMsg); 
    }
    catch (e) { 
        const errorMsg = 'Unable to execute notification handler.';
        await stateManager.generateStateResponseException(logger, state, notification, execution, payload, { e: exceptionHelper.asObject(e), friendlyMessage: errorMsg, notificationMessage: NotificationStatus.ExecutionExceptionMessage }); 
        throw new Error(errorMsg);
    }

    logger.verbose({ action: 'log', domain: 'data', text: 'notifierResult', value: notifierResult });

    // Evaluate the notification response for errors
    if (notifierResult.StatusCode !== 200 || notifierResult.FunctionError) {
        const errorMsg = 'Could not execute notification handler successfully.';
        await stateManager.generateStateResponseException(logger, state, notification, execution, payload, { e: get(notifierResult, 'FunctionError'), friendlyMessage: errorMsg, notificationMessage: NotificationStatus.ExecutionExceptionMessage });
        throw new Error(errorMsg);
    }

    // -------------------------

    let notifierBody;
    try { notifierBody = JSON.parse(notifierResult.Payload); }
    catch (e) { 
        const errorMsg = 'Could not execute notification handler successfully.';
        await stateManager.generateStateResponseException(logger, state, notification, execution, payload, { e: exceptionHelper.asObject(e), friendlyMessage: errorMsg, notificationMessage: NotificationStatus.ExecutionExceptionMessage }); 
        throw new Error(errorMsg);
    }

    logger.verbose({ action: 'log', domain: 'data', text: 'notifierBody', value: notifierBody });

    if (!notifierBody || !notifierBody.success) {
        const errorMsg = 'Notifier responded with failure.';
        await stateManager.generateStateResponseException(logger, state, notification, execution, payload, { action: 'exception-notifier', friendlyMessage: errorMsg, notificationMessage: NotificationStatus.ExecutionExceptionMessage });
        throw new Error(errorMsg);
    }

    // -------------------------

    if (notifierBody.success && notifierBody.end) {
        logger.debug({ action: 'log', domain: 'transform', text: 'queue', value: true });

        let friendlyMessage = 'No notifications generated';
        if (notifierBody.bucketName || notifierBody.key || notifierBody.body) {

            const queueMsg = {
                action: 'iterate',
                notificationKey: event.notificationKey,
                integrationKey: event.integrationKey,
                executionKey: event.executionKey,
                wait: notifierBody.wait || null,
                body: notifierBody.body || null,
                bucketName: notifierBody.bucketName || null,
                key: notifierBody.key || null,
            };

            friendlyMessage = 'Successfully transformed and queued notifications.';
            await queueHelper.sendToNotificationQueue(logger, queueMsg);
        }

        // ---------------------------
        // Update next execution time

        const scheduler = new Scheduler();

        const batch = await data.objects.Integration.getByKey(event.integrationKey);
        const executionTime = scheduler.getCurrentExecution();
        const interval = scheduler.getInterval(batch);
        
        batch.scheduledAt = moment(executionTime).add(interval, 'minutes').toDate();
        logger.verbose({ action: 'log', domain: 'transform', text: 'nextSchedule', value: batch.scheduledAt });
        await batch.save();

        // -----------------------

        await stateManager.generateStateResponseSuccess(logger, state, notification, execution, payload, {
            notificationStatus: NotificationStatus.TRANSFORM_SUCCESS, 
            executionStatus: NotificationExecutionStatus.TRANSFORM_SUCCESS, 
            friendlyMessage,
            params: { ignore: true }
        });
    }

    const result = Object.assign({}, event, { end: false, wait: event.wait || 1 });
    if (notifierBody.end) result.end = notifierBody.end;
    if (notifierBody.end !== true && notifierBody.wait) result.wait = notifierBody.wait;

    logger.debug({ action: 'log', domain: 'transform', text: 'result', value: result });
    return result;
};

module.exports.finaliserHandler = async (event, context) => heartbeatHelper.wrapper(event, context, null, async (event, context) => {
    
    // TODO: Add Logging.

    return { end: true };
});

const isString = (obj) => (Object.prototype.toString.call(obj) === '[object String]');
*/