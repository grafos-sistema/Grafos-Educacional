import { calculateScheduleLoad } from './schedule-load';

describe('calculateScheduleLoad', () => {
  it('soma a duração real dos horários da grade', () => {
    expect(
      calculateScheduleLoad([
        { startTime: '08:00', endTime: '08:50' },
        { startTime: '13:10', endTime: '14:00' },
      ]),
    ).toEqual({
      scheduledMinutes: 100,
      scheduledClassCount: 2,
    });
  });

  it('não transforma a carga manual legada em carga atual', () => {
    expect(calculateScheduleLoad([])).toEqual({
      scheduledMinutes: 0,
      scheduledClassCount: 0,
    });
  });
});
