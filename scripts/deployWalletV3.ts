import { toNano } from '@ton/core';
import { WalletV3 } from '../wrappers/WalletV3';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const walletV3 = provider.open(await WalletV3.fromInit());

    await walletV3.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(walletV3.address);

    // run methods on `walletV3`
}
