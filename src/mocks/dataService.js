import shortid from 'shortid';

export default class DataService {

    // MOCKED
    static async executeJob(day, jobId) {

        // Simulate: getting metadata by Job
        const job = [{
            jobId: 1,
            query: 'SELECT * FROM mock.vwSEN_ProtectionFirst',
            docType: '123_SEN_PF',
        }];

        // Simulate: executing query by Job and returning results
        const data = [];
        for (let i = 0; i < 25; i++) {
            data.push({
                policyNo: shortid.generate(),
                status: 'PENDING',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
        
        return {
            success: true,
            job,
            data,
        };

    }

}