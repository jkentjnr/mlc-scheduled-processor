import '@babel/polyfill';

import { createContextualLogger } from './helpers/logger';
import stateManager from './helpers/stateManager';
import jobService from './services/jobService';
import providerFactory from './providers';
import transformerFactory from './transformers';
import rendererFactory from './renderers';
import journalFactory from './journals';

let executionCounter = 0;

// WORKFLOW: Step #1: ExecuteQuery
module.exports.query = async (event, context) => { 
    
    const logger = createContextualLogger(context);

    logger.verbose({ action: 'log', domain: 'lambda', text: 'event', value: event });
    logger.verbose({ action: 'log', domain: 'lambda', text: 'context', value: context });
    logger.verbose({ action: 'log', domain: 'lambda', text: 'executionCounter', value: executionCounter++ });

    // Check for parameters
    if (!event || !event.executionKey) throw new Error('Missing Execution Key');
    if (!event || !event.jobId) throw new Error('Missing Job Id');

    // ------------------------------------------------------------------------

    // Get Job Configuration (mocked)
    const jobResult = await jobService.getJob(logger, event);
    logger.verbose({ action: 'log', domain: 'execute-job', text: 'result', value: jobResult });

    // Check for success
    if (!jobResult || !jobResult.success) throw new Error('Could not execute job query.');

    // ------------------------------------------------------------------------

    // Get data such as policies, etc.
    // - Flexible enough to support differing data sources and types.
    const response = await providerFactory.execute(logger, event.executionKey, event, jobResult.data);

    // Check for success
    if (!response || !response.success) throw new Error('Could not source data.');

    // ------------------------------------------------------------------------

    // Persist the data to S3 -- too large to pass around as Lambda results.
    await stateManager.persistPayloadToDataStore(logger, {
        executionKey: event.executionKey,
        job: jobResult.data,
        data: response.data,
    });

    // Return event so it is passed to next step.
    return event;
};

// WORKFLOW: Step #2: TransformEachDataEntry
module.exports.transform = async (event, context) => { 

    const logger = createContextualLogger(context);

    logger.verbose({ action: 'log', domain: 'lambda', text: 'event', value: event });
    logger.verbose({ action: 'log', domain: 'lambda', text: 'context', value: context });
    logger.verbose({ action: 'log', domain: 'lambda', text: 'executionCounter', value: executionCounter++ });

    // Check for parameters
    if (!event || !event.executionKey) throw new Error('Missing Execution Key');
    if (!event || !event.jobId) throw new Error('Missing Job Id');

    // Restore state from S3
    const state = await stateManager.getPayloadFromDataStore(logger, event.executionKey);
    logger.verbose({ action: 'log', domain: 'data', text: 'state', value: state });
    if (!state || !state.data) throw new Error('Missing Queried Data');

    // Set / restore iterators -- used to move through each policy / entry in the data.
    event.index = event.index || 0;
    event.length = event.length || state.data.length;

    // If all entries have been processed, then end.
    if (event.index >= event.length) {
        // Remove the index & length
        delete event.index;
        delete event.length;

        // - Marking end as true flags that all records have been processed.
        return Object.assign({}, event, { end: true, success: true });
    }

    // ------------------------------------------------------------------------------
    // HANDLER - Transform Data.
    // - Takes data from the original query and allows the workflow to transform / enhance the data.

    // Get current data record
    let item = state.data[event.index];
    logger.verbose({ action: 'log', domain: 'data', text: 'item-original', value: item });

    // Execute Transform
    item = await transformerFactory.execute(logger, event.executionKey, state.job, item);

    // Update record timestamp.
    item.updatedAt = new Date();

    // Reassign response to array in case reconstructed.
    state.data[event.index] = item;
    logger.verbose({ action: 'log', domain: 'data', text: 'item-modified', value: item });

    // ------------------------------------------------------------------------------

    // Increment the iterator index
    event.index++;

    // Persist the data to S3 -- too large to pass around as Lambda results.
    await stateManager.persistPayloadToDataStore(logger, state);

    // Return event so it is passed to next step.
    // - Marking end as false ensures the loop continues
    return Object.assign({}, event, { end: false, success: true });
};

