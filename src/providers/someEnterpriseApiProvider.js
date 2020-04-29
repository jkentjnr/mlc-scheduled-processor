import shortid from 'shortid';

export default class SomeEnterpriseApiProvider {

    async execute(logger, executionKey, context, job) {

        // Simulate: executing query by Job and returning results

        const data = [];
        for (let i = 0; i < 25; i++) {
            const key = shortid.generate();

            data.push({
                key,
                status: 'PENDING',
                createdAt: new Date(),
                updatedAt: new Date(),

                record: {
                    policyNo: key,
                }
            });
        }

        return {
            success: true,
            data,
        };
    
    }
}