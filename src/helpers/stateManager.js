import s3Manager from './s3Manager';
import secretManager from './secretManager';

export default class stateManager {

    static async getPayloadFromDataStore(logger, executionKey) {
        if (!executionKey) throw new Error('Missing required execution key');
       
        const s3bucket = await secretManager.getValue(logger, 'S3_BUCKET');

        let payloadResponse;
        try {
            const payloadKey = `state/${executionKey}`;
            payloadResponse = await s3Manager.getObject(logger, s3bucket, payloadKey);
        }
        catch (e) {
            throw new Error('Unable to retrieve payload from data store');
        }

        try { return JSON.parse(payloadResponse.Body.toString('utf-8')); }
        catch (e) { console.log('Exception', e); throw new Error('Unable to deserialise payload from data store'); }
    }

    static async persistPayloadToDataStore(logger, state) {
        if (!state || !state.executionKey) throw new Error('Missing required data to persist payload');
    
        const s3bucket = await secretManager.getValue(logger, 'S3_BUCKET');

        // Upsert payload for this execution
        try { await s3Manager.putObject(logger, s3bucket, `state/${state.executionKey}`, JSON.stringify(state, null, 2)); }
        catch (e) { console.log('Exception', e); throw new Error('Unable to persist payload to data store'); }
    }

}