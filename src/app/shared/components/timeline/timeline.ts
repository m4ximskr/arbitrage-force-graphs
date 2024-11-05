
export enum TimeUnit {
  SECONDS_1 = 'seconds_1',
  SECONDS_5 = 'seconds_5',
  SECONDS_10 = 'seconds_10',
  SECONDS_30 = 'seconds_30',
  MINUTES_1 = 'minutes_1',
  MINUTES_5 = 'minutes_5',
  MINUTES_10 = 'minutes_10',
  MINUTES_30 = 'minutes_30',
  HOURS_1 = 'hours_1',
}

type TimeUnitMap = {
  [key in TimeUnit]: {
    timeStep: number;
    label: string;
    value: TimeUnit;
    interval: number;
  }
}

export const timeUnitMap: TimeUnitMap = {
  [TimeUnit.SECONDS_1]: {
    timeStep: 1,
    label: '1 s',
    value: TimeUnit.SECONDS_1,
    interval: 1000
  },
  [TimeUnit.SECONDS_5]: {
    timeStep: 1,
    label: '5 s',
    value: TimeUnit.SECONDS_5,
    interval: 1000 / 5,
  },
  [TimeUnit.SECONDS_10]: {
    timeStep: 1,
    label: '10 s',
    value: TimeUnit.SECONDS_10,
    interval: 1000 / 10,
  },
  [TimeUnit.SECONDS_30]: {
    timeStep: 1,
    label: '30 s',
    value: TimeUnit.SECONDS_30,
    interval: 1000 / 30,
  },
  [TimeUnit.MINUTES_1]: {
    timeStep: 1,
    label: '1 m',
    value: TimeUnit.MINUTES_1,
    interval: 1000 / 60,
  },
  [TimeUnit.MINUTES_5]: {
    timeStep: 300 / (1000 / 4),
    label: '5 m',
    value: TimeUnit.MINUTES_5,
    interval: 4,
  },
  [TimeUnit.MINUTES_10]: {
    timeStep: 600 / (1000 / 4),
    label: '10 m',
    value: TimeUnit.MINUTES_10,
    interval: 4,
  },
  [TimeUnit.MINUTES_30]: {
    timeStep: 1800 / (1000 / 4),
    label: '30 m',
    value: TimeUnit.MINUTES_30,
    interval: 4,
  },
  [TimeUnit.HOURS_1]: {
    timeStep: 3600 / (1000 / 4),
    label: '1 h',
    value: TimeUnit.HOURS_1,
    interval: 4,
  },
}