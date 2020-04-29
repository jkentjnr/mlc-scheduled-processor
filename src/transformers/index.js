import SomeEnterpriseApiTransformer from './someEnterpriseApiTransformer';

const transformers = {
    "SomeEnterpriseApiTransformer": SomeEnterpriseApiTransformer
};

export default class TransformerFactory {

    static async execute(logger, executionKey, job, item) {
        if (!job || !job.transformHandler) throw new Error('Missing Transformer Metadata');
        if (!item || !item.key) throw new Error('Missing Record (and associated Key)');

        logger.verbose({ action: 'log', domain: 'transform-factory', text: 'record-key', value: item.key });

        const Transformer = transformers[job.transformHandler];
        logger.verbose({ action: 'log', domain: 'transform-factory', text: 'found-transformer', value: job.transformHandler });

        if (Transformer) {
            const instance = new Transformer();
            return await instance.execute(logger, executionKey, job, item);
        }
        else {
            logger.verbose({ action: 'log', domain: 'transform-factory', text: 'missing-transformer' });
        }

        return item;
    }

}