// WORKFLOW: Step #3: RenderEachDataEntry
module.exports.render = async (event, context) => { 
    
    const logger = createContextualLogger(context);

    logger.verbose({ action: 'log', domain: 'lambda', text: 'event', value: event });
    logger.verbose({ action: 'log', domain: 'lambda', text: 'context', value: context });
    logger.verbose({ action: 'log', domain: 'lambda', text: 'executionCounter', value: executionCounter++ });

    // Check for parameters
    if (!event || !event.executionKey) throw new Error('Missing Execution Key');
    if (!event || !event.jobId) throw new Error('Missing Job Id');

    // Restore state from S3
    const state = await stateManager.getPayloadFromDataStore(logger, event.executionKey);
    logger.verbose({ action: 'log', domain: 'data', text: 'state', value: state });
    if (!state || !state.data) throw new Error('Missing Queried Data');

    // Initialise output if required.
    if (!state.output) state.output = [];

    // Set / restore iterators -- used to move through each policy / entry in the data.
    event.index = event.index || 0;
    event.length = event.length || state.data.length;

    // If all entries have been processed, then end.
    if (event.index >= event.length) {
        // Remove the index & length
        delete event.index;
        delete event.length;

        // - Marking end as true flags that all records have been processed.
        return Object.assign({}, event, { end: true, success: true });
    }

    // ------------------------------------------------------------------------------
    // HANDLER - Render Data for output.
    // - Takes data from the original query and allows the workflow to transform / enhance the data.

    // Get current data record
    let item = state.data[event.index];
    logger.verbose({ action: 'log', domain: 'data', text: 'item-original', value: item });

    // Execute Render
    state.output = await rendererFactory.execute(logger, event.executionKey, state.job, item, state.output);

    // Update record timestamp.
    item.updatedAt = new Date();

    // Reassign response to array in case reconstructed.
    logger.verbose({ action: 'log', domain: 'data', text: 'item-modified', value: item });

    // ------------------------------------------------------------------------------

    // Increment the iterator index
    event.index++;

    // Persist the data to S3 -- too large to pass around as Lambda results.
    await stateManager.persistPayloadToDataStore(logger, state);

    // Return event so it is passed to next step.
    // - Marking end as false ensures the loop continues
    return Object.assign({}, event, { end: false, success: true });
}

// WORKFLOW: Step #4: FinaliseRender
module.exports.renderFinaliser = async (event, context) => { 
    
    const logger = createContextualLogger(context);

    logger.verbose({ action: 'log', domain: 'lambda', text: 'event', value: event });
    logger.verbose({ action: 'log', domain: 'lambda', text: 'context', value: context });
    logger.verbose({ action: 'log', domain: 'lambda', text: 'executionCounter', value: executionCounter++ });

    // Check for parameters
    if (!event || !event.executionKey) throw new Error('Missing Execution Key');
    if (!event || !event.jobId) throw new Error('Missing Job Id');

    // Restore state from S3
    const state = await stateManager.getPayloadFromDataStore(logger, event.executionKey);
    logger.verbose({ action: 'log', domain: 'data', text: 'state', value: state });
    if (!state || !state.data) throw new Error('Missing Queried Data');

    // ------------------------------------------------------------------------------
    // HANDLER - Execute Rendering Finaliser.
    // - For example, dispatch rendered output to comms channel via bulk API / action.

    // Execute Render
    state.output = await rendererFactory.finalise(logger, event.executionKey, state.job, state.data, state.output);

    // ------------------------------------------------------------------------------

    // Increment the iterator index
    event.index++;

    // Persist the data to S3 -- too large to pass around as Lambda results.
    await stateManager.persistPayloadToDataStore(logger, state);

    // Return event so it is passed to next step.
    // - Marking end as false ensures the loop continues
    return Object.assign({}, event, { end: false, success: true });
}

// WORKFLOW: Step #5: Finalise
module.exports.finaliser = async (event, context) => { 
    
    const logger = createContextualLogger(context);

    logger.verbose({ action: 'log', domain: 'lambda', text: 'event', value: event });
    logger.verbose({ action: 'log', domain: 'lambda', text: 'context', value: context });
    logger.verbose({ action: 'log', domain: 'lambda', text: 'executionCounter', value: executionCounter++ });

    // Check for parameters
    if (!event || !event.executionKey) throw new Error('Missing Execution Key');
    if (!event || !event.jobId) throw new Error('Missing Job Id');

    // Restore state from S3
    const state = await stateManager.getPayloadFromDataStore(logger, event.executionKey);
    logger.verbose({ action: 'log', domain: 'data', text: 'state', value: state });
    if (!state || !state.data) throw new Error('Missing Queried Data');

    // ------------------------------------------------------------------------------
    // Finalise the Workflow

    // Mark all successes
    state.data.forEach(item => {
        if (item.status.endsWith('_SUCCESS') === true) {
            item.status = 'SUCCESS';
            item.updatedAt = new Date();
        }
    });
    
    // ------------------------------------------------------------------------------

    // Persist the data to S3 -- too large to pass around as Lambda results.
    await stateManager.persistPayloadToDataStore(logger, state);

    // Return event so it is passed to next step.
    return event;
}

// WORKFLOW: Utility: Journal
module.exports.journal = async (event, context) => { 
    
    const logger = createContextualLogger(context);

    logger.verbose({ action: 'log', domain: 'lambda', text: 'event', value: event });
    logger.verbose({ action: 'log', domain: 'lambda', text: 'context', value: context });
    logger.verbose({ action: 'log', domain: 'lambda', text: 'executionCounter', value: executionCounter++ });

    // Check for parameters
    if (!event || !event.executionKey) throw new Error('Missing Execution Key');
    if (!event || !event.jobId) throw new Error('Missing Job Id');

    // Restore state from S3
    const state = await stateManager.getPayloadFromDataStore(logger, event.executionKey);
    logger.verbose({ action: 'log', domain: 'data', text: 'state', value: state });
    if (!state) throw new Error('Missing Queried Data');

    // ------------------------------------------------------------------------------
    // HANDLER - Execute Journaling.
    // - For example, dispatch rendered output to comms channel via bulk API / action.

    // Execute Journal
    await journalFactory.execute(logger, event.executionKey, state);

    // ------------------------------------------------------------------------------

    // No Persisting of state
    // - Just observing

    // Return event so it is passed to next step with no issues.
    return event;
}