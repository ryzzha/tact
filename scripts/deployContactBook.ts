import { toNano } from '@ton/core';
import { ContactBook } from '../wrappers/ContactBook';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const contactBook = provider.open(await ContactBook.fromInit());

    await contactBook.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(contactBook.address);

    // run methods on `contactBook`
}
