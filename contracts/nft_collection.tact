import "@stdlib/deploy";
import "@stdlib/ownable";
import "./nft_item";

struct CollectionData {
    owner_address: Address;
    collection_content: Cell;
    next_item_index: Int as uint32;
}

contract NftCollection with Deployable, Ownable {
    const minTonForStorage: Int = ton("0.03");
    const gasConsumption: Int = ton("0.03");

    owner: Address;
    next_item_index: Int as uint32 = 0;
    collection_content: String;

    init() {
        self.owner = sender();
        self.collection_content = "simple nft collection";
    }

    receive("Mint") {
        self.requireOwner();
        self.mint(sender());
    }

    fun mint(receiver: Address) {
        require(self.next_item_index >= 0, "non-sequential nft");
        let nft_init: StateInit = self.getNftItemInit(self.next_item_index);
        let msgValue: Int = context().value;
        dump(msgValue);
        let tonBalanceBeforeMsg: Int = myBalance() - msgValue;
        dump(tonBalanceBeforeMsg);
        let storageFee: Int = self.minTonForStorage - min(tonBalanceBeforeMsg, self.minTonForStorage);
        dump(storageFee);
        msgValue = msgValue - (storageFee + self.gasConsumption);
        dump(msgValue);

        send(SendParameters{
            to: contractAddress(nft_init),
            value: msgValue,
            mode: SendIgnoreErrors,
            body: Transfer{ query_id: 0, new_owner: receiver }.toCell(),
            code: nft_init.code,
            data: nft_init.data,
        });

        self.next_item_index = self.next_item_index + 1;
    }

    fun getNftItemInit(item_index: Int): StateInit {
        let b: StringBuilder = beginString();
        b.append("item: ");
        b.append(item_index.toString());

        return initOf NftItem(self.owner, myAddress(), item_index, b.toString());
    }

    get fun get_nft_address_by_index(item_index: Int): Address {
        let initCode: StateInit = self.getNftItemInit(item_index);
        return contractAddress(initCode);
    }

    get fun collection_data(): CollectionData {
        return CollectionData{
            owner_address: self.owner,
            collection_content: self.collection_content.asSlice().asCell(),
            next_item_index: self.next_item_index
        }
    }
}
