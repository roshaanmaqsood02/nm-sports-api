import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, colorize, errors, json, splat } = winston.format;

// Custom log line format for console
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  splat(),
  nestWinstonModuleUtilities.format.nestLike('NMSports', {
    prettyPrint: true,
    colors: true,
  }),
);

// JSON format for file transport
const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  splat(),
  json(),
);

// Daily rotating file transport factory
const makeRotateTransport = (
  level: string,
  filename: string,
): winston.transport => {
  return new (winston.transports as any).DailyRotateFile({
    level,
    filename: `logs/${filename}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: fileFormat,
  });
};

// Exported Winston options
export const winstonConfig: winston.LoggerOptions = {
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  transports: [
    // Console — pretty coloured output
    new winston.transports.Console({ format: consoleFormat }),

    // Rolling file — all logs (info and above)
    makeRotateTransport('info', 'app'),

    // Rolling file — errors only
    makeRotateTransport('error', 'error'),

    // Rolling file — audit trail (custom level)
    makeRotateTransport('info', 'audit'),
  ],
  // Don't crash the app on unhandled transport errors
  exitOnError: false,
};
