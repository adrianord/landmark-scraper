import axios from 'axios';
import * as domino from 'domino';
import { Logger } from 'tslog';
import { config } from './config';

const httpClient = axios.create({
  baseURL: config.baseURL,
  params: {
    myOlePropertyId: config.propertyId
  }
});

const logger = new Logger({
  displayFunctionName: false,
  displayInstanceName: false,
  displayDateTime: false,
  displayLoggerName: false,
});

const timeConversion: { [key: string]: (duration: number) => number } = {
  ms: (duration: number) => duration,
  s: (duration: number) => duration * 1000,
  m: (duration: number) => timeConversion["s"](duration) * 60,
  h: (duration: number) => timeConversion["m"](duration) * 60,
  d: (duration: number) => timeConversion["h"](duration) * 24,
  w: (duration: number) => timeConversion["d"](duration) * 7,
}

async function checkApartmentAvailability() {
  try {
    const response = await httpClient.get("");
    const window = domino.createWindow(response.data);
    const document = window.document;
    const targets = document.querySelectorAll("div#innerformdiv > .row-fluid > .block > table");
    const apartments = [...targets].map(el => ({
      name: el.querySelector("caption")?.innerHTML.replace("Apartment Details and Selection for Floor Plan: ", "") || "UNKNOWN",
      availability: [...el.querySelectorAll("tbody > tr")].map(tr => ({
        apartment: tr.querySelector('[data-label="Apartment"]')?.innerHTML.substring(1) || "",
        rent: rentRangeToNumber(tr.querySelector('[data-label="Rent"]')?.innerHTML),
        availability: parseDate(tr.querySelector('[data-label="Date Available"] span')?.innerHTML)
      }))
    }));
    return apartments;
  } catch (e) {
    logger.error("Failed to retrieve apartment availability", e);
  }
}

function rentRangeToNumber(rentRange?: string): number {
  if (!rentRange) return 0;
  const [min] = rentRange.split("-");
  const cleanMin = min.substring(1).replace(",", "");
  return Number.parseInt(cleanMin);
}

function parseDate(dateString?: string): Date {
  const date = new Date(dateString || "");
  return isNaN(date.getTime()) ? new Date() : date;
}

function parseTime(time: string): number {
  const matches = time.match(/(\d+)(ms|s|m|h|d|w)/);
  if (!matches) throw new Error(`Time(${time}) did not match regex.`);
  const [, duration, metric] = matches;
  const conversion = timeConversion[metric];
  return conversion(Number.parseInt(duration));
}

async function delay(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

process.on('SIGINT', async () => {
  logger.info('Stopping scrapper');
  process.exit();
});

(async () => {
  const milliseconds = parseTime("1d");
  while (true) {
    const apartments = await checkApartmentAvailability();
    logger.info(apartments);
    await delay(milliseconds);
  }
})().catch((e) => logger.fatal(e));
