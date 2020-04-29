import AthenaS3Journal from './athenaS3Journal';

const journals = {
    "AthenaS3Journal": AthenaS3Journal
};

export default class JournalFactory {

    static async execute(logger, executionKey, state) {
        if (!state) return;

        const Journal = journals[state.job.journalHandler];
        logger.verbose({ action: 'log', domain: 'journal-factory', text: 'journal-provider', value: state.job.journalHandler });

        if (Journal) {
            const instance = new Journal();
            return await instance.execute(logger, executionKey, state);
        }
        else {
            logger.verbose({ action: 'log', domain: 'journal-factory', text: 'missing-journal' });
        }

        return {
            success: false,
            error: 'Could not execute journal',
        };
    }

}
