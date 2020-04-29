export default class JobService {

    // MOCKED
    static async getJob(request) {

        // Simulate: getting metadata by Job
        const job = {
            jobId: 1,
            name: '40DayPriorRenewal_SEN_ProtectionFirst',
            journalHandler: 'AthenaS3Journal',
            providerHandler: 'SomeEnterpriseApiProvider',
            transformHandler: 'SomeEnterpriseApiTransformer',
            rendererHandler: 'SomeEnterpriseReportingApiRenderer',
            custom: {
                query: 'SELECT * FROM mock.vw_40d_SEN_ProtectionFirst',
                docType: '123_SEN_PF',
            }
        };
    
        return {
            success: true,
            data: job,
        };

    }

}