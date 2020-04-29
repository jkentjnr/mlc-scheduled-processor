import AWS from 'aws-sdk';
import exceptionHandler from '../helpers/exceptionHelper';

// get reference to S3 client 
const s3 = new AWS.S3();

export default class s3Manager {

	static getObject(logger, bucket, key) {
		const bucketParams = {
			Bucket: bucket,
			Key: key
		};

		return new Promise((resolve, reject) => {
			if (logger) logger.verbose({ action: 'log', domain: 's3-datastore', text: 'Getting data from S3 Bucket', value: { bucket, key } });
			s3.getObject(bucketParams, (err, data) => {
				if (err) { 
					if (logger) logger.error({ action: 'exception', domain: 's3-datastore', text: 'Error getting data from S3 Bucket', value: { bucket, key, e: exceptionHandler.asObject(err) } });
					reject(err);
				}
				else {
					if (logger) logger.verbose({ action: 'log', domain: 's3-datastore', text: 'Sucessfully retrieved data from S3 Bucket' });
					resolve(data);
				}
			});
		});
	}

	static putObject(logger, bucket, key, body) {
		const bucketParams = {
			Bucket: bucket,
			Key: key,
			Body: body
		};

		return new Promise((resolve, reject) => {
			s3.putObject(bucketParams, (err, data) => {
				
				if (err) { 
					if (logger) logger.verbose({ action: 'log', domain: 's3-datastore', text: 'Error setting data in S3 Bucket', value: exceptionHandler.asObject(err) });
					reject(err); 
					return; 
				}
				resolve();
			});
		});
	}
}