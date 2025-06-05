import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, toNano } from '@ton/core';
import { Dispatcher } from '../wrappers/Dispatcher';
import { storeResultMessage } from '../wrappers/Dispatcher';
import '@ton/test-utils';

describe('Dispatcher', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;
    let dispatcher: SandboxContract<Dispatcher>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        user = await blockchain.treasury('user');

        dispatcher = blockchain.openContract(await Dispatcher.fromInit(deployer.address));

        const deployResult = await dispatcher.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: dispatcher.address,
            deploy: true,
            success: true,
        });
    });

    it('should base work', async () => {
        const getInfoResultBefore = await dispatcher.getInfo()

        const infoSliceBefore = getInfoResultBefore.beginParse()

        console.log(infoSliceBefore.loadAddressAny()) // why null ???
        console.log(infoSliceBefore.loadStringRefTail())
        console.log(infoSliceBefore.loadInt(32))

        const substractResult = await dispatcher.send(
            user.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'SubstractMessage',
                a: 6n,
                b: 5n,
            }
        );

        expect(substractResult.transactions).toHaveTransaction({
            from: dispatcher.address,
            to: user.address,
            success: true,
            body: beginCell().store(storeResultMessage({$$type: "ResultMessage", res: 1n})).endCell()
        });

        const multiplytResult = await dispatcher.send(
            user.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'MultiplyMessage',
                a: 5n,
                b: 6n,
            }
        );

        expect(multiplytResult.transactions).toHaveTransaction({
            from: dispatcher.address,
            to: user.address,
            success: true,
            body: beginCell().store(storeResultMessage({$$type: "ResultMessage", res: 30n})).endCell()
        });

        const negatetResult = await dispatcher.send(
            user.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'NegateMessage',
                num: 55n,
            }
        );

        expect(negatetResult.transactions).toHaveTransaction({
            from: dispatcher.address,
            to: user.address,
            success: true,
            body: beginCell().store(storeResultMessage({$$type: "ResultMessage", res: -55n})).endCell()
        });

        const getInfoResultAfter = await dispatcher.getInfo()

        const infoSliceAfter = getInfoResultAfter.beginParse()

        console.log(infoSliceAfter.loadAddressAny()) // why null ???
        console.log(infoSliceAfter.loadStringRefTail())
        console.log(infoSliceAfter.loadInt(32))
    });
});
