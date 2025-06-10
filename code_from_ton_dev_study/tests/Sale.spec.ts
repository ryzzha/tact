import { Address, Cell, beginCell, comment, toNano } from '@ton/core';
import { NftSale } from '../wrappers/Sale';
import { JettonMinter } from '../wrappers/JettonMinter';
import { NFTCollection } from '../wrappers/NFTCollection';
import { JettonWallet } from '../wrappers/JettonWallet';
import { NFTItem } from '../wrappers/NFTItem';
import { inspect } from 'util';
import '@ton/test-utils';
import { NFTCollectionCode, NFTItemCode } from '../wrappers/constants';
import { compile } from '@ton/blueprint';
import { Blockchain, printTransactionFees, SandboxContract, TreasuryContract } from '@ton/sandbox';

describe('sale', () => {
    let blockchain: Blockchain;

    let seller: SandboxContract<TreasuryContract>;
    let royalty: SandboxContract<TreasuryContract>;
    let buyer: SandboxContract<TreasuryContract>;
    let service_address = Address.parse('EQCXClzJ0HFilRoB0iYBWF-VGqcuSFtUVkQZ-sNjAZoN8Hfc');

    let sale: SandboxContract<NftSale>;

    let collection: SandboxContract<NFTCollection>;

    let nft_item: SandboxContract<NFTItem>;
    let another_nft_item: SandboxContract<NFTItem>;

    let jetton: SandboxContract<JettonMinter>;

    let seller_wallet: SandboxContract<JettonWallet>;
    let buyer_wallet: SandboxContract<JettonWallet>;
    let sale_wallet: SandboxContract<JettonWallet>;
    let service_wallet: SandboxContract<JettonWallet>;
    let royalty_wallet: SandboxContract<JettonWallet>;

    let wrong_jetton: SandboxContract<JettonMinter>;

    let buyer_wrong_wallet: SandboxContract<JettonWallet>;
    let sale_wrong_wallet: SandboxContract<JettonWallet>;

    let jettonMinterCode: Cell;
    let jettonWalletCode: Cell;

    beforeAll(async () => {
        jettonMinterCode = await compile('JettonMinter');
        jettonWalletCode = await compile('JettonWallet');
    });

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        seller = await blockchain.treasury('seller');
        royalty = await blockchain.treasury('royalty');
        buyer = await blockchain.treasury('buyer');
        collection = blockchain.openContract(
            NFTCollection.createFromConfig(
                {
                    owner: royalty.address,
                    offchainContent: 'link',
                    itemBaseOffchainPrefix: '',
                    itemCode: NFTItemCode,
                    royalty: { factor: 4, base: 100, address: royalty.address },
                },
                NFTCollectionCode,
            ),
        );

        await collection.sendMintBody(royalty.getSender(), {
            itemIndex: 0n,
            passAmount: toNano('0.05'),
            itemContent: '',
            itemOwnerAddress: seller.address,
        });
        await collection.sendMintBody(royalty.getSender(), {
            itemIndex: 1n,
            passAmount: toNano('0.05'),
            itemContent: '',
            itemOwnerAddress: seller.address,
        });

        nft_item = blockchain.openContract(NFTItem.createFromAddress(await collection.getNftAddressByIndex(0)));
        another_nft_item = blockchain.openContract(NFTItem.createFromAddress(await collection.getNftAddressByIndex(1)));

        jetton = blockchain.openContract(
            JettonMinter.createFromConfig(
                { admin: royalty.address, wallet_code: jettonWalletCode, jetton_content: Cell.EMPTY },
                jettonMinterCode,
            ),
        );
        wrong_jetton = blockchain.openContract(
            JettonMinter.createFromConfig(
                { admin: royalty.address, wallet_code: jettonWalletCode, jetton_content: comment('wrong') },
                jettonMinterCode,
            ),
        );

        await jetton.sendDeploy(royalty.getSender(), toNano('10'));
        await wrong_jetton.sendDeploy(royalty.getSender(), toNano('10'));

        let res = await jetton.sendMint(
            royalty.getSender(),
            buyer.address,
            toNano(1000),
            null,
            royalty.address,
            null,
            1n,
        );
        printTransactionFees(res.transactions);
        await wrong_jetton.sendMint(
            royalty.getSender(),
            buyer.address,
            toNano(1000),
            null,
            royalty.address,
            null,
            1n,
            toNano('0.1'),
        );

        seller_wallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jetton.getWalletAddress(seller.address)),
        );
        buyer_wallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jetton.getWalletAddress(buyer.address)),
        );
        buyer_wrong_wallet = blockchain.openContract(
            JettonWallet.createFromAddress(await wrong_jetton.getWalletAddress(buyer.address)),
        );

        expect((await buyer_wallet.getWalletData()).balance).toEqual(toNano(1000));
        expect((await buyer_wrong_wallet.getWalletData()).balance).toEqual(toNano(1000));

        sale = blockchain.openContract(
            await NftSale.fromInit(0n, seller.address, nft_item.address, toNano(100), 4n, 100n, royalty.address),
        );

        sale_wallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jetton.getWalletAddress(sale.address)),
        );
        sale_wrong_wallet = blockchain.openContract(
            JettonWallet.createFromAddress(await wrong_jetton.getWalletAddress(sale.address)),
        );
        service_wallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jetton.getWalletAddress(service_address)),
        );
        royalty_wallet = blockchain.openContract(
            JettonWallet.createFromAddress(await jetton.getWalletAddress(royalty.address)),
        );

        await sale.send(
            seller.getSender(),
            { value: toNano('0.2'), bounce: false },
            { $$type: 'SetWalletAddress', walletAddress: sale_wallet.address },
        );
    });
    it('should deploy', async () => {
        let result = await sale.getGetSaleInfo();
        console.log(inspect(result, true, null, true));
        expect(result.jettonWallet?.equals(sale_wallet.address)).toBeTruthy();
        expect(result.priceInfo.fullPrice).toEqual(toNano(100) + toNano('1.1') + toNano(4));
    });
    it('should receive nft', async () => {
        await nft_item.sendTransferBody(seller.getSender(), {
            newOwner: sale.address,
            responseDestination: seller.address,
            forwardAmount: toNano('0.06'),
            forwardPayload: null,
        });

        expect((await sale.getGetSaleInfo()).nftReceived).toBeTruthy();
    });
    it('should send wrong nft back', async () => {
        await another_nft_item.sendTransferBody(seller.getSender(), {
            newOwner: sale.address,
            responseDestination: seller.address,
            forwardAmount: toNano('0.06'),
            forwardPayload: null,
        });

        expect((await sale.getGetSaleInfo()).nftReceived).toBeFalsy();
        expect((await another_nft_item.getNftData()).ownerAddress!!).toEqualAddress(seller.address);
    });
    it('should be able to cancel', async () => {
        await nft_item.sendTransferBody(seller.getSender(), {
            newOwner: sale.address,
            responseDestination: seller.address,
            forwardAmount: toNano('0.06'),
            forwardPayload: null,
        });

        await sale.send(seller.getSender(), { value: toNano('0.03') }, 'Cancel');

        expect((await nft_item.getNftData()).ownerAddress!!.equals(seller.address)).toBeTruthy();
        expect((await sale.getGetSaleInfo()).nftReceived).toBeFalsy();
        expect((await sale.getGetSaleInfo()).saleEnded).toBeTruthy();
    });
    it('should process sale with exact amount of tokens', async () => {
        await nft_item.sendTransferBody(seller.getSender(), {
            newOwner: sale.address,
            responseDestination: seller.address,
            forwardAmount: toNano('0.06'),
            forwardPayload: null,
        });

        let res = await buyer_wallet.sendTransfer(
            buyer.getSender(),
            toNano('0.5'),
            (await sale.getGetPriceInfo()).fullPrice,
            sale.address,
            buyer.address,
            null,
            toNano('0.4'),
        );
        printTransactionFees(res.transactions);

        expect((await nft_item.getNftData()).ownerAddress!!).toEqualAddress(buyer.address);
        expect((await royalty_wallet.getWalletData()).balance).toEqual(toNano(4));
        expect((await service_wallet.getWalletData()).balance).toEqual(toNano('1.1'));
        expect((await seller_wallet.getWalletData()).balance).toEqual(toNano(100));
        expect((await sale.getGetSaleInfo()).nftReceived).toBeFalsy();
        expect((await sale.getGetSaleInfo()).saleEnded).toBeTruthy();
    });
    it('should process sale with a big amount of tokens', async () => {
        await nft_item.sendTransferBody(seller.getSender(), {
            newOwner: sale.address,
            responseDestination: seller.address,
            forwardAmount: toNano('0.06'),
            forwardPayload: null,
        });

        let res = await buyer_wallet.sendTransfer(
            buyer.getSender(),
            toNano('0.5'),
            toNano(200),
            sale.address,
            buyer.address,
            null,
            toNano('0.4'),
        );

        expect((await nft_item.getNftData()).ownerAddress!!).toEqualAddress(buyer.address);
        expect((await royalty_wallet.getWalletData()).balance).toEqual(toNano(4));
        expect((await service_wallet.getWalletData()).balance).toEqual(toNano('1.1'));
        expect((await seller_wallet.getWalletData()).balance).toEqual(toNano(100));
        expect((await sale_wallet.getWalletData()).balance).toEqual(toNano(0));
        expect((await buyer_wallet.getWalletData()).balance).toEqual(
            toNano(1000) - (await sale.getGetPriceInfo()).fullPrice,
        );
        expect((await sale.getGetSaleInfo()).nftReceived).toBeFalsy();
        expect((await sale.getGetSaleInfo()).saleEnded).toBeTruthy();
    });
    it('should return tokens if small value received', async () => {
        await nft_item.sendTransferBody(seller.getSender(), {
            newOwner: sale.address,
            responseDestination: seller.address,
            forwardAmount: toNano('0.06'),
            forwardPayload: null,
        });

        let res = await buyer_wallet.sendTransfer(
            buyer.getSender(),
            toNano('0.5'),
            toNano(100),
            sale.address,
            buyer.address,
            null,
            toNano('0.4'),
        );

        expect((await buyer_wallet.getWalletData()).balance).toEqual(toNano(1000));
    });
    it('should return tokens if small amount of toncoins received', async () => {
        await nft_item.sendTransferBody(seller.getSender(), {
            newOwner: sale.address,
            responseDestination: seller.address,
            forwardAmount: toNano('0.06'),
            forwardPayload: null,
        });

        let res = await buyer_wallet.sendTransfer(
            buyer.getSender(),
            toNano('0.5'),
            toNano(110),
            sale.address,
            buyer.address,
            null,
            toNano('0.2'),
        );

        expect((await buyer_wallet.getWalletData()).balance).toEqual(toNano(1000));
    });
    it('should return tokens if buyer sent wrong tokens', async () => {
        await nft_item.sendTransferBody(seller.getSender(), {
            newOwner: sale.address,
            responseDestination: seller.address,
            forwardAmount: toNano('0.06'),
            forwardPayload: null,
        });

        await buyer_wrong_wallet.sendTransfer(
            buyer.getSender(),
            toNano('0.5'),
            (await sale.getGetPriceInfo()).fullPrice,
            sale.address,
            buyer.address,
            null,
            toNano('0.4'),
        );

        expect((await buyer_wrong_wallet.getWalletData()).balance).toEqual(toNano(1000));
    });
    it("should return tokens if seller hasn't sent nft", async () => {
        let res = await buyer_wallet.sendTransfer(
            buyer.getSender(),
            toNano('0.5'),
            (await sale.getGetPriceInfo()).fullPrice,
            sale.address,
            buyer.address,
            null,
            toNano('0.4'),
        );

        expect((await buyer_wallet.getWalletData()).balance).toEqual(toNano(1000));
    });
});
