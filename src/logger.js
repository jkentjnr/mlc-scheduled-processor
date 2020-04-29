import winston from 'winston';

const cloudwatchMessageFormat = winston.format.printf(obj => {
    return `${new Date().toISOString()} ${obj.requestId || 'UNSPECIFIED                        '} || ${JSON.stringify(obj.message)}`;
});

const logger = winston.createLogger({
    level: process.env.DEBUG_LEVEL || 'debug',
    format: cloudwatchMessageFormat,
    transports: [
      new winston.transports.Console()
    ],
    silent: (process.env.LOG === 'true') ? false : (process.env.NODE_ENV === 'TEST' || process.env.NODE_ENV === 'test')
  });
  
  //
  // If we're not in production then log to the `console` with the format:
  // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
  // 
  /*
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.simple()
    }));
  }
  */

export default logger;
export const createContextualLogger = (context) => logger.child({ requestId: (context) ? context.awsRequestId : null });

export const getSafeLogger = (logger) => {
  return {
    logDebug: (logger) ? logger.debug.bind(logger) : console.log,
    logError: (logger) ? logger.error.bind(logger) : console.log,
  };
};