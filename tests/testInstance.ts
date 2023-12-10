import Test from "./test";
import Log, { StoredLog } from "./log";

export default interface TestInstance {
    id: string;
    startedAt?: Date;
    completedAt?: Date;
    testId: string;
    status: 'notStarted' | 'running' | 'complete';
    logs: Log[];
    succeeded: boolean;
    complete: boolean;
}

export type StoredTestInstance = Omit<TestInstance, 'startedAt' | 'completedAt' | 'logs'> & {
    startedAt?: string,
    completedAt?: string,
    logs: StoredLog[]
};
