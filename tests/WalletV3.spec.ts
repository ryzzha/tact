import { Blockchain, printTransactionFees, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, Cell, comment, internal, MessageRelaxed, SendMode, storeMessageRelaxed, toNano } from '@ton/core';
import { RequestSendMessage, WalletV3 } from '../wrappers/WalletV3';
import '@ton/test-utils';
import { KeyPair, mnemonicNew, mnemonicToWalletKey, sign } from '@ton/crypto';
import { generateKeyPair } from 'crypto';

describe('WalletV3', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let walletV3: SandboxContract<WalletV3>;
    let keyPair: KeyPair;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        blockchain.now = 10000000;

        const mnemonic = await mnemonicNew();
        keyPair  = await mnemonicToWalletKey(mnemonic); 

        walletV3 = blockchain.openContract(await WalletV3.fromInit(BigInt("0x" + keyPair.publicKey.toString("hex"))));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await walletV3.send(
            deployer.getSender(),
            {
                value: toNano('5'),
            },
            null
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: walletV3.address,
            deploy: true,
            success: true,
        });
    });

    it('should send message', async () => {
        const message = internal({ to: deployer.address, value: toNano("1"), body: "hello:)" });
        const requestMessage = await createRequestSendMessage(keyPair.secretKey, await walletV3.getSeqno(), blockchain.now!! + 100, SendMode.PAY_GAS_SEPARATELY, message);
        const sendMessageResult = await walletV3.sendExternal(requestMessage);
        expect(sendMessageResult.transactions).toHaveTransaction({
            to: deployer.address,
            value: toNano(1),
            body: comment("hello:)")
        })
        expect(await walletV3.getSeqno()).toEqual(1n);
        printTransactionFees(sendMessageResult.transactions)
    });

    it('should throw message if wrong signature', async () => {
        const message = internal({ to: deployer.address, value: toNano("1"), body: "hello:)" });
        const requestMessage = await createRequestSendMessage(keyPair.secretKey, (await walletV3.getSeqno()) + 1n, blockchain.now!! + 100, SendMode.PAY_GAS_SEPARATELY, message);
      
        await expect(walletV3.sendExternal(requestMessage)).rejects.toThrow();

        expect(await walletV3.getSeqno()).toEqual(0n);
    });
});


const createRequestSendMessage = async (privateKey: Buffer, seqno: number | bigint, validUntil: number | bigint, mode: SendMode, message: MessageRelaxed): Promise<RequestSendMessage> => {
    const msgCell = beginCell().store(storeMessageRelaxed(message)).asCell();
    const hash = beginCell().storeUint(seqno, 32).storeUint(validUntil, 32).storeUint(mode, 8).storeRef(msgCell).endCell().hash();
    const signature = sign(hash, privateKey);
    return {
        $$type: "RequestSendMessage",
        signature,
        seqno: BigInt(seqno),
        validUntil: BigInt(validUntil),
        mode: BigInt(mode),
        message: msgCell
    }
}