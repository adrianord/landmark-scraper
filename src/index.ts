import { Logger } from 'tslog';

const logger = new Logger({
  displayFunctionName: false,
  displayInstanceName: false,
  displayDateTime: false,
  displayLoggerName: false,
});

process.on('SIGINT', async () => {
  logger.info('Stopping scrapper');
  process.exit();
});

(async () => {

})().catch((e) => logger.fatal(e));
