import { toNano } from '@ton/core';
import { Dispatcher } from '../wrappers/Dispatcher';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const dispatcher = provider.open(Dispatcher.createFromConfig({}, await compile('Dispatcher')));

    await dispatcher.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(dispatcher.address);

    // run methods on `dispatcher`
}
