import AWS from 'aws-sdk';
const StepFunctions = new AWS.StepFunctions();

export default class StepFunctionHelper {

    static execute(param) {
        return new Promise((resolve, reject) => 
            StepFunctions.startExecution(param, (err, data) => { if (err) reject(err); else resolve(data); }));
    } 
}