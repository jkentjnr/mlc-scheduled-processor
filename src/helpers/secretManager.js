import AWS from 'aws-sdk';

// get reference to S3 client 
const client = new AWS.SecretsManager();

export default class secretManager {

	static getValue(logger, secretName) {
        if (process.env[secretName]) {
            return Promise.resolve(process.env[secretName]);
        }

        const secretKey = `${process.env.PROJECT}/${process.env.STAGE}/${secretName.toLowerCase()}`;
        console.log('secretKey:', secretKey);
                
        return client.getSecretValue({ SecretId: secretKey }).promise()
            .then(data => {
                let secret;

                if ('SecretString' in data) {
                    secret = data.SecretString;
                } else {
                    let buff = new Buffer(data.SecretBinary, 'base64');
                    secret = buff.toString('ascii');
                }

                console.log('secretKey', secretKey, secret);
                return secret;
            });
	}

}