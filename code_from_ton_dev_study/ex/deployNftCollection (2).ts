import { Address, beginCell, Cell, toNano } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { NetworkProvider } from '@ton/blueprint';

function createOffchainContent(link: string) {
    return beginCell().storeUint(1, 8).storeStringTail(link).endCell()
}

export async function run(provider: NetworkProvider) {
    const nftCollection = provider.open(await NftCollection.fromInit(provider.sender().address!!, createOffchainContent("https://s.getgems.io/nft/b/c/64427bdf371066c7ee000d99/meta.json"), createOffchainContent("https://s.getgems.io/nft/b/c/64427bdf371066c7ee000d99/")));

    await nftCollection.send(
        provider.sender(),
        {
            value: toNano('0.08'),
        },
        {
            $$type: "MintNft",
            owner: Address.parse("UQBJuC8QtLBqvz4Xir5A4hItwKmBsulTzJ6KBWFrm6UX2vgf"),
            forwardAmount: toNano("0.04"),
            content: Cell.EMPTY,
            index: 2n
        }
    );

    await provider.waitForDeploy(nftCollection.address);

    // run methods on `nftCollection`
}
