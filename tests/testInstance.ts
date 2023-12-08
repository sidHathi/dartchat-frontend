import Test from "./test";
import Log from "./log";

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
