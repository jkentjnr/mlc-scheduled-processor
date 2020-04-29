export default class DataService {

    // MOCKED
    static async getJobs() {

        return [{
            jobId: 1,
            query: 'SELECT * FROM mock.vwSEN_ProtectionFirst',
            docType: '123_SEN_PF',
        }];

    }

}