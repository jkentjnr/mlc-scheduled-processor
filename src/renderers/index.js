import SomeEnterpriseReportingApiRenderer from './someEnterpriseReportingApiRenderer';

const renderers = {
    "SomeEnterpriseReportingApiRenderer": SomeEnterpriseReportingApiRenderer
};

export default class RendererFactory {

    // TODO: Refactor Renderer Factory

    static async execute(logger, executionKey, job, item, output) {
        if (!job || !job.rendererHandler) throw new Error('Missing Renderer Metadata');
        if (!item || !item.key) throw new Error('Missing Record (and associated Key)');

        logger.verbose({ action: 'log', domain: 'renderer-factory', text: 'record-key', value: item.key });

        const Renderer = renderers[job.rendererHandler];
        logger.verbose({ action: 'log', domain: 'renderer-factory', text: 'found-renderer', value: job.rendererHandler });

        if (Renderer) {
            const instance = new Renderer();
            return await instance.execute(logger, executionKey, job, item, output);
        }
        else {
            logger.verbose({ action: 'log', domain: 'renderer-factory', text: 'missing-renderer' });
        }

        return item;
    }

    static async finalise(logger, executionKey, job, data, output) {
        if (!job || !job.rendererHandler) throw new Error('Missing Renderer Metadata');

        const Renderer = renderers[job.rendererHandler];
        logger.verbose({ action: 'log', domain: 'renderer-factory', text: 'found-renderer', value: job.rendererHandler });

        if (Renderer) {
            const instance = new Renderer();
            return await instance.finalise(logger, executionKey, job, data, output);
        }
        else {
            logger.verbose({ action: 'log', domain: 'renderer-factory', text: 'missing-renderer' });
        }

        return item;
    }

}
