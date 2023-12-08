import Log from "./log";

export default interface Test {
    id: string;
    init: (params: { [key: string]: any }) => Test;
    name: string;
    description: string;
    params: { [key: string]: any };
    logs: Log[];
    errors: string[];
    run: () => Promise<void>;
}
