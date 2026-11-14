import { logJob } from '../admin/collect.js';

/** Запуск фоновой задачи с записью в журнал задач (ig_job_runs): когда шла и чем кончилась. */
export async function tracked<T>(job: string, work: () => Promise<T>, manual = false): Promise<T> {
  const startedAt = new Date();
  try {
    const result = await work();
    logJob(job, true, undefined, manual, startedAt);
    return result;
  } catch (err) {
    logJob(job, false, String((err as Error).message ?? err), manual, startedAt);
    throw err;
  }
}
