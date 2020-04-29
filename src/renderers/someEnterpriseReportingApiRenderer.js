import secretManager from '../helpers/secretManager';
import s3Manager from '../helpers/s3Manager';

export default class SomeEnterpriseReportingApiRenderer {

    async execute(logger, executionKey, job, item, output) {
        // Initalise if null.
        const response = output || [];

        try {

            // Make sure the record is present.
            if (!item.record) throw new Error('Missing Record');

            // Example - Create CSV Data - would use libraries, etc to produce
            const csv = [item.record.policyNo, item.record.mockKey, item.record.mockName].join(',');
            response.push(csv);

            // Update the status as success
            item.status = 'RENDER_SUCCESS';
        }
        catch (e) {
            // Update the status as failed
            item.status = 'RENDER_FAILED';
        }

        return response;
    }

    async finalise(logger, executionKey, job, data, output) {

        // Get S3 target bucket.
        const s3bucket = await secretManager.getValue(logger, 'S3_BUCKET');

        // Join array into single CSV string
        const csv = output.join('\n');

        // Example: Persist CSV to S3
        try { await s3Manager.putObject(logger, s3bucket, `renderer_output/${executionKey}.csv`, csv); }
        catch (e) { console.log('Exception', e); throw new Error('Unable to persist csv payload to data store'); }
    }

}