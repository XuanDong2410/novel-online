import slugify from 'slugify';
import pino from 'pino';

const logger = pino();

export const formatName = (name) => {
  if (typeof name !== 'string' || name.trim() === '') {
    logger.warn(`Invalid name provided: ${name}. Using default value 'unknown'.`);
    name = 'unknown';
  }

  const formatted = slugify(name, {
    lower: true,
    strict: true,
    locale: 'vi',
  }).replace(/-+/g, '-');

  if (formatted.length === 0) {
    logger.warn(`Formatted name is empty for input: ${name}. Using default value 'unknown'.`);
    return 'unknown';
  }

  return formatted;
};