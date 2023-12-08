import Test from "../tests/test";

export const expect = async (testName: string, test: Test, condition: () => Promise<boolean | never>) => {
    try {
        const val = await condition();
        if (!val) {
            test.errors.push(`${testName} failed`);
            throw new Error(`${testName} failed`);
        } else {
            test.logs.push({
                timestamp: new Date(),
                type: 'expect',
                encrypted: false,
                encryptionFailure: false,
                textPreview: `${testName} passed`
            });
        }
    } catch (err) {
        console.log(testName, ' FAILED');
        test.errors.push(`${testName} failed`);
        throw err;
    }
};

export const getTextLog = (message: string) => ({
    timestamp: new Date(),
    type: 'debug',
    encrypted: false,
    encryptionFailure: false,
    textPreview: message,
});