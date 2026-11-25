export type CronPreset = {
  slug: string;
  expression: string;
  name: string;
  h1: string;
  title: string;
  description: string;
  note: string;
};

export const cronPresets: CronPreset[] = [
  {
    slug: "every-minute",
    expression: "* * * * *",
    name: "Every minute",
    h1: "Cron every minute",
    title: "Cron expression for every minute",
    description: "The five-field cron expression that runs a job every minute, with the next five local run times.",
    note: "Every minute runs 1,440 times a day. Use it for a cheap queue drain, not for a heavy report.",
  },
  {
    slug: "every-5-minutes",
    expression: "*/5 * * * *",
    name: "Every 5 minutes",
    h1: "Cron every 5 minutes",
    title: "Cron expression for every 5 minutes",
    description: "Use */5 * * * * to run a job every five minutes. See what each field means and the next five run times.",
    note: "The minutes are 0, 5, 10, and so on. The schedule does not start five minutes after the crontab is saved.",
  },
  {
    slug: "every-15-minutes",
    expression: "*/15 * * * *",
    name: "Every 15 minutes",
    h1: "Cron every 15 minutes",
    title: "Cron expression for every 15 minutes",
    description: "The cron expression */15 * * * * runs at minute 0, 15, 30, and 45 of every hour.",
    note: "The four runs in each hour are :00, :15, :30, and :45. The spacing does not drift.",
  },
  {
    slug: "every-hour",
    expression: "0 * * * *",
    name: "Every hour",
    h1: "Cron every hour",
    title: "Cron expression for every hour",
    description: "0 * * * * runs once an hour at minute 0. It is the same schedule as the @hourly nickname.",
    note: "@hourly is the same five fields. It runs at minute 0, not once per rolling hour from now.",
  },
  {
    slug: "daily-at-midnight",
    expression: "0 0 * * *",
    name: "Daily at midnight",
    h1: "Cron daily at midnight",
    title: "Cron expression for every day at midnight",
    description: "0 0 * * * runs every day at 00:00 in the machine's local timezone. Equivalent to @daily.",
    note: "Midnight is 00:00, not 12:00 noon. @daily and @midnight expand to the same expression.",
  },
  {
    slug: "weekdays-at-9am",
    expression: "0 9 * * 1-5",
    name: "Weekdays at 9am",
    h1: "Cron weekdays at 9:00",
    title: "Cron expression for weekdays at 9am",
    description: "0 9 * * 1-5 runs at 09:00 Monday through Friday. In this cron, Sunday is 0 and Saturday is 6.",
    note: "Monday is 1 and Friday is 5. This expression does not run on Saturday or Sunday.",
  },
  {
    slug: "every-sunday",
    expression: "0 0 * * 0",
    name: "Every Sunday",
    h1: "Cron every Sunday",
    title: "Cron expression for every Sunday",
    description: "0 0 * * 0 runs at midnight on Sunday. The same schedule is 0 0 * * 7 on cron implementations that accept 7.",
    note: "Sunday is 0 here. Some crontabs also accept 7, and DevKit normalises 7 to Sunday.",
  },
  {
    slug: "first-of-month",
    expression: "0 0 1 * *",
    name: "First of the month",
    h1: "Cron on the first of the month",
    title: "Cron expression for the first day of the month",
    description: "0 0 1 * * runs at midnight on day 1 of every month. It is the same schedule as @monthly.",
    note: "Day 1 is the calendar date, not the first Monday. @monthly expands to the same expression.",
  },
];
