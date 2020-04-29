import SomeEnterpriseApiProvider from './someEnterpriseApiProvider';

const providers = {
    "SomeEnterpriseApiProvider": SomeEnterpriseApiProvider
};

export default class ProviderFactory {

    static async execute(logger, executionKey, context, job) {
        if (!job || !job.providerHandler) throw new Error('Missing Provider Metadata');

        const Provider = providers[job.providerHandler];
        logger.verbose({ action: 'log', domain: 'provider-factory', text: 'found-provider', value: job.providerHandler });

        if (Provider) {
            const instance = new Provider();
            return await instance.execute(logger, executionKey, context, job);
        }
        else {
            logger.verbose({ action: 'log', domain: 'provider-factory', text: 'missing-provider' });
        }

        return {
            success: false,
            error: 'Could not execute provider',
        };
    }

}
