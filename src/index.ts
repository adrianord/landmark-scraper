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
        availability: new Date(tr.querySelector('[data-label="Date Available"] span')?.innerHTML || "")
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

process.on('SIGINT', async () => {
  logger.info('Stopping scrapper');
  process.exit();
});

(async () => {
  const apartments = await checkApartmentAvailability();
  logger.info(apartments);
})().catch((e) => logger.fatal(e));
