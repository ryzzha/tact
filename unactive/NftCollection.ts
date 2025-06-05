// import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
// import { toNano } from '@ton/core';
// import { NftCollection } from '../wrappers/NftCollection';
// import '@ton/test-utils';
// import { NftItem } from '../wrappers/NftItem';

// describe.skip('NftCollection', () => {
//     let blockchain: Blockchain;
//     let deployer: SandboxContract<TreasuryContract>;
//     let user: SandboxContract<TreasuryContract>;
//     let nftCollection: SandboxContract<NftCollection>;

//     beforeEach(async () => {
//         blockchain = await Blockchain.create();

//         nftCollection = blockchain.openContract(await NftCollection.fromInit());

//         deployer = await blockchain.treasury('deployer');
//         user = await blockchain.treasury('user');

//         const deployResult = await nftCollection.send(
//             deployer.getSender(),
//             {
//                 value: toNano('0.05'),
//             },
//             {
//                 $$type: 'Deploy',
//                 queryId: 0n,
//             }
//         );

//         expect(deployResult.transactions).toHaveTransaction({
//             from: deployer.address,
//             to: nftCollection.address,
//             deploy: true,
//             success: true,
//         });
//     });

//     it('should deploy', async () => {});

//     it('should can mint', async () => {
//         await nftCollection.send(
//             deployer.getSender(),
//             {
//                 value: toNano("0.5")
//             },
//             'Mint'
//         );

//         await nftCollection.send(
//             deployer.getSender(),
//             {
//                 value: toNano("0.5")
//             },
//             'Mint'
//         );

//         const nftItemAddress1 = await nftCollection.getGetNftAddressByIndex(0n);
//         const nftItem1: SandboxContract<NftItem> = blockchain.openContract(NftItem.fromAddress(nftItemAddress1));

//         const nftItemData1 = await nftItem1.getItemData();

//         // console.log("firstNftData: ");
//         // console.log(nftItemData1);

//         const nftItemAddress2 = await nftCollection.getGetNftAddressByIndex(1n);
//         const nftItem2: SandboxContract<NftItem> = blockchain.openContract(NftItem.fromAddress(nftItemAddress2));

//         const nftItemData2Before = await nftItem2.getItemData();

//         // console.log("secondNftData before transfer: ");
//         // console.log(nftItemData2Before);

//         await nftItem2.send(
//             deployer.getSender(),
//             {
//                 value:toNano("0.5")
//             },
//             {
//                 $$type: "Transfer",
//                 new_owner: user.address,
//                 query_id: 3n
//             }
//         )

//         const nftItemData2After = await nftItem2.getItemData();

//         // console.log("secondNftData after transfer: ");
//         // console.log(nftItemData2After);

//         // console.log(nftItemData2After.induvidual_content.beginParse().loadStringTail());
//     });
// });
