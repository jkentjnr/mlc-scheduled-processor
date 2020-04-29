import shortid from 'shortid';
import { v4 as uuid } from 'uuid';

export default class SomeEnterpriseApiTransformer {

    async execute(logger, executionKey, job, item) {
        try {

            // -------------------------------
            // SIMULATE CALLING ENTERPRISE API    
            // -------------------------------
            
            // Make sure the record is present.
            if (!item.record) throw new Error('Missing Record');

            // Append some mock data
            Object.assign(item.record, {
                mockName: shortid.generate(),
                mockKey: uuid(),
            });

            // Update the status as success
            item.status = 'TRANSFORM_SUCCESS';
        }
        catch (e) {
            // Update the status as failed
            item.status = 'TRANSFORM_FAILED';
        }

        return item;
    }

}