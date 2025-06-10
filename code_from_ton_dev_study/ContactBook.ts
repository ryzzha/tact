import { Blockchain, printTransactionFees, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, beginCell, comment, Dictionary, toNano } from '@ton/core';
import { ContactBook, ContactBookStat } from '../wrappers/ContactBook';
import '@ton/test-utils';
import { randomAddress } from '@ton/test-utils';

function createBook(list: Address[]) {
    const stat: ContactBookStat = {
        $$type: "ContactBookStat",
        incoming: 0n, 
        outcoming: 0n,
    };
    let dict: Dictionary<Address, ContactBookStat> = Dictionary.empty();
    for(let addr of list) {
        dict.set(addr, stat);
    }
    return dict;
}

function randAddressList(len: number) {
    let list: Address[] = [];
    for (let index = 0; index < len; index++) {
        list.push(randomAddress());
    }
    return list;
}

describe('ContactBook', () => {
    let blockchain: Blockchain;
    let owner: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;
    let contactBook: SandboxContract<ContactBook>;
    let list: Address[];
    let dict: Dictionary<Address, ContactBookStat>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        owner = await blockchain.treasury('deployer');
        user = await blockchain.treasury('user');

        list = randAddressList(10)
        dict = createBook(list)

        contactBook = blockchain.openContract(await ContactBook.fromInit(owner.address, dict, 10n));

        const deployResult = await contactBook.send(
            owner.getSender(),
            {
                value: toNano('0.05'),
            },
            null
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: owner.address,
            to: contactBook.address,
            deploy: true,
            success: true,
        });
    });

    it('should add/remove addresses', async () => {
        expect(await contactBook.getAddressStat(user.address)).toBeNull();
        let res = await contactBook.send(owner.getSender(), {value: toNano("0.05")}, {$$type: "AddContactMessage", address: user.address})
        expect(res.transactions).toHaveTransaction({
            to: contactBook.address,
            success: true
        })
        expect(await contactBook.getAddressStat(user.address)).toEqual({ $$type: "ContactBookStat", incoming: 0n, outcoming: 0n });
        res = await contactBook.send(owner.getSender(), {value: toNano("0.05")}, {$$type: "RemoveContactMessage", address: user.address})
        expect(await contactBook.getAddressStat(user.address)).toBeNull();
    });
    it("should broadcast", async () => {
        let res = await contactBook.send(owner.getSender(), {value: toNano("12")}, {$$type: "BroadcastMessage", comment: "Hello", value: toNano(1)})
        printTransactionFees(res.transactions);
        for(let addr of list) {
            expect(res.transactions).toHaveTransaction({
                to: addr,
                from: contactBook.address,
                body: comment("Hello")
            })
            expect(await contactBook.getAddressStat(addr)).toEqual({ $$type: "ContactBookStat", incoming: 0n, outcoming: 1n });
        }
    })

    it('should send message to a contact', async () => {
        await contactBook.send(owner.getSender(), { value: toNano("0.05") }, {
            $$type: "AddContactMessage",
            address: user.address,
        });
    
        const res = await contactBook.send(owner.getSender(), { value: toNano("0.05") }, {
            $$type: "SendToContactMessage",
            to: user.address,
            body: comment("Hello"),
        });
    
        expect(res.transactions).toHaveTransaction({
            to: user.address,
            body: comment("Hello"),
            // body: beginCell()
            // .storeUint(0x01, 8)
            // .storeStringTail("Hello") 
            // .endCell()
        });
    
        const stat = await contactBook.getAddressStat(user.address);
        expect(stat).toEqual({
            $$type: "ContactBookStat",
            incoming: 0n,
            outcoming: 1n,
        });
    });

    it('should send message to a owner', async () => {
        await contactBook.send(owner.getSender(), { value: toNano("0.05") }, {
            $$type: "AddContactMessage",
            address: user.address,
        });
    
        const res = await contactBook.send(user.getSender(), { value: toNano("0.05") }, ":)");
    
        expect(res.transactions).toHaveTransaction({
            from: contactBook.address,
            to: owner.address,
            body: comment(":)"),
            // body: beginCell()
            // .storeUint(0x01, 8)
            // .storeStringTail("Hello") 
            // .endCell()
        });
    
        const stat = await contactBook.getAddressStat(user.address);
        expect(stat).toEqual({
            $$type: "ContactBookStat",
            incoming: 1n,
            outcoming: 0n,
        });
    });
});
