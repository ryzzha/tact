import { Address, beginCell, openContract, toNano } from '@ton/core';
import { NftSale } from '../wrappers/Sale';
import { NetworkProvider } from '@ton/blueprint';
import { JettonWallet } from '../wrappers/JettonWallet';
import { JettonMinter } from '../wrappers/JettonMinter';

export async function run(provider: NetworkProvider) {
    // const sale = provider.open(await Sale.fromInit());

    // await sale.send(
    //     provider.sender(),
    //     {
    //         value: toNano('0.05'),
    //     },
    //     {
    //         $$type: 'Deploy',
    //         queryId: 0n,
    //     }
    // );

    // await provider.waitForDeploy(sale.address);

    let jetton = provider.open(
        JettonMinter.createFromAddress(Address.parse('kQDlchtIzKsn-p8mgVpVmX6IMdpfdOmJTDz9XThgctUnAkC8')),
    );

    let jettonWallet = provider.open(
        JettonWallet.createFromAddress(await jetton.getWalletAddress(provider.sender().address!!)),
    );

    // await jettonWallet.sendTransfer()

    // run methods on `sale`
}
