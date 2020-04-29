import secretManager from '../helpers/secretManager';
import s3Manager from '../helpers/s3Manager';

import moment from 'moment';

export default class AthenaS3Journal {

    async execute(logger, executionKey, state) {

        const dateFormatter = (dt) => 
            (dt) ? moment.utc(dt).format('YYYY-MM-DD HH:mm:ss.SSS') : '';

        if (state && state.data) {
            // Get S3 target bucket.
            const s3bucket = await secretManager.getValue(logger, 'S3_BUCKET');

            // Create Athena S3 CSV
            const csv = state.data.map(item => {
                return [item.key, item.status, dateFormatter(item.createdAt), dateFormatter(item.updatedAt)].join(',');
            }).join('\n');

            // Example: Persist CSV to S3
            try { await s3Manager.putObject(logger, s3bucket, `status_reports/${executionKey}.csv`, csv); }
            catch (e) { console.log('Exception', e); throw new Error('Unable to persist csv payload to data store'); }
        }

        return { success: true };
    }
}